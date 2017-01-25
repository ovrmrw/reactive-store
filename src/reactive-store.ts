require('setimmediate')
const asap = require('asap') as (func: Function) => void
const cloneDeep = require('lodash.clonedeep')

import { Observable, Subject, BehaviorSubject } from 'rxjs'

import { Action, ValueOrResolver, PartialValueOrResolver, RecursiveReadonly, LoopType, StoreOptions } from './common'
import { IReactiveStore } from './interfaces'

import './add/operator/all'

export const latestUpdatedKey = '__latest__'


export class ReactiveStore<T> implements IReactiveStore<T> {
  private _dispatcher$ = new Subject<Action>()
  private _provider$: BehaviorSubject<T | RecursiveReadonly<T>>

  private _concurrent: number
  private _loopType: number
  private _output: boolean
  private _ngZone: any // (NgZone | null) for Angular 2+
  private _testing: boolean

  private _freezedInitialState: Readonly<T>


  constructor(
    private initialState: T,
    private options?: StoreOptions,
  ) {
    const o = options || {}
    this._concurrent = o.concurrent || 1
    this._loopType = o.loopType || LoopType.asap
    this._output = o.output || false
    this._ngZone = o.ngZone && 'run' in o.ngZone ? o.ngZone : null
    this._testing = o.testing || false

    const obj = initialState || {}
    this._freezedInitialState = cloneDeep(obj)
    this._provider$ = new BehaviorSubject<T>(cloneDeep(obj))
    this.createStore()
    this.applyEffectors()
  }


  private createStore(): void {
    const queue$ =
      this._dispatcher$
        .concatMap(action => { // resolve outer callback.
          if (action.value instanceof Function) {
            return this.getter().take(1)
              .map(state => {
                action.value = action.value.call(null, state[action.key], state)
                return action
              })
          } else {
            return Observable.of(action)
          }
        })
        .mergeMap(action => { // resolve async.
          if (action.value instanceof Promise || action.value instanceof Observable) {
            return Observable.from(action.value)
              .mergeMap(value => Observable.of(Object.assign(action, { value })))
          } else {
            return Observable.of(action)
          }
        }, this._concurrent)


    const reduced$ =
      queue$
        .scan((state, action) => {
          let temp: any
          if (action.value instanceof Function) { // resolve inner callback.
            temp = action.value.call(null, state[action.key], state)
          } else {
            temp = action.value
          }

          if (temp instanceof Object && !(temp instanceof Array)) { // merge if value is Object.
            state[action.key] = { ...state[action.key], ...temp }
          } else {
            state[action.key] = temp
          }
          state[latestUpdatedKey] = action.key

          const newState = Object.assign({}, state)

          if (this._loopType === LoopType.asap) {
            asap(() => action.subject.next(newState))
          } else if (this._loopType === LoopType.setimmediate) {
            setImmediate(() => action.subject.next(newState))
          } else {
            setTimeout(() => action.subject.next(newState))
          }

          return newState
        }, this.initialState as T)


    reduced$
      .subscribe(newState => {
        if (this._output) {
          console.log('newState:', newState)
        }

        if (this._ngZone) {
          this._ngZone.run(() => { // for Angular 2+
            this._provider$.next(newState)
          })
        } else {
          this._provider$.next(newState)
        }

        this.effectAfterReduced(newState)
      })
  }


  private effectAfterReduced(state: T): void {

  }


  private applyEffectors(): void {

  }


  /**
   * To set a new value to the specified key.
   */
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this._dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * To set a new partial value to the specified key. Partial value will be merged.
   */
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this._dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * To reset the value under the specified key.
   */
  resetter<K extends keyof T>(key: K): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    const value = this._freezedInitialState[key]
    this._dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0)
      .toPromise()
  }


  /**
   * To get all of the current state as Observable.
   */
  getter(): Observable<T> {
    return this._provider$
  }


  /**
   * To get all of the current state as Promise.
   */
  getterAsPromise(): Promise<T> {
    return this._provider$.take(1).toPromise()
  }


  /**
   * To reset to the initial state just for testing.
   */
  forceResetForTesting(): Promise<void> {
    if (this._testing) {
      console.info('***** RESET ALL STATE FOR TESTING *****')
      const promises = Object.keys(this._freezedInitialState)
        .map((key: keyof T) => {
          return this.resetter(key)
        })
      return Promise.all(promises)
        .then(() => void 0)
        .catch(err => { throw err })
    } else {
      console.error('resetForTesting is not invoked because testing option is not set to true.')
      return Promise.resolve(void 0)
    }
  }


  /**
   * To complete and stop streams just for testing.
   */
  forceCompleteForTesting(): void {
    if (this._testing) {
      this._provider$.complete()
    } else {
      console.error('forceCompleteForTesting is not invoked because testing option is not set to true.')
    }
  }

}

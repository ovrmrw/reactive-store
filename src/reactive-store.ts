require('setimmediate')
const asap = require('asap') as (func: Function) => void
const cloneDeep = require('lodash.clonedeep')

import { Observable, Subject, BehaviorSubject } from 'rxjs'

import { Action, ValueOrResolver, PartialValueOrResolver, RecursiveReadonly, LoopType, StoreOptions } from './common'
import { IReactiveStore } from './interfaces'

import './add/operator/all'

export const latestUpdatedKey = '__latest__'


export class ReactiveStore<T> implements IReactiveStore<T> {
  private dispatcher$ = new Subject<Action>()
  private provider$: BehaviorSubject<T | RecursiveReadonly<T>>

  private concurrent: number
  private loopType: number
  private output: boolean
  private ngZone: any // (NgZone | null) for Angular 2+
  private testing: boolean

  private freezedInitialState: Readonly<T>


  constructor(
    private initialState: T,
    private options?: StoreOptions,
  ) {
    const o = options || {}
    this.concurrent = o.concurrent || 1
    this.loopType = o.loopType || LoopType.asap
    this.output = o.output || false
    this.ngZone = o.ngZone && 'run' in o.ngZone ? o.ngZone : null
    this.testing = o.testing || false

    const obj = initialState || {}
    this.freezedInitialState = cloneDeep(obj)
    this.provider$ = new BehaviorSubject<T>(obj)
    this.createStore()
    this.applyEffectors()
  }


  private createStore(): void {
    const queue$ =
      this.dispatcher$
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
        }, this.concurrent)


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

          if (this.loopType === LoopType.asap) {
            asap(() => action.subject.next(newState))
          } else if (this.loopType === LoopType.setimmediate) {
            setImmediate(() => action.subject.next(newState))
          } else {
            setTimeout(() => action.subject.next(newState))
          }

          return newState
        }, this.initialState as T)


    reduced$
      .subscribe(newState => {
        if (this.output) {
          console.log('newState:', newState)
        }

        if (this.ngZone) {
          this.ngZone.run(() => { // for Angular 2+
            this.provider$.next(newState)
          })
        } else {
          this.provider$.next(newState)
        }

        this.effectAfterReduced(newState)
      })
  }


  private effectAfterReduced(state: T): void {

  }


  private applyEffectors(): void {

  }


  /**
   * Set a new value to the specified key.
   */
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this.dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * Set a new partial value to the specified key. Partial value will be merged.
   */
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this.dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * Reset the value of the specified key.
   */
  resetter<K extends keyof T>(key: K): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    const value = this.freezedInitialState[key]
    this.dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0)
      .toPromise()
  }


  /**
   * Get all of the current state as Observable.
   */
  getter(): Observable<T> {
    return this.provider$
  }


  /**
   * Get all of the current state as Promise.
   */
  getterAsPromise(): Promise<T> {
    return this.provider$.take(1).toPromise()
  }


  /**
   * Reset to the initial state just for testing.
   */
  resetAllStateForTesting(): Promise<void> {
    if (this.testing) {
      console.info('***** RESET ALL STATE FOR TESTING *****')
      const promises = Object.keys(this.freezedInitialState)
        .map((key: keyof T) => {
          return this.resetter(key)
        })
      return Promise.all(promises)
        .then(() => void 0)
        .catch(err => { throw err })
    } else {
      console.log('resetForTesting is not invoked because testing option is not set to true.')
      return Promise.resolve(void 0)
    }
  }

}

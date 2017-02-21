require('setimmediate')
const asap = require('asap') as (func: Function) => void
const cloneDeep = require('lodash.clonedeep') as <T>(obj: T) => T

import { createStore, Store, GenericStoreEnhancer } from 'redux'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/from'
import 'rxjs/add/operator/concatMap'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/take'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/scan'
import 'rxjs/add/operator/toPromise'

import { Action, Next, ValueOrResolver, PartialValueOrResolver, RecursiveReadonly, LoopType, StoreOptions, deepFreeze } from './common'
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
  private _useFreeze: boolean
  private _useRedux: boolean
  private _reduxMiddleware: GenericStoreEnhancer | undefined

  private _initialState: T

  private _reduxStore: Store<T>


  constructor(initialState: T, options?: StoreOptions) {
    const o = options || {}
    this._concurrent = o.concurrent || Number.POSITIVE_INFINITY
    this._loopType = o.loopType || LoopType.asap
    this._output = o.output || false
    this._ngZone = o.ngZone && 'run' in o.ngZone ? o.ngZone : null
    this._testing = o.testing || false
    this._useFreeze = o.useFreeze || false
    this._useRedux = o.useRedux || o.reduxMiddleware ? true : false
    this._reduxMiddleware = o.reduxMiddleware || undefined

    const state: T = initialState || {}
    this._initialState = cloneDeep(state)
    this._provider$ = new BehaviorSubject<T>(cloneDeep(state))
    this.createStore()
    this.applyEffectors()
    this.createReduxStore()
  }


  private createStore(): void {
    const queue$ =
      this._dispatcher$
        .mergeMap(action => { // execute outer callback.
          if (action.value instanceof Function) {
            return this.getter().take(1)
              .map(state => {
                const temp = action.value.call(null, state[action.key], state)
                if (temp instanceof Function || temp instanceof Promise || temp instanceof Observable) {
                  action.value = temp
                  return action // action.value instanceof Function or Promise or Observable
                } else {
                  return action // action.value instanceof Function
                }
              })
          } else {
            return Observable.of(action)
          }
        })
        .mergeMap(action => { // resolve async(Promise or Observable).
          if (action.value instanceof Promise || action.value instanceof Observable) {
            return Observable.from(action.value)
              .map(value => Object.assign(action, { value }) as Action)
          } else {
            return Observable.of(action)
          }
        }, this._concurrent)


    const reduced$ =
      queue$
        .scan((state, action) => {
          let temp: any
          if (action.value instanceof Function) { // execute inner callback.
            temp = action.value.call(null, state[action.key], state)
          } else {
            temp = action.value
          }

          if (temp instanceof Object && !(temp instanceof Array)) { // merge if value is Object.
            // state[action.key] = Object.assign({}, state[action.key], temp)
            state[action.key] = { ...state[action.key], ...temp } // momery-reference is changed.
          } else if (temp instanceof Array) {
            state[action.key] = [...temp] // momery-reference is changed.
          } else {
            state[action.key] = temp
          }
          state[latestUpdatedKey] = action.key

          // const newState: T = Object.assign({}, state)
          const newState: T = { ...state as any }

          const nextObj: Next<T, any> = Object.assign({}, {
            state: newState,
            value: newState[action.key],
          })

          if (this._loopType === LoopType.asap) {
            asap(() => action.subject.next(nextObj))
          } else if (this._loopType === LoopType.setimmediate) {
            setImmediate(() => action.subject.next(nextObj))
          } else {
            setTimeout(() => action.subject.next(nextObj))
          }

          return newState
        }, cloneDeep(this._initialState) as T)


    reduced$
      .subscribe(newState => {
        /* useFreeze option takes much more processing cost. */
        const frozenState = this._useFreeze ? deepFreeze(cloneDeep(newState)) : newState

        if (this._output) {
          console.log('newState:', frozenState)
        }

        if (this._ngZone) {
          this._ngZone.run(() => { // for Angular 2+
            this._provider$.next(frozenState)
          })
        } else {
          this._provider$.next(frozenState)
        }

        this.effectAfterReduced(newState)
        this.dispatchReduxStore(newState)
      })
  }


  private effectAfterReduced(state: T): void {

  }


  private applyEffectors(): void {

  }


  private createReduxStore(): void {
    if (this._useRedux) {
      this._reduxStore = createStore(
        () => this.currentState,
        this.currentState,
        this._reduxMiddleware
      )
    }
  }


  private dispatchReduxStore(state: T): void {
    if (this._useRedux && this._reduxStore) {
      const key = state[latestUpdatedKey]
      const value = state[key]
      this._reduxStore.dispatch({ type: key, payload: value })
    }
  }


  /**
   * To set a new value to the specified key.
   */
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<void | Next<T, K>> {
    const subject = new Subject<Next<T, K> | RecursiveReadonly<Next<T, K>>>()
    this._dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * To set a new partial value to the specified key. Partial value will be merged.
   */
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<void | Next<T, K>> {
    const subject = new Subject<Next<T, K> | RecursiveReadonly<Next<T, K>>>()
    this._dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * To reset the value under the specified key.
   */
  resetter<K extends keyof T>(key: K): Promise<void | Next<T, K>> {
    const subject = new Subject<Next<T, K> | RecursiveReadonly<Next<T, K>>>()
    const value = this._initialState[key]
    this._dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
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
  forceResetForTesting(): Promise<void> | never {
    if (this._testing) {
      if (this._output) {
        console.info('***** RESET ALL STATE FOR TESTING *****')
      }
      const promises = Object.keys(this._initialState)
        .map((key: keyof T) => {
          return this.resetter(key)
        })
      return Promise.all(promises)
        .then(() => void 0)
        .catch(err => { throw err })
    } else {
      throw new Error('resetForTesting is not invoked because testing option is not set to true.')
    }
  }


  /**
   * To complete and stop streams just for testing.
   */
  forceCompleteForTesting(): Promise<void> | never {
    if (this._testing) {
      this._provider$.complete()
      return new Promise(setTimeout)
    } else {
      throw new Error('forceCompleteForTesting is not invoked because testing option is not set to true.')
    }
  }


  /**
   * To get initial state synchronously.
   */
  get initialState(): T {
    const state = cloneDeep(this._initialState)
    const frozenState = this._useFreeze ? deepFreeze(state) : state
    return frozenState
  }


  /**
   * To get current state synchronously.
   */
  get currentState(): T {
    const state = cloneDeep(this._provider$.getValue())
    const frozenState = this._useFreeze ? deepFreeze(state) : state
    return frozenState as T
  }

}

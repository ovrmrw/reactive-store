require('setimmediate')
const asap = require('asap') as (func: Function) => void
const cloneDeep = require('lodash.clonedeep') as <T>(obj: T) => T

import { createStore, Store, GenericStoreEnhancer, Middleware, applyMiddleware, compose } from 'redux'
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
// import 'rxjs/add/operator/do'

import { Action, Next, ValueOrResolver, PartialValueOrResolver, RecursiveReadonly, LoopType, deepFreeze } from './common'
import { StoreOptions, ActionOptions } from './common'
import { IReactiveStore } from './interfaces'
import { simpleLogger } from './middlewares'

import './add/operator/all'

const REDUX_DEVTOOLS_EXTENSION = '__REDUX_DEVTOOLS_EXTENSION__'

export const latestUpdatedKey = '__latest__'
const descriptionKey = '__description__'



export class ReactiveStore<T> implements IReactiveStore<T> {
  private _dispatcher$ = new Subject<Action>()
  private _provider$: BehaviorSubject<T | RecursiveReadonly<T>>

  private _concurrent: number
  private _loopType: number
  private _output: boolean
  private _ngZone: any // (NgZone | null) for Angular 2+
  private _testing: boolean
  private _useFreeze: boolean
  private _reduxApplyMiddleware: GenericStoreEnhancer | undefined
  private _reduxMiddlewares: Middleware[]
  private _useReduxDevToolsExtension: boolean

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
    this._reduxApplyMiddleware = o.reduxApplyMiddleware || undefined
    this._reduxMiddlewares = o.reduxMiddlewares || []
    this._useReduxDevToolsExtension = o.useReduxDevToolsExtension || false

    const state: T = initialState || {}
    this._initialState = cloneDeep(state)
    this._provider$ = new BehaviorSubject<T>(cloneDeep(state))
    this.createReduxStore()
    this.createStore()
    this.applyEffectors()
  }


  private createStore(): void {
    const queue$ =
      this._dispatcher$
        .concatMap(action => { // execute outer callback.
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
            action.options.desc = action.options.desc ? action.options.desc + ' (ASYNC)' : '(ASYNC)'
            // this._reduxStore.dispatch({ type: description + '#AsyncStart ' + id }) // if dispatch here, tick timing will be crushed.
            return Observable.from(action.value)
              .map(value => Object.assign(action, { value }) as Action)
          } else {
            return Observable.of(action)
          }
        }, this._concurrent)


    const scanned$ =
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
          state[descriptionKey] = action.options.desc

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


    scanned$
      .subscribe(state => {
        const key = state[latestUpdatedKey]
        const value = state[key]
        const description = 'KEY: ' + key + (state[descriptionKey] ? ' - ' + state[descriptionKey] : '')

        this._reduxStore.dispatch({
          type: description,
          key,
          value,
          state
        })

        this.effectAfterReduced(state)
      })


    this._reduxStore
      .subscribe(() => {
        const state = this._reduxStore.getState()
        if (state === undefined) { return } // don't update provider$ when state is undefined.

        const frozenState = this._useFreeze ? deepFreeze(cloneDeep(state)) : state

        if (this._ngZone) {
          this._ngZone.run(() => { // for Angular 2+
            this._provider$.next(frozenState)
          })
        } else {
          this._provider$.next(frozenState)
        }
      })
  }


  private effectAfterReduced(state: T): void {

  }


  private applyEffectors(): void {

  }


  private createReduxStore(): void {
    const middleware = this._reduxApplyMiddleware ?
      this._reduxApplyMiddleware :
      applyMiddleware(...this._reduxMiddlewares)

    let reduxDevToolsExtension: GenericStoreEnhancer = applyMiddleware()
    try {
      this._useReduxDevToolsExtension && window && window[REDUX_DEVTOOLS_EXTENSION] ?
        reduxDevToolsExtension = window[REDUX_DEVTOOLS_EXTENSION]() as GenericStoreEnhancer :
        () => { }
    } catch (err) {
      console.error(err.message) // if running on Node.js this will show "ReferenceError: window is not defined"
    }

    this._reduxStore = createStore(
      (state, action) => state = { ...action.state }, // reducer
      this.initialState,
      compose(
        middleware,
        this._output ?
          applyMiddleware(simpleLogger) :
          applyMiddleware(),
        reduxDevToolsExtension,
      )
    )
  }



  /**
   * To set a new value to the specified key.
   */
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>, options: ActionOptions = {}): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this._dispatcher$.next({ key, value, subject, options: initActionOptions(options) })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * To set a new partial value to the specified key. Partial value will be merged.
   */
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>, options: ActionOptions = {}): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this._dispatcher$.next({ key, value, subject, options: initActionOptions(options) })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  /**
   * To reset the value under the specified key.
   */
  resetter<K extends keyof T>(key: K, options: ActionOptions = {}): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    const value = this._initialState[key]
    this._dispatcher$.next({ key, value, subject, options: initActionOptions(options) })
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



///////////////////////////////////// Helpers
function initActionOptions(options: ActionOptions): ActionOptions {
  options.desc = options.desc ? options.desc : ''
  return options
}

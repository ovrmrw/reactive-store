require('setimmediate')
const asap = require('asap') as (func: Function) => void

import { Observable, Subject, BehaviorSubject } from 'rxjs'

import { Action, ValueOrResolver, PartialValueOrResolver, RecursiveReadonly, LoopType, StoreOptions } from './common'

import './add/operator/all'

export const latestUpdatedKey = '__latest__'


export class ReactiveStore<T> {
  private dispatcher$ = new Subject<Action>()
  private provider$: BehaviorSubject<T | RecursiveReadonly<T>>

  private concurrent: number
  private loopType: number
  private output: boolean
  private ngZone: any // (NgZone | null) for Angular 2+


  constructor(
    private initialState: T,
    private options?: StoreOptions,
    // private concurrent: number = 1,
    // private loopType: number = LoopType.asap,
    // private output: boolean = false,
  ) {
    const o = options || {}
    this.concurrent = o.concurrent || 1
    this.loopType = o.loopType || LoopType.asap
    this.output = o.output || false
    this.ngZone = o.ngZone && 'run' in o.ngZone ? o.ngZone : null

    this.provider$ = new BehaviorSubject<T>(initialState || {} as T)
    this.createStore()
    this.applyEffectors()
  }


  private createStore(): void {
    const queue$ =
      this.dispatcher$
        .concatMap(action => { // resolve outer callback.
          if (action.value instanceof Function) {
            return this.getterAsPromise()
              .then(state => {
                action.value = action.value.call(null, state[action.key], state)
                return action
              })
          } else {
            return Promise.resolve(action)
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
            asap(() => {
              action.subject.next(newState)
            })
          } else if (this.loopType === LoopType.setimmediate) {
            setImmediate(() => {
              action.subject.next(newState)
            })
          } else {
            setTimeout(() => {
              action.subject.next(newState)
            }, 0)
          }

          return newState
        }, this.initialState as T)


    reduced$
      .subscribe(newState => {
        if (this.output) {
          console.log('newState:', newState)
        }

        if (this.ngZone) {
          this.ngZone.run(() => {
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


  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this.dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<void> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this.dispatcher$.next({ key, value, subject })
    return subject.take(1)
      .mapTo(void 0) // experimental
      .toPromise()
  }


  getter(): Observable<T> {
    return this.provider$
  }


  getterAsPromise(): Promise<T> {
    return this.provider$.take(1).toPromise()
  }

}

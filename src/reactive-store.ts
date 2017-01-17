const asap = require('asap') as (func: Function) => void
import { Observable, Subject, BehaviorSubject } from 'rxjs'

import { Action, ValueOrResolver, PartialValueOrResolver, RecursiveReadonly } from './common'

import './add/operator/all'

export const latestUpdatedKey = '__latest__'


export class ReactiveStore<T> {
  private simpleStore$ = new Subject<Action>()
  private provider$: BehaviorSubject<T | RecursiveReadonly<T>>


  constructor(
    private initialState: T,
    private concurrent?: number,
  ) {
    this.provider$ = new BehaviorSubject<T>(initialState || {} as T)
    this.createStore()
    this.applyEffectors()
  }


  private createStore(): void {
    const queue$ =
      this.simpleStore$
        .concatMap(action => { // resolve outer callback.
          if (action.value instanceof Function) {
            return this.getterAsPromise()
              .then(state => {
                action.value = action.value.call(null, state[action.key])
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
        }, (this.concurrent || 1))

    const reduced$ =
      queue$
        .scan((state, action) => {
          let temp: any
          if (action.value instanceof Function) { // resolve inner callback.
            temp = action.value.call(null, state[action.key])
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
          asap(() => {
            action.subject.next(newState)
          })
          return newState
        }, this.initialState as T)

    reduced$
      .subscribe(newState => {
        console.log('newState:', newState)
        this.provider$.next(newState)
        this.effectAfterReduced(newState)
      })
  }


  private effectAfterReduced(state: T): void {

  }


  private applyEffectors(): void {

  }


  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<T> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this.simpleStore$.next({ key, value, subject })
    return subject.take(1).toPromise()
  }


  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<T> {
    const subject = new Subject<T | RecursiveReadonly<T>>()
    this.simpleStore$.next({ key, value, subject })
    return subject.take(1).toPromise()
  }


  getter(): Observable<T> {
    return this.provider$
  }


  getterAsPromise(): Promise<T> {
    return this.provider$.take(1).toPromise()
  }

}

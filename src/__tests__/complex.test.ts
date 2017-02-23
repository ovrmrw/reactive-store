import * as createLogger from 'redux-logger'
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/delay'

import { ReactiveStore, createReactiveStoreAsSingleton, createObjectKeys, LoopType, Middleware } from '../index'


interface AppState {
  increment: IncrementState,
  timestamp: number,
  array: number[],
}

interface IncrementState {
  counter: number,
}

const initialState: AppState = {
  increment: {
    counter: 0,
  },
  timestamp: 0,
  array: [1, 2],
}

const KEY = createObjectKeys(initialState)



describe('Complex test for concurrent: 1', () => {
  let store: ReactiveStore<AppState>


  beforeEach(() => {
    store = new ReactiveStore(initialState, {
      concurrent: 1,
    })
  })


  it('at the same time', async () => {
    const promises = [
      store.setter(KEY.array, (p) => [...p, 3]),
      store.setter(KEY.array, (p) => [...p, 4]),
      store.setter(KEY.array, (p) => p.slice(1)),
    ]
    await Promise.all(promises)
    const state = await store.getterAsPromise()
    expect(state.array).toEqual([2, 3, 4])
  })


  it('several updates', async () => {
    const promises = [
      store.setter(KEY.array, Observable.of((p) => [...p, 3]).delay(20)),
      store.setter(KEY.array, Observable.of((p) => [...p, 4]).delay(10)),
      store.setter(KEY.array, Observable.of((p) => [...p, 5])),
      store.setter(KEY.array, (p) => [...p, 6]),
    ]
    await Promise.all(promises)
    const state = await store.getterAsPromise()
    expect(state.array).toEqual([1, 2, 3, 4, 5, 6])
  })

})



describe('Complex test for concurrent: Number.POSITIVE_INFINITY', () => {
  let store: ReactiveStore<AppState>


  beforeEach(() => {
    store = new ReactiveStore(initialState, {
      concurrent: Number.POSITIVE_INFINITY,
      reduxMiddlewares: [createLogger()] as Middleware[],
    })
  })


  it('several updates', async () => {
    const promises = [
      store.setter(KEY.array, Observable.of((p) => [...p, 3]).delay(20), { desc: 'this is final action' }),
      store.setter(KEY.array, Observable.of((p) => [...p, 4]).delay(10)),
      store.setter(KEY.array, Observable.of((p) => [...p, 5])),
      store.setter(KEY.array, (p) => [...p, 6]),
    ]
    await Promise.all(promises)
    const state = await store.getterAsPromise()
    expect(state.array).toEqual([1, 2, 5, 6, 4, 3])
  })

})

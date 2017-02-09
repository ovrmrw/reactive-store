import { Observable } from 'rxjs/Rx'

import { ReactiveStore, getReactiveStoreAsSingleton, getObjectKeys, LoopType } from '../index'


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

const KEY = getObjectKeys(initialState)




describe('Complex test for concurrent: 1', () => {
  let store: ReactiveStore<AppState>


  beforeEach(() => {
    store = new ReactiveStore(initialState, {
      concurrent: 1,
      output: true,
      // useFreeze: true,
    })
  })


  it('several updates', async () => {
    const promises = [
      store.setter(KEY.array, Observable.of((p) => [...p, 3]).delay(20)),
      store.setter(KEY.array, Observable.of((p) => [...p, 4]).delay(10)),
      store.setter(KEY.array, Observable.of((p) => [...p, 5])),
      store.setter(KEY.array, () => (p) => [...p, 6]),
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
      output: true,
      // useFreeze: true,
    })
  })


  it('several updates', async () => {
    const promises = [
      store.setter(KEY.array, Observable.of((p) => [...p, 3]).delay(20)),
      store.setter(KEY.array, Observable.of((p) => [...p, 4]).delay(10)),
      store.setter(KEY.array, Observable.of((p) => [...p, 5])),
      store.setter(KEY.array, () => (p) => [...p, 6]),
    ]
    await Promise.all(promises)
    const state = await store.getterAsPromise()
    expect(state.array).toEqual([1, 2, 5, 6, 4, 3])
  })

})

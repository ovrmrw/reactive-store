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


describe('Basic test', () => {
  let store: ReactiveStore<AppState>


  beforeEach(() => {
    store = new ReactiveStore(initialState, {
      concurrent: Number.POSITIVE_INFINITY, // DEFAULT: 1
      // output: true, // DEFAULT: false
      // useFreeze: true, // DEFAULT: false
    })
  })


  it('initial state', async () => {
    const state = await store.getterAsPromise()
    expect(state).toEqual({ increment: { counter: 0 }, timestamp: 0, array: [1, 2] })
  })


  describe('set increment object', () => {

    it('do nothing but reference is changed.', async () => {
      const state1 = await store.getterAsPromise()
      await store.setter(KEY.increment, (p) => p)
      const state2 = await store.getterAsPromise()
      expect(state1.increment).toEqual(state2.increment)
      expect(state1.increment === state2.increment).toBeFalsy()
    })


    it('directly', async () => {
      await store.setter(KEY.increment, { counter: 1 })
      const state = await store.getterAsPromise()
      expect(state.increment).toEqual({ counter: 1 })
    })


    it('with callback', async () => {
      await store.setter(KEY.increment, (p) => ({ counter: p.counter + 1 }))
      const state = await store.getterAsPromise()
      expect(state.increment).toEqual({ counter: 1 })
    })


    it('with async wrapped callback', async () => {
      await store.setter(KEY.increment, Promise.resolve((p) => ({ counter: p.counter + 1 })))
        .then(() => store.setter(KEY.increment, Observable.of((p) => ({ counter: p.counter + 1 })).delay(10)))
        .then(() => store.setter(KEY.increment, Observable.of((p) => ({ counter: p.counter + 1 }))))
      const state = await store.getterAsPromise()
      expect(state.increment).toEqual({ counter: 3 })
    })


    it('with callback has async callback', async () => {
      await store.setter(KEY.increment, (p) => Promise.resolve((q: typeof p) => ({ counter: q.counter + 1 })))
        .then(() => store.setter(KEY.increment, (p) => Observable.of((q: typeof p) => ({ counter: q.counter + 1 })).delay(10)))
        .then(() => store.setter(KEY.increment, (p) => Observable.of((q: typeof p) => ({ counter: q.counter + 1 }))))
      const state = await store.getterAsPromise()
      expect(state.increment).toEqual({ counter: 3 })
    })

  })


  describe('set array', () => {

    it('do nothing but reference is changed.', async () => {
      const state1 = await store.getterAsPromise()
      await store.setter(KEY.array, (p) => p)
      const state2 = await store.getterAsPromise()
      expect(state1.array).toEqual(state2.array)
      expect(state1.array === state2.array).toBeFalsy()
    })


    it('directly', async () => {
      await store.setter(KEY.array, [3, 4])
      const state = await store.getterAsPromise()
      expect(state.array).toEqual([3, 4])
    })


    it('with callback', async () => {
      await store.setter(KEY.array, (p) => [...p, 3])
        .then(() => store.setter(KEY.array, (p) => p.slice(1)))
      const state = await store.getterAsPromise()
      expect(state.array).toEqual([2, 3])
    })


    it('with async wrapped callback', async () => {
      await store.setter(KEY.array, Promise.resolve((p) => [...p, 3]))
        .then(() => store.setter(KEY.array, Observable.of((p) => [...p, 4]).delay(10)))
        .then(() => store.setter(KEY.array, Observable.of((p) => [...p, 5])))
      const state = await store.getterAsPromise()
      expect(state.array).toEqual([1, 2, 3, 4, 5])
    })


    it('with callback has async callback', async () => {
      await store.setter(KEY.array, (p) => Promise.resolve((q: typeof p) => [...q, 3]))
        .then(() => store.setter(KEY.array, (p) => Observable.of((q: typeof p) => [...q, 4]).delay(10)))
        .then(() => store.setter(KEY.array, (p) => Observable.of((q: typeof p) => [...q, 5])))
      const state = await store.getterAsPromise()
      expect(state.array).toEqual([1, 2, 3, 4, 5])
    })

  })

})

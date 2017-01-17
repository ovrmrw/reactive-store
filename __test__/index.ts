import * as assert from 'assert'
import { Observable } from 'rxjs'

import { getReactiveStoreAsSingleton, getObjectKeys } from '../index'


interface AppState {
  increment: {
    counter: number
  }
}

const initialState: AppState = {
  increment: {
    counter: 0
  }
}

const store = getReactiveStoreAsSingleton(initialState)

const KEY = getObjectKeys(initialState)



let value: number | undefined

store.getter()
  .filterByUpdatedKey(KEY.increment)
  .subscribe(state => {
    value = state.increment.counter
  })


store.setter(KEY.increment, (p) => ({ counter: p.counter + 1 }))
  .then(s => store.setter(KEY.increment, { counter: s.increment.counter + 1 }))
  .then(s => store.setter(KEY.increment, () => (q) => ({ counter: q.counter + 1 })))
  .then(s => store.setter(KEY.increment, Promise.resolve(({ counter: s.increment.counter + 1 }))))
  .then(s => store.setter(KEY.increment, Promise.resolve((p) => ({ counter: p.counter + 1 }))))
  .then(s => store.setter(KEY.increment, Observable.of({ counter: s.increment.counter + 1 })))
  .then(s => store.setter(KEY.increment, Observable.of((p) => ({ counter: p.counter + 1 }))))
  .then(s => store.setter(KEY.increment, () => Promise.resolve((q) => ({ counter: q.counter + 1 }))))
  .then(s => store.setter(KEY.increment, () => Observable.of((q) => ({ counter: q.counter + 1 }))))


setTimeout(() => {
  assert.equal(value, 9)
}, 0)

import * as assert from 'assert'
import { Observable } from 'rxjs/Observable'
import * as createLogger from 'redux-logger'

import { createReactiveStoreAsSingleton, createObjectKeys, LoopType, Middleware, simpleLogger } from '../src'


interface AppState {
  increment: IncrementState,
  timestamp: number,
}

interface IncrementState {
  counter: number,
}

const initialState: AppState = {
  increment: {
    counter: 0,
  },
  timestamp: 0,
}


const KEY = createObjectKeys(initialState)

const store = createReactiveStoreAsSingleton(initialState, {
  useFreeze: true, // DEFAULT: false
  reduxMiddlewares: [simpleLogger] as Middleware[], // DEFAULT: undefined
  useReduxDevToolsExtension: true, // DEFAULT: false ... works only for browsers.
})


let value: number | undefined
let timestamp: number | undefined


store.getter()
  .filterByUpdatedKey(KEY.increment)
  .subscribe(state => {
    value = state.increment.counter
    // state.increment.counter++ // if useFreeze options is set to true, this line causes a type error.
  })


store.getter()
  .filterByUpdatedKey(KEY.timestamp)
  .subscribe(state => {
    timestamp = state.timestamp
    console.log('************ Timestamp is updated. ************')
  })


store.setter(KEY.increment, (p) => ({ counter: p.counter + 1 }))
  .then(() => store.setter(KEY.increment, () => (q) => ({ counter: q.counter + 1 })))
  .then(() => store.setter(KEY.increment, Promise.resolve((p) => ({ counter: p.counter + 1 }))))
  .then(() => store.setter(KEY.increment, Promise.resolve((_, a) => ({ counter: a.increment.counter + 1 }))))
  .then(() => store.setter(KEY.increment, Observable.of((p) => ({ counter: p.counter + 1 }))))
  .then(() => store.setter(KEY.increment, Observable.of((_, a) => ({ counter: a.increment.counter + 1 }))))
  .then(() => store.setter(KEY.increment, () => Promise.resolve((q) => ({ counter: q.counter + 1 }))))
  .then(() => store.setter(KEY.increment, () => Observable.of((q) => ({ counter: q.counter + 1 }))))
  .then(() => store.setter(KEY.increment, (_, a) => ({ counter: a.increment.counter + 1 })))
  .then(() => store.setter(KEY.increment, (_, a) => (_, b) => ({ counter: b.increment.counter + 1 })))


store.setter(KEY.increment, (p) => ({ counter: p.counter - 1 }))
  .then(() => store.setter(KEY.increment, () => (q) => ({ counter: q.counter - 1 })))
  .then(() => store.setter(KEY.increment, Promise.resolve((p) => ({ counter: p.counter - 1 }))))
  .then(() => store.setter(KEY.increment, Promise.resolve((_, a) => ({ counter: a.increment.counter - 1 }))))
  .then(() => store.setter(KEY.increment, Observable.of((p) => ({ counter: p.counter - 1 }))))
  .then(() => store.setter(KEY.increment, Observable.of((_, a) => ({ counter: a.increment.counter - 1 }))))
  .then(() => store.setter(KEY.increment, () => Promise.resolve((q) => ({ counter: q.counter - 1 }))))
  .then(() => store.setter(KEY.increment, () => Observable.of((q) => ({ counter: q.counter - 1 }))))
  .then(() => store.setter(KEY.increment, (_, a) => ({ counter: a.increment.counter - 1 })))
  .then(() => store.setter(KEY.increment, (_, a) => (_, b) => ({ counter: b.increment.counter - 1 })))
  .then(() => store.setter(KEY.timestamp, new Date().getTime()))


setImmediate(() => {
  assert(value === 0)
  assert(typeof timestamp === 'number' && timestamp > 0)
  assert(store.initialState.increment.counter === 0)
  assert(store.initialState.timestamp === 0)
  console.log('passed all tests.')
})

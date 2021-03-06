# ovrmrw-reactive-store
Most Simple Reactive Store using RxJS

---

**(!) TypeScript 2.1 or later is needed.**

Simple key-value store like Flux concept for frond-end apps.

Flux and Redux are of course good ideas.

But writing Actions, ActionCreators and Reducers for small apps is exaggerated and painful.

That is why that I wrote a Simple Store.

In web apps world, we have to consider all events as async, so Reactive Concept is best match to that.

This store is a key-value reactive store based on RxJS, and **Redux is used for storing states** in the Observable world.
So you can use any Redux Middleware as you like, for example `redux-logger` and so on.

To handle **states, time flow and events** easily, Simple Reactive Store (using RxJS) was born.

---

## Install from npm
```
$ npm install --save ovrmrw-reactive-store
or
$ yarn add ovrmrw-reactive-store
```

---

Usage: [\_\_test\_\_/index.ts](https://github.com/ovrmrw/reactive-store/blob/master/__test__/index.ts)

Example React app: [ovrmrw/my-first-react-typescript](https://github.com/ovrmrw/my-first-react-typescript)

Example Angular app: [ovrmrw/angular-simple-redux-starter](https://github.com/ovrmrw/angular-simple-redux-starter)

---

## Usage detail

Declare `interface` for the States.

```
interface AppState {
  increment: IncrementState,
  timestamp: number,
}

interface IncrementState {
  counter: number,
}
```

Create `initialState` using interfaces above.

```
const initialState: AppState = {
  increment: {
    counter: 0,
  },
  timestamp: 0,
}
```

Generate an object for ObjectKeys by `getObjectKeys` method. The first layer keys of `initialState` will be string literals of `KEY`.

```
const KEY = getObjectKeys(initialState)
```

Above code is equivalent to

```
const KEY = {
  increment: 'increment',
  timestamp: 'timestamp'
}
```

Generate a store instance by `getReactiveStoreAsSingleton` method with `initialState` and some options.

```
import * as logger from 'redux-logger'

const store = getReactiveStoreAsSingleton(initialState, {
  useFreeze: true, // DEFAULT: false ... whether to freeze State object before be sent to getter function.
  reduxMiddlewares: [logger()], // In this case, Store uses a Redux Middleware for logger.
  useReduxDevToolsExtension: true, // DEFAULT: false ... whether to enable Redux DevTools Extension.
})
```

Due to the `reduxMiddlewares` option, you can use any Redux Middleware.

Next, set a value to the states.

```
store.setter(KEY.increment, (p) => ({counter: p.counter + 1}))

/* The variable "p" is a part of the state of AppState that indicates IncrementState under the "increment" key. */
```

`setter` is **chainable**.

```
store.setter(KEY.increment, (p) => ({counter: p.counter + 1}))
  .then(() => store.setter(KEY.timestamp, new Date().getTime()))

/* The second setter is invoked after the first setter resolved. */
```

**Async function** is acceptable.

```
store.setter(KEY.increment, (p) => Promise.resolved(({counter: p.counter + 1})))

store.setter(KEY.increment, (p) => Promise.resolved((q) => ({counter: q.counter + 1})))

store.setter(KEY.increment, Promise.resolved(({counter: 1})))

store.setter(KEY.increment, Promise.resolved((p) => ({counter: p.counter + 1})))
```

You can also get **all of the state** instead of a part of the state.

```
store.setter(KEY.increment, (_, a) => ({counter: a.increment.counter + 1})))

/* The variable "a" is all of the state. */
```

Get your states. The type of `getter()` is `Observable<AppState>`.

```
store.getter()
  .subscribe(state => {
    value = state.increment.counter
  })
```

To get more controll, filter the streams by `filterByUpdatedKey` operator.

```
store.getter()
  .filterByUpdatedKey(KEY.timestamp) // pass when "timestamp" key is updated.
  .subscribe(state => {
    value = state.timestamp
  })
```

---

## Setup
```
$ yarn install
or
$ npm install
```

## Test
```
$ npm test
```

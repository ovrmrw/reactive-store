# reactive-store
Most Simple Reactive Store using RxJS by @ovrmrw

---

**(!) TypeScript 2.1 or later is needed.**

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
    counter: 0
  },
  timestamp: 0,
}
```

Generate an object for ObjectKeys. The first layer keys of `initialState` will be string literals of `KEY`.

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

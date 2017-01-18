import { ReactiveStore } from './reactive-store'


let store: ReactiveStore<any>


export function getReactiveStoreAsSingleton<T>(initialState: T, concurrent?: number, output?: boolean): ReactiveStore<T> {
  if (!store) {
    store = new ReactiveStore<T>(initialState, concurrent, output)
  }
  return store
}

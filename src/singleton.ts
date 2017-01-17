import { ReactiveStore } from './reactive-store'


let store: ReactiveStore<any>


export function getStoreAsSingleton<T>(initialState: T): ReactiveStore<T> {
  if (!store) {
    store = new ReactiveStore<T>(initialState)
  }
  return store
}

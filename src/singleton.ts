import { StoreOptions } from './common'
import { ReactiveStore } from './reactive-store'


let store: ReactiveStore<any>


export function getReactiveStoreAsSingleton<T>(initialState: T, options?: StoreOptions): ReactiveStore<T> {
  if (!store) {
    store = new ReactiveStore<T>(initialState, options)
  }
  return store
}

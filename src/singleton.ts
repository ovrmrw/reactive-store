import { StoreOptions } from './common'
import { ReactiveStore } from './reactive-store'


let store: ReactiveStore<any>


/**
 * create and get a ReactiveStore instance as singleton.
 */
export function createReactiveStoreAsSingleton<T>(initialState: T, options?: StoreOptions): ReactiveStore<T> {
  if (!store) {
    store = new ReactiveStore<T>(initialState, options)
  }
  return store
}


/**
 * DEPRECATED: alias for createReactiveStoreAsSingleton
 */
export const getReactiveStoreAsSingleton = createReactiveStoreAsSingleton

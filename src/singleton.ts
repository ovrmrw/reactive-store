import { ReactiveStore } from './reactive-store'


let store: ReactiveStore<any>


export function getReactiveStoreAsSingleton<T>(initialState: T, options?: StoreOptions): ReactiveStore<T> {
  if (!store) {
    const o = options || {}
    store = new ReactiveStore<T>(initialState, o.concurrent, o.loopType, o.output)
  }
  return store
}



export interface StoreOptions {
  concurrent?: number,
  output?: boolean,
  loopType?: number,
}

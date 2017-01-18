import { ReactiveStore } from './reactive-store'


let store: ReactiveStore<any>


export function getReactiveStoreAsSingleton<T>(initialState: T, options?: Options): ReactiveStore<T> {
  if (!store) {
    const o = options || {}
    store = new ReactiveStore<T>(initialState, o.concurrent, o.output, o.loopType)
  }
  return store
}



export interface Options {
  concurrent?: number,
  output?: boolean,
  loopType?: string,
}

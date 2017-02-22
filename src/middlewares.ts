import { Store, Dispatch, Action } from 'redux'



export const simpleLogger: MiddlewareInterface<any> =
  store => next => action => {
    const result = next(action)
    const state = store.getState()
    if (state !== undefined) {
      console.log('newState:', store.getState())
    }
    return result
  }




export interface MiddlewareInterface<T> {
  (store: Store<T>): (next: Dispatch<T>) => (action: Action) => Action
}

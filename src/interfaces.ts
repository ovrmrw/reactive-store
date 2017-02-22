import { Observable } from 'rxjs/Observable'

import { Next, ValueOrResolver, PartialValueOrResolver, ActionOptions } from './common'


export interface IReactiveStore<T> {
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>, options: ActionOptions): Promise<void>,
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>, options: ActionOptions): Promise<void>,
  resetter<K extends keyof T>(key: K, options: ActionOptions): Promise<void>,
  getter(): Observable<T>,
  getterAsPromise(): Promise<T>,
  forceResetForTesting(): Promise<void> | never,
  forceCompleteForTesting(): Promise<void> | never,
  initialState: T,
  currentState: T,
}

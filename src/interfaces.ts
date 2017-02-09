import { Observable } from 'rxjs/Observable'

import { Next, ValueOrResolver, PartialValueOrResolver } from './common'


export interface IReactiveStore<T> {
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<void | Next<T, K>>,
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<void | Next<T, K>>,
  resetter<K extends keyof T>(key: K): Promise<void | Next<T, K>>,
  getter(): Observable<T>,
  getterAsPromise(): Promise<T>,
  forceResetForTesting(): Promise<void> | never,
  forceCompleteForTesting(): Promise<void> | never,
  initialState: T,
}

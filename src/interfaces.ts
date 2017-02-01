import { Observable } from 'rxjs'

import { Next, ValueOrResolver, PartialValueOrResolver } from './common'


export interface IReactiveStore<T> {
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<Next<T, K>>,
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<Next<T, K>>,
  resetter<K extends keyof T>(key: K): Promise<Next<T, K>>,
  getter(): Observable<T>,
  getterAsPromise(): Promise<T>,
  forceResetForTesting(): Promise<void>,
  forceCompleteForTesting(): void,
  initialState: T,
}

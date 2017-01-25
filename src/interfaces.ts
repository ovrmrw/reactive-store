import { Observable } from 'rxjs'
import { ValueOrResolver, PartialValueOrResolver } from './common'


export interface IReactiveStore<T> {
  setter<K extends keyof T>(key: K, value: ValueOrResolver<T, K>): Promise<void>,
  setterPartial<K extends keyof T>(key: K, value: PartialValueOrResolver<T, K>): Promise<void>,
  resetter<K extends keyof T>(key: K): Promise<void>,
  getter(): Observable<T>,
  getterAsPromise(): Promise<T>,
  forceResetForTesting(): Promise<void>,
  forceCompleteForTesting(): void,
}

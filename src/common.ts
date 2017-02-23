import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { Middleware, GenericStoreEnhancer, Store, Dispatch, Action } from 'redux'

export { Middleware, GenericStoreEnhancer }


export interface Action {
  key: string,
  value: any,
  subject: Subject<any>,
  options: ActionOptions,
}


export interface ActionOptions {
  desc?: string, // description
}


// DEPRECATED
export interface Next<T, K extends keyof T> {
  state: T,
  value: T[K],
}


export type Value<T, K extends keyof T> = T[K]
export type ValueAsync<T, K extends keyof T> = Promise<T[K]> | Observable<T[K]>
export type Resolver<T, K extends keyof T> = (value: T[K], state: T) => T[K]
export type ResolverAsync<T, K extends keyof T> = (value: T[K], state: T) => Promise<T[K]> | Observable<T[K]>
export type ResolverInResolver<T, K extends keyof T> = (value: T[K], state: T) => ((value: T[K], state: T) => T[K])
export type ResolverInResolverAsync<T, K extends keyof T> = (value: T[K], state: T) => (Promise<(value: T[K], state: T) => T[K]>) | (Observable<(value: T[K], state: T) => T[K]>)
export type AsyncWrappedResolver<T, K extends keyof T> =
  Promise<(value: T[K], state: T) => T[K]> | Observable<(value: T[K], state: T) => T[K]>

export type ValueOrResolver<T, K extends keyof T> =
  Value<T, K> | ValueAsync<T, K> |
  Resolver<T, K> | ResolverAsync<T, K> |
  ResolverInResolver<T, K> | ResolverInResolverAsync<T, K> |
  AsyncWrappedResolver<T, K>


export type PartialValue<T, K extends keyof T> = Partial<T[K]>
export type PartialValueAsync<T, K extends keyof T> = Promise<Partial<T[K]>> | Observable<Partial<T[K]>>
export type PartialResolver<T, K extends keyof T> = (value: T[K], state: T) => Partial<T[K]>
export type PartialResolverAsync<T, K extends keyof T> = (value: T[K], state: T) => Promise<Partial<T[K]>> | Observable<Partial<T[K]>>
export type PartialResolverInResolver<T, K extends keyof T> = (value: T[K], state: T) => ((value: T[K], state: T) => Partial<T[K]>)
export type PartialResolverInResolverAsync<T, K extends keyof T> = (value: T[K], state: T) => (Promise<(value: T[K], state: T) => Partial<T[K]>>) | (Observable<(value: T[K], state: T) => Partial<T[K]>>)
export type PartialAsyncWrappedResolver<T, K extends keyof T> =
  Promise<(value: T[K], state: T) => Partial<T[K]>> | Observable<(value: T[K], state: T) => Partial<T[K]>>

export type PartialValueOrResolver<T, K extends keyof T> =
  PartialValue<T, K> | PartialValueAsync<T, K> |
  PartialResolver<T, K> | PartialResolverAsync<T, K> |
  PartialResolverInResolver<T, K> | PartialResolverInResolverAsync<T, K> |
  PartialAsyncWrappedResolver<T, K>


export function mergeObject<T>(obj: T, partials: Partial<{[P in keyof T]: T[P]}>[]): T {
  return partials.reduce<T>((p, partial) => {
    return { ...p as any, ...partial as any }
  }, obj)
}


export type ObjectKeys<T> = {[P in keyof T]: P}


/**
 * create and get ObjectKeys
 */
export function createObjectKeys<T>(state: T): ObjectKeys<T> {
  return Object.keys(state).reduce((p, key) => {
    return { ...p, ...{ [key]: key } }
  }, {}) as any
}


/**
 * DEPRECATED: alias for createObjectKeys
 */
export const getObjectKeys = createObjectKeys


export type ObjectKey<T, K extends keyof T> = K


export type RecursiveReadonly<T> = {
  readonly [P in keyof T]: RecursiveReadonly<T[P]>
}


export enum LoopType {
  'asap',
  'setimmediate',
  'settimeout',
}


export interface StoreOptions {
  concurrent?: number,
  output?: boolean, // use just for testing
  loopType?: number,
  ngZone?: any, // NgZone for Angular 2+
  testing?: boolean,
  useFreeze?: boolean,
  reduxApplyMiddleware?: GenericStoreEnhancer,
  reduxMiddlewares?: Middleware[],
  useReduxDevToolsExtension?: boolean,
}


export interface MiddlewareInterface<T> {
  (store: Store<T>): (next: Dispatch<T>) => (action: Action) => Action
}



/**
 * reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze<T>(obj: T): T {
  // Retrieve the property names defined on obj
  const propNames = Object.getOwnPropertyNames(obj)

  // Freeze properties before freezing self
  propNames.forEach(name => {
    const prop = obj[name]

    // Freeze prop if it is an object
    if (typeof prop === 'object' && prop !== null)
      deepFreeze(prop)
  })

  // Freeze self (no-op if already frozen)
  return Object.freeze(obj)
}

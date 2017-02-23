/**
 * DEPRECATED
 */
export function replaceAction<T>(value: T): (state: T) => T {
  return (state) => value
}


/**
 * DEPRECATED
 */
export function pushArrayAction<T>(value: T): (state: T[]) => T[] {
  return (state) => [...state, value]
}


/**
 * DEPRECATED
 */
export function switchAction(value: boolean): (state: boolean) => boolean {
  return (state) => !value
}


/**
 * DEPRECATED
 */
export function incrementAction(value: number = 1): (state: number) => number {
  return (state) => state + value
}

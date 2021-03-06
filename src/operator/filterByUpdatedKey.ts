import { Observable } from 'rxjs/Observable'
import { Subscriber } from 'rxjs/Subscriber'
import { Operator } from 'rxjs/Operator'
import { TeardownLogic } from 'rxjs/Subscription'

import { latestUpdatedKey } from '../reactive-store'


/**
 * Filter streams by the current updated key.
 */
export function filterByUpdatedKey<T>(this: Observable<T>, ...keys: string[]): Observable<T> {
  return this.lift(new FilterByUpdatedKeyOperator(keys))
}


class FilterByUpdatedKeyOperator<T> implements Operator<T, T> {
  constructor(private keys: string[]) { }

  call(subscriber: Subscriber<T>, source: Observable<T>): TeardownLogic {
    return source.subscribe(new FilterByUpdatedKeySubscriber(subscriber, this.keys))
  }
}


class FilterByUpdatedKeySubscriber<T> extends Subscriber<T> {
  constructor(destination: Subscriber<T>, private keys: string[]) {
    super(destination)
  }

  protected _next(value: T): void {
    let result: boolean
    try {
      result = this.keys.some(key => key === value[latestUpdatedKey]) || !value[latestUpdatedKey]
    } catch (err) {
      if (this.destination.error) {
        this.destination.error(err)
      }
      return
    }

    if (result) {
      if (this.destination.next) {
        this.destination.next(value)
      }
    }
  }
}

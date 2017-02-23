const cloneDeep = require('lodash.clonedeep') as <T>(obj: T) => T

import { MiddlewareInterface } from './common'


export const simpleLogger: MiddlewareInterface<any> =
  store => next => action => {
    const result = next(action)
    console.log('newState:', cloneDeep(store.getState()))
    return result
  }

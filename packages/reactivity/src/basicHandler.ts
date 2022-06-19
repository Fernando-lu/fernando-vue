import { track, trigger } from './effect'
import { isObject } from '@vue/shared'
import { reactive } from './reactive'
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    track(target, 'get', key)
    const result = Reflect.get(target, key, receiver)
    if (isObject(result)) {
      // 实现深度代理，相较于vue2在初期阶段就递归进行数据劫持，性能更好，取值的时候再进行代理
      return reactive(result)
    }
    return result
  },
  set(target, key, value, receiver) {
    const oldValue = target[key]
    const result = Reflect.set(target, key, value, receiver)

    if (oldValue !== value) {
      trigger(target, 'set', key, value, oldValue)
    }
    return result
  }
}

import { isObject } from '@vue/shared'
import { mutableHandlers, ReactiveFlags } from './basicHandler'

const reactiveMap = new WeakMap()

export function reactive(target) {
  // reactive只能接收对象类型
  if (!isObject(target)) return

  // 未代理之前，target.__v_isReactive 为 undefined，代理过，则为true
  // 避免传入一个已经代理过的对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  // 避免对同一个对象进行多次代理
  const reactiveValue = reactiveMap.get(target)
  if (reactiveValue) {
    return reactiveValue
  }

  const proxy = new Proxy(target, mutableHandlers)

  reactiveMap.set(target, proxy)

  return proxy
}

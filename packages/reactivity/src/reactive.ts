import { isObject } from "@vue/shared"

const reactiveMap = new WeakMap()

enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export function reactive (target) {
  
  // reactive只能接收对象类型
  if (!isObject(target)) return

  // 未代理之前，target.__v_isReactive 为 undefined，代理过，则为true
  // 避免传入一个已经代理过的对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return true
  }

  // 避免对同一个对象进行多次代理
  const reactiveValue = reactiveMap.get(target)
  if (reactiveValue) {
    return reactiveValue
  }

  const proxy = new Proxy(target, {
    get(target, key, value) {
      if (key === ReactiveFlags.IS_REACTIVE) {
        return true
      }
      return Reflect.get(target, key, value)
    },
    set(target, key, value, receiver) {
      return Reflect.set(target, key, value, receiver)
    }
  })

  reactiveMap.set(target, proxy)
  console.log('reactiveMap', reactiveMap)

  return proxy

}

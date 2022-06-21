import { isFunction, isObject } from "@vue/shared"
import { ReactiveEffect } from "./effect"
import { isReactive } from "./reactive"

// 递归，添加一个set避免由于引用导致陷入死循环
function traversal(value, set = new Set()) {
  if (!isObject(value)) return value

  if (set.has(value)) return value

  set.add(value)

  for (const key in value) {
    traversal(value[key], set)
  }
  return value
}

export function watch(source, excutor) {
  let getter
  let oldValue
  if (isReactive(source)) {
    // 递归对各个属性添加代理，传入值为reactive对象，但凡改动任何深度的某个属性
    getter = () => traversal(source)
  } else if (isFunction(source)) {
    getter = source
  } else {
    return
  }

  let cleanup

  function onCleanup(fn) {
    cleanup = fn
  }

  function scheduler() {
    console.log('cleanup', cleanup)
    if (cleanup) cleanup()
    const newValue = effect.run()
    excutor(oldValue, newValue, onCleanup)
    oldValue = newValue
  }
  const effect = new ReactiveEffect(getter, scheduler)
  oldValue = effect.run()
}
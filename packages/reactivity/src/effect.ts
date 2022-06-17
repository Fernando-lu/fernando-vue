// 暴露在全局的副作用，表示当前正在执行的 effect
export let activeEffect = undefined

// 全局的依赖
// WeakMap { target: Map {key: Set(...effects) } }
export const globalTargetDepsMap = new WeakMap()

class ReactiveEffect {
  // 默认设置当前effect是激活状态
  public active = true

  // parent 协同 activeEffect 辅助支持 effect 的嵌套，当执行完后，副作用转为父副作用
  public parent = null
  // 用来记录effetc的依赖
  public deps = []
  constructor(public fn) {}

  run() {
    if (!this.active) {
      return this.fn()
    }
    // 收集依赖
    try {
      this.parent = activeEffect
      activeEffect = this
      cleanupEffect(this)
      return this.fn()
    } finally {
      activeEffect = this.parent
    }
  }

  stop() {
    if (this.active) {
      this.active = false
      cleanupEffect(this)
    }
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  // 允许执行 runner() 的时候执行 _effect.run
  const runner = _effect.run.bind(_effect)
  // 允许在外执行 runner.effect.stop()
  runner.effect = _effect
  return runner
}

// 收集依赖
export function track(target, type, key) {
  // 一个对象有多个属性，1个属性存在多个effect
  // WeakMap  => {对象: Map:{ key: Set }}

  // 写在effect嵌套以外的代码，无需处理
  if (!activeEffect) return

  // 判断weakMap里面有无这个target相关联的 Map
  let depsMap = globalTargetDepsMap.get(target)

  if (!depsMap) {
    globalTargetDepsMap.set(target, (depsMap = new Map()))
  }
  // 判断这个Map里面有无相关的key对应的Set
  let dep = depsMap.get(key)
  // 如果没有，则需要创建
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  const shouldTrack = dep.has(activeEffect)
  if (!shouldTrack) {
    dep.add(activeEffect)
    // 让effect记住对应的依赖，方便后续清理
    activeEffect.deps.push(dep)
  }
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = globalTargetDepsMap.get(target)
  if (!depsMap) return

  let effects = depsMap.get(key)

  if (!effects) return
  // 避免由于引用同一个对象导致监听变化陷入死循环，因此拷贝一个出来遍历
  effects = [...effects]
  effects.forEach((effect) => {
    if (effect !== activeEffect) effect.run()
  })
}

export function cleanupEffect(effect) {
  const { deps } = effect

  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect)
  }

  effect.deps.length = 0
}

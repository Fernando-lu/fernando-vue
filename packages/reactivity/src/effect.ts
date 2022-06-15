export let activeEffect = undefined

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
      this.active = true
      return this.fn()
    } finally {
      activeEffect = this.parent
      this.parent = null
    }
  }

  stop() {}
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

const globalDepsMap = new WeakMap()

// 收集依赖
export function track(target, type, key) {
  // 一个对象有多个属性，1个属性存在多个effect
  // WeakMap  => {对象: Map:{ key: Set }}

  // 写在effect嵌套以外的代码，无需处理
  if (!activeEffect) return

  // 判断weakMap里面有无这个target相关联的 Map
  let depsMap = globalDepsMap.get(target)
  // 如果没有，则需要创建
  if (!depsMap) {
    globalDepsMap.set(target, (depsMap = new Map()))
  }
  // 判断这个Map里面有无相关的key对应的Set
  let dep = depsMap.get(key)
  // 如果没有，则需要创建
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }

  const shouldTrack = dep.has(activeEffect)
  if (!shouldTrack) {
    dep.add(shouldTrack)
    debugger
    // 让effect记住对应的依赖，方便后续清理
    activeEffect.deps.push(dep)
  }
}

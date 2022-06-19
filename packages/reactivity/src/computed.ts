import { isFunction } from "@vue/shared";
import { ReactiveEffect, trackEffects, triggerEffects } from './effect'
export function computed(getterOrOptions) {

  let getter, setter

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {
      console.error('no setter')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImplement(getter, setter)
}

export class ComputedRefImplement {
  public effect
  private _dirty = true
  private __v_isReadonly = true
  private __v_isRef = true
  private _value
  public dep = new Set()

  constructor(public getter, public setter) {
    this.effect = new ReactiveEffect(getter, () => {
      // 值没有变，则不执行
      if (this._dirty) return
      this._dirty = true
      triggerEffects(this.dep)
    })
  }

  get value() {
    trackEffects(this.dep)
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }

  set value(newVal) {
    this.setter(newVal)
  }
}
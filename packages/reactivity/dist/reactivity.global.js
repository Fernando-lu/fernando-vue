var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    computed: () => computed,
    effect: () => effect,
    reactive: () => reactive,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  function isObject(o) {
    return typeof o === "object" && o !== null;
  }
  function isFunction(o) {
    return typeof o === "function";
  }

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  var globalTargetDepsMap = /* @__PURE__ */ new WeakMap();
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.parent = null;
      this.deps = [];
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function effect(fn, option) {
    let scheduler = null;
    if (option && option.scheduler) {
      scheduler = option.scheduler;
    }
    const _effect = new ReactiveEffect(fn, scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  function track(target, type, key) {
    if (!activeEffect)
      return;
    let depsMap = globalTargetDepsMap.get(target);
    if (!depsMap) {
      globalTargetDepsMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function trigger(target, type, key, value, oldValue) {
    const depsMap = globalTargetDepsMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (!effects)
      return;
    triggerEffects(effects);
  }
  function trackEffects(dep) {
    if (!activeEffect)
      return;
    const shouldTrack = dep.has(activeEffect);
    if (!shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
  function triggerEffects(effects) {
    effects = [...effects];
    effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }

  // packages/reactivity/src/basicHandler.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, "get", key);
      const result = Reflect.get(target, key, receiver);
      if (isObject(result)) {
        return reactive(result);
      }
      return result;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, "set", key, value, oldValue);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  function reactive(target) {
    if (!isObject(target))
      return;
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const reactiveValue = reactiveMap.get(target);
    if (reactiveValue) {
      return reactiveValue;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  function computed(getterOrOptions) {
    let getter, setter;
    if (isFunction(getterOrOptions)) {
      getter = getterOrOptions;
      setter = () => {
        console.error("no setter");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImplement(getter, setter);
  }
  var ComputedRefImplement = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (this._dirty)
          return;
        this._dirty = true;
        triggerEffects(this.dep);
      });
    }
    get value() {
      trackEffects(this.dep);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newVal) {
      this.setter(newVal);
    }
  };

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value))
      return value;
    if (set.has(value))
      return value;
    set.add(value);
    for (const key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, excutor) {
    let getter;
    let oldValue;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    } else {
      return;
    }
    let cleanup;
    function onCleanup(fn) {
      cleanup = fn;
    }
    function scheduler() {
      console.log("cleanup", cleanup);
      if (cleanup)
        cleanup();
      const newValue = effect2.run();
      excutor(oldValue, newValue, onCleanup);
      oldValue = newValue;
    }
    const effect2 = new ReactiveEffect(getter, scheduler);
    oldValue = effect2.run();
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map

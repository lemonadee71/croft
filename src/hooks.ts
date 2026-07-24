import { HOOK_TARGET, HOOK_DATA, isHook, isPlainObject, compose } from "./utils";

export type HookRef<V> = {
  // Mapping / transform function — second arg is a plain snapshot of all hook properties
  <R>(transform: (val: V, state: Record<string, any>) => R): HookRef<R>;
  (): HookRef<V>;
} & {
  // Method and property forwarding
  [P in keyof V]: V[P] extends (...args: infer A) => infer R
    ? (...args: A) => HookRef<R>
    : HookRef<V[P]>;
};

export type HookState<T> = T & {
  [P in keyof T as `$${Extract<P, string>}`]: HookRef<T[P]>;
};

type NormalizedState<T> = T extends any[] ? { value: T } : T extends object ? T : { value: T };

interface HookData {
  listeners: Map<string, Set<Function>>;
}

const HookRegistry = new WeakMap<object, HookData>();
const proxyByTarget = new WeakMap<object, object>();

// ============= DEPENDENCY TRACKING (for computed / effect) =============

const targetMap = new WeakMap<object, Map<string, Set<() => void>>>();
const effectToDeps = new WeakMap<() => void, Set<{ target: object; prop: string }>>();
let activeEffect: (() => void) | null = null;
const effectStack: Array<(() => void) | null> = [];

/** Push current effect onto stack and set a new active effect for tracking. */
const pushEffect = (effect: () => void) => {
  effectStack.push(activeEffect);
  activeEffect = effect;
};

/** Restore the previous active effect (popped from stack). */
const popEffect = () => {
  activeEffect = effectStack.pop() ?? null;
};

const cleanupEffect = (fn: () => void) => {
  const deps = effectToDeps.get(fn);
  if (!deps) return;
  for (const { target, prop } of deps) {
    targetMap.get(target)?.get(prop)?.delete(fn);
  }
  deps.clear();
};

export const track = (target: object, prop: string) => {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let depSet = depsMap.get(prop);
  if (!depSet) {
    depSet = new Set();
    depsMap.set(prop, depSet);
  }
  depSet.add(activeEffect);

  let tracked = effectToDeps.get(activeEffect);
  if (!tracked) {
    tracked = new Set();
    effectToDeps.set(activeEffect, tracked);
  }
  tracked.add({ target, prop });
};

export const trigger = (target: object, prop: string) => {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const deps = depsMap.get(prop);
  if (!deps) return;
  const toRun = [...deps];
  for (const fn of toRun) fn();
};

export const getProxy = (target: object): object | undefined => proxyByTarget.get(target);

// ============= COMPUTED =============

/**
 * Creates a derived reactive value that caches its result and only
 * re-evaluates when its tracked dependencies change.
 *
 * The getter is evaluated lazily — only on first `.value` read.
 * Dependencies are auto-tracked during getter execution (no explicit dep arrays).
 *
 * The returned ref is compatible with `watch()` and template bindings
 * (detected via `isHook`).
 *
 * @example
 * ```ts
 * const count = createHook(0);
 * const doubled = computed(() => count.value * 2);
 * // doubled.value → 0
 * count.value = 5;
 * // doubled.value → 10
 *
 * // Works in templates
 * // render(html`<div :text=${doubled}></div>`)
 * ```
 */
export const computed = <T>(getter: () => T) => {
  let cachedValue: T;
  let dirty = true;
  const target = {};
  HookRegistry.set(target, { listeners: new Map() });

  const compute = () => {
    const oldValue = cachedValue;
    cleanupEffect(compute);
    pushEffect(compute);
    try {
      cachedValue = getter();
    } finally {
      popEffect();
    }
    dirty = false;

    if (oldValue !== cachedValue) {
      const data = HookRegistry.get(target);
      if (data) {
        const callbacks = data.listeners.get("value");
        if (callbacks) {
          for (const fn of callbacks) fn(cachedValue, {});
        }
      }
      trigger(target, "value");
    }
  };

  const ref = {
    [HOOK_TARGET]: target,
    [HOOK_DATA]: {
      prop: "value",
      transform: null,
      get value() {
        if (dirty) compute();
        return cachedValue;
      },
    },
    get value() {
      if (dirty) compute();
      track(target, "value");
      return cachedValue;
    },
  };

  return ref;
};

export const createHook = <T extends any>(value: T, seal = true): HookState<NormalizedState<T>> => {
  let obj: any = isPlainObject(value) ? value : { value };
  obj = seal ? Object.seal(obj) : obj;

  HookRegistry.set(obj, { listeners: new Map() });

  return new Proxy(obj, { get: getter, set: setter }) as any;
};

const methodForwarder = (target: any, prop: string | symbol): any => {
  const previousTransform = target[HOOK_DATA].transform || ((val: any) => val);

  const callback = (...args: any[]) => {
    const copy = {
      [HOOK_TARGET]: target[HOOK_TARGET],
      [HOOK_DATA]: {
        ...target[HOOK_DATA],
        transform: compose(previousTransform, (value: any) => value[prop](...args)),
      },
    };

    return new Proxy(copy, { get: methodForwarder });
  };

  if (prop === HOOK_TARGET || prop === HOOK_DATA) return target[prop];
  return callback;
};

const createHookRef = (ref: any, prop: string, value: any): any => {
  const fn = (transform: any = null) => {
    const wrapped = transform ? (v: any) => transform(v, { ...ref }) : null;

    const result = {
      [HOOK_TARGET]: ref,
      [HOOK_DATA]: {
        prop,
        transform: wrapped,
        value,
      },
    };

    const chainable = (nextTransform?: any) => {
      if (!nextTransform) return result;
      const composed = wrapped
        ? (v: any) => nextTransform(wrapped(v), { ...ref })
        : (v: any) => nextTransform(v, { ...ref });
      return fn(composed);
    };

    return new Proxy(Object.assign(chainable, result), { get: methodForwarder });
  };

  return new Proxy(Object.assign(fn, fn()), { get: methodForwarder });
};

const getter = (target: any, rawProp: string | symbol, receiver: any): any => {
  if (typeof rawProp === "symbol") {
    return Reflect.get(target, rawProp, receiver);
  }

  const prop = rawProp.replace(/^\$/, "");

  if (rawProp.startsWith("$") && prop in target) {
    proxyByTarget.set(target, receiver);
    return createHookRef(target, prop, target[prop]);
  }

  track(target, prop);
  return Reflect.get(target, prop, receiver);
};

const setter = (target: any, prop: string | symbol, value: any, receiver: any): boolean => {
  if (typeof prop === "symbol") {
    return Reflect.set(target, prop, value, receiver);
  }

  const result = Reflect.set(target, prop, value, receiver);

  trigger(target, prop);

  const data = HookRegistry.get(target);
  if (data) {
    const callbacks = data.listeners.get(prop);
    if (callbacks) {
      const plainState = { ...target };
      for (const fn of callbacks) {
        fn(value, plainState);
      }
    }
  }

  return result;
};

export const watch = <V>(
  value: HookRef<V>,
  ...callbacks: ((value: V, state: Record<string, any>) => void)[]
): (() => void) => {
  if (!isHook(value)) throw new TypeError("value must be a hook");
  const hook = value as any;

  // Force initial value resolution (triggers lazy computed init)
  void hook[HOOK_DATA].value;

  const data = HookRegistry.get(hook[HOOK_TARGET]);
  if (!data) throw new Error("Hook target registry entry not found");

  const { listeners } = data;
  const prop = hook[HOOK_DATA].prop;

  if (!listeners.has(prop)) {
    listeners.set(prop, new Set());
  }
  const set = listeners.get(prop)!;
  callbacks.forEach((cb) => set.add(cb));

  return () => {
    callbacks.forEach((cb) => set.delete(cb));
  };
};

export const unwatch = <V>(
  value: HookRef<V>,
  ...callbacks: ((value: V, state: Record<string, any>) => void)[]
): void => {
  if (!isHook(value)) throw new TypeError("value must be a hook");
  const hook = value as any;

  const data = HookRegistry.get(hook[HOOK_TARGET]);
  if (!data) return;

  const { listeners } = data;
  const prop = hook[HOOK_DATA].prop;
  const set = listeners.get(prop);
  if (set) {
    callbacks.forEach((cb) => set.delete(cb));
  }
};

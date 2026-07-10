import { HOOK_TARGET, isHook, isPlainObject, compose } from "./utils";

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

export const createHook = <T extends any>(value: T, seal = true): HookState<NormalizedState<T>> => {
  let obj: any = isPlainObject(value) ? value : { value };
  obj = seal ? Object.seal(obj) : obj;

  HookRegistry.set(obj, { listeners: new Map() });

  return new Proxy(obj, { get: getter, set: setter }) as any;
};

const methodForwarder = (target: any, prop: string | symbol): any => {
  const previousTransform = target.data.transform || ((val: any) => val);

  const callback = (...args: any[]) => {
    const copy = {
      [HOOK_TARGET]: target[HOOK_TARGET],
      data: {
        ...target.data,
        transform: compose(previousTransform, (value: any) => value[prop](...args)),
      },
    };

    return new Proxy(copy, { get: methodForwarder });
  };

  if (prop === HOOK_TARGET || prop === "data") return target[prop];
  return callback;
};

const createHookRef = (ref: any, prop: string, value: any): any => {
  const fn = (transform: any = null) => {
    const wrapped = transform ? (v: any) => transform(v, { ...ref }) : null;

    return {
      [HOOK_TARGET]: ref,
      data: {
        prop,
        transform: wrapped,
        value,
      },
    };
  };

  return new Proxy(Object.assign(fn, fn()), { get: methodForwarder });
};

const getter = (target: any, rawProp: string | symbol, receiver: any): any => {
  if (typeof rawProp === "symbol") {
    return Reflect.get(target, rawProp, receiver);
  }

  const prop = rawProp.replace(/^\$/, "");

  if (rawProp.startsWith("$") && prop in target) {
    return createHookRef(target, prop, target[prop]);
  }

  return Reflect.get(target, prop, receiver);
};

const setter = (target: any, prop: string | symbol, value: any, receiver: any): boolean => {
  if (typeof prop === "symbol") {
    return Reflect.set(target, prop, value, receiver);
  }

  const result = Reflect.set(target, prop, value, receiver);

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

  const data = HookRegistry.get(hook[HOOK_TARGET]);
  if (!data) throw new Error("Hook target registry entry not found");

  const { listeners } = data;
  const prop = hook.data.prop;

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
  const prop = hook.data.prop;
  const set = listeners.get(prop);
  if (set) {
    callbacks.forEach((cb) => set.delete(cb));
  }
};

import { HOOK_REF, isHook, isPlainObject, compose, resolve, uid } from "./utils";
import { modifyElement } from "./index";

interface Handler {
  type: string;
  linkedProp: string;
  targetAttr: any;
  action: Function | null;
}

interface HookData {
  subscribers: Map<string, Handler[]>;
  observers: Map<string, Function[]>;
}

const Registry = new WeakMap<object, HookData>();

export const createHook = <T extends object | string | number | boolean | any[]>(
  value: T,
  seal = true
): any => {
  let obj: any = isPlainObject(value) ? value : { value };
  obj = seal ? Object.seal(obj) : obj;

  Registry.set(obj, { subscribers: new Map(), observers: new Map() });

  return new Proxy(obj, { get: getter, set: setter });
};

const methodForwarder = (target: any, prop: string | symbol): any => {
  const previousTrap = target.data.trap || ((val: any) => val);

  const callback = (...args: any[]) => {
    const copy = {
      [HOOK_REF]: target[HOOK_REF],
      data: {
        ...target.data,
        trap: compose(previousTrap, (value: any) => value[prop](...args)),
      },
    };

    return new Proxy(copy, { get: methodForwarder });
  };

  if ([HOOK_REF, "data"].includes(prop as string)) return target[prop];
  return callback;
};

const createHookFunction = (ref: any, prop: string, value: any): any => {
  const fn = (trap: any = null) => ({
    [HOOK_REF]: ref,
    data: {
      prop,
      trap,
      value,
    },
  });

  return new Proxy(Object.assign(fn, fn()), { get: methodForwarder });
};

const getter = (target: any, rawProp: string | symbol, receiver: any): any => {
  if (typeof rawProp === "symbol") {
    return Reflect.get(target, rawProp, receiver);
  }

  const prop = rawProp.replace(/^\$/, "");

  if (rawProp.startsWith("$") && prop in target) {
    return createHookFunction(target, prop, target[prop]);
  }

  return Reflect.get(target, prop, receiver);
};

const setter = (target: any, prop: string | symbol, value: any, receiver: any): boolean => {
  if (typeof prop === "symbol") {
    return Reflect.set(target, prop, value, receiver);
  }

  const data = Registry.get(target);
  if (!data) {
    return Reflect.set(target, prop, value, receiver);
  }

  const { subscribers, observers } = data;
  const callbacks = observers.get(prop) || [];

  for (const fn of callbacks) fn(value);

  subscribers.forEach((handlers, id) => {
    const element = document.querySelector(`[data-proxyid="${id}"]`);

    if (element) {
      handlers
        .filter((handler) => handler.linkedProp === prop)
        .forEach((handler) => {
          modifyElement(element as HTMLElement, handler.type, {
            key: handler.targetAttr,
            value: resolve(value, handler.action),
          });
        });
    } else {
      subscribers.delete(id);
    }
  });

  return Reflect.set(target, prop, value, receiver);
};

export const registerIfHook = (
  value: any,
  options: { element: HTMLElement; type: string; target: any }
): any => {
  if (!isHook(value)) return value;

  const hook = value;
  const id = options.element.dataset.proxyid || uid();
  options.element.dataset.proxyid = id;

  if (["listener", "lifecycle"].includes(options.type)) {
    throw new Error("You can't dynamically set lifecycle methods or event listeners");
  }

  const data = Registry.get(hook[HOOK_REF]);
  if (!data) return resolve(hook.data.value, hook.data.trap);

  const { subscribers } = data;
  const handler: Handler = {
    type: options.type,
    linkedProp: hook.data.prop,
    targetAttr: options.target,
    action: hook.data.trap,
  };

  subscribers.set(id, [...(subscribers.get(id) || []), handler]);

  // delete handlers when deleted
  options.element.addEventListener("@destroy", () => subscribers.delete(id));

  return resolve(hook.data.value, hook.data.trap);
};

export const watch = (value: any, ...callback: Function[]): (() => void) => {
  if (!isHook(value)) throw new TypeError("value must be a hook");
  const hook = value;

  const data = Registry.get(hook[HOOK_REF]);
  if (!data) throw new Error("Hook target registry entry not found");

  const { observers } = data;
  observers.set(hook.data.prop, [...(observers.get(hook.data.prop) || []), ...callback]);

  return () => unwatch(value, ...callback);
};

export const unwatch = (value: any, ...callback: Function[]): void => {
  if (!isHook(value)) throw new TypeError("value must be a hook");
  const hook = value;

  const data = Registry.get(hook[HOOK_REF]);
  if (!data) return;

  const { observers } = data;
  const currentObservers = observers.get(hook.data.prop) || [];
  observers.set(
    hook.data.prop,
    currentObservers.filter((fn) => !callback.includes(fn))
  );
};

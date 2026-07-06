import { traverse, inTheDocument } from "./utils";

export interface LifecycleHooks {
  beforeCreate: Function[];
  afterCreate: Function[];
  beforeHydrate: Function[];
  afterHydrate: Function[];
}

export const lifecycleHooks: LifecycleHooks = {
  beforeCreate: [],
  afterCreate: [],
  beforeHydrate: [],
  afterHydrate: [],
};

/**
 * Registers callbacks for a lifecycle stage.
 */
export const onLifecycle = (type: keyof LifecycleHooks, ...callbacks: Function[]) =>
  lifecycleHooks[type].push(...callbacks);

/**
 * Removes a callback from a lifecycle stage.
 */
export const removeLifecycle = (type: keyof LifecycleHooks, callback: Function) => {
  lifecycleHooks[type] = lifecycleHooks[type].filter((fn) => fn !== callback);
};

/**
 * Runs all callbacks for a lifecycle stage.
 * For `beforeCreate`, callbacks transform the HTML string (reduce).
 * For all others, callbacks run as side effects (forEach).
 */
export const runLifecycle = (type: keyof LifecycleHooks, ...args: any[]): any => {
  if (type === "beforeCreate") {
    return lifecycleHooks.beforeCreate.reduce(
      (result, fn) => fn(result),
      args[0]
    );
  }

  lifecycleHooks[type].forEach((fn) => fn(...args));
};

// ============= DOM MUTATIONOBSERVER LIFECYCLE =============

let observer: MutationObserver | null = null;
const OBSERVER_CONFIG = { childList: true, subtree: true };

export const triggerLifecycle = (type: string, root: Element) => {
  traverse(root, (node) => node.dispatchEvent(new Event(`@${type}`)));
};

export const mutationCallback = (mutations: MutationRecord[]) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          triggerLifecycle("mount", node);
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node instanceof Element) {
          triggerLifecycle("unmount", node);

          if (!inTheDocument(node)) {
            triggerLifecycle("destroy", node);
          }
        }
      });
    }
  });
};

/**
 * Enables DOM MutationObserver lifecycles (@mount, @unmount, @destroy).
 */
export const enableLifecycle = () => {
  if (observer) observer.disconnect();
  observer = new MutationObserver(mutationCallback);
  observer.observe(document.body, OBSERVER_CONFIG);
};

/**
 * Disables DOM MutationObserver lifecycles.
 */
export const disableLifecycle = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

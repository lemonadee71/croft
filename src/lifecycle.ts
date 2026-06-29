import { isArray, compose, traverse, inTheDocument } from "./utils";

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
 * Registers a callback to process the raw HTML template string before elements are parsed.
 * @param callbacks Callback functions mapping HTML string to HTML string.
 */
export const onBeforeCreate = (...callbacks: Function[]) =>
  lifecycleHooks.beforeCreate.push(...callbacks);

export const removeBeforeCreate = (callback: Function) => {
  lifecycleHooks.beforeCreate = lifecycleHooks.beforeCreate.filter((fn) => fn !== callback);
};

export const runBeforeCreate = (htmlString: string): string =>
  lifecycleHooks.beforeCreate.reduce(
    (result, fn) => fn(result),
    htmlString
  );

/**
 * Registers a callback to run right after a DocumentFragment is created from a template.
 * @param callbacks Callback functions taking the DocumentFragment and values dictionary.
 */
export const onAfterCreate = (...callbacks: Function[]) =>
  lifecycleHooks.afterCreate.push(...callbacks);

export const removeAfterCreate = (callback: Function) => {
  lifecycleHooks.afterCreate = lifecycleHooks.afterCreate.filter((fn) => fn !== callback);
};

export const runAfterCreate = (...args: any[]) =>
  lifecycleHooks.afterCreate.forEach((fn) => fn(...args));

/**
 * Registers a callback to run before directives are hydrated on the created elements.
 * @param callbacks Callback functions taking the DocumentFragment and values dictionary.
 */
export const onBeforeHydrate = (...callbacks: Function[]) =>
  lifecycleHooks.beforeHydrate.push(...callbacks);

export const removeBeforeHydrate = (callback: Function) => {
  lifecycleHooks.beforeHydrate = lifecycleHooks.beforeHydrate.filter((fn) => fn !== callback);
};

export const runBeforeHydrate = (...args: any[]) =>
  lifecycleHooks.beforeHydrate.forEach((fn) => fn(...args));

/**
 * Registers a callback to run after directives have been fully hydrated.
 * @param callbacks Callback functions taking the DocumentFragment and values dictionary.
 */
export const onAfterHydrate = (...callbacks: Function[]) =>
  lifecycleHooks.afterHydrate.push(...callbacks);

export const removeAfterHydrate = (callback: Function) => {
  lifecycleHooks.afterHydrate = lifecycleHooks.afterHydrate.filter((fn) => fn !== callback);
};

export const runAfterHydrate = (...args: any[]) =>
  lifecycleHooks.afterHydrate.forEach((fn) => fn(...args));

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

import { traverse } from "./utils";

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
    return lifecycleHooks.beforeCreate.reduce((result, fn) => fn(result), args[0]);
  }

  lifecycleHooks[type].forEach((fn) => fn(...args));
};

// ============= DOM MUTATIONOBSERVER LIFECYCLE =============

let observer: MutationObserver | null = null;
const OBSERVER_CONFIG = { childList: true, subtree: true };

// Module-level references to avoid jsdom MutationObserver scope issues
let _Event: typeof Event;
let _document: Document;
try {
  _Event = Event;
} catch {}
try {
  _document = document;
} catch {}

export const triggerLifecycle = (type: string, root: Element) => {
  traverse(root, (node) => void node.dispatchEvent(new _Event(`@${type}`)));
};

const inDocument = (node: Node): boolean => !!_document?.body?.contains(node);

export const mutationCallback = (mutations: MutationRecord[]) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          triggerLifecycle("mount", node as Element);
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          triggerLifecycle("unmount", node as Element);

          if (!inDocument(node)) {
            triggerLifecycle("destroy", node as Element);
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

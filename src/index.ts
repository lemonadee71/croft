import { createHook, watch, unwatch, computed, effect } from "./hooks";
import { addDirective, removeDirective } from "./directives";
import { defineComponent, removeComponent } from "./components";
import {
  onLifecycle,
  removeLifecycle,
  runLifecycle,
  disableLifecycle,
  enableLifecycle,
} from "./lifecycle";
import { html, render, mount } from "./renderer";
import {
  applyProps,
  createElementFromTemplate,
  processDirectives,
  modifyElement,
} from "./pipeline";
import {
  uid,
  hash,
  getPlaceholderId,
  escapeHTML,
  unescapeHTML,
  setMetadata,
  isPlainObject,
  isNullOrUndefined,
  isObject,
  isFunction,
  isString,
  isNumber,
  isArray,
  isNode,
  isTextNode,
  isElement,
  isSVG,
  isFragment,
  isTemplate,
  isPlaceholder,
  isTruthy,
  isHook,
} from "./utils";

// Start DOM mutation observer lifecycles automatically (safe if DOM is unavailable)
try {
  enableLifecycle();
} catch {
  // Not in a browser environment — lifecycle disabled by default
}

export {
  html,
  render,
  mount,
  applyProps,
  createElementFromTemplate,
  processDirectives,
  createHook,
  computed,
  effect,
  watch,
  unwatch,
  modifyElement,
  defineComponent,
  removeComponent,
};

export type { ComponentRenderer } from "./components";
export type { HookRef } from "./hooks";
export type { Directive, ModifyElementFn } from "./directives";

/**
 * Global configuration and plugin entry point for croft.
 */
const Croft = {
  /** Registered custom plugins configuration. */
  plugins: {} as Record<string, any>,

  /**
   * Mounts a plugin configuration on Croft.
   * @param name Unique name for the plugin.
   * @param config Configuration object. If it contains `_init`, it will be executed.
   */
  mount(name: string, config: any) {
    if (name in this.plugins) throw new Error(`${name} is already taken`);
    const copy = { ...config };
    delete copy._init;
    this.plugins[name] = copy;
    config._init?.call?.(this);
  },

  /** Registers custom directives. */
  addDirective,
  /** Removes custom directives. */
  removeDirective,

  /** Registers a hook for a lifecycle stage. */
  onLifecycle,
  /** Removes a hook from a lifecycle stage. */
  removeLifecycle,
  /** Evaluates all hooks for a lifecycle stage. */
  runLifecycle,

  /** Registers a custom component. */
  defineComponent,
  /** Removes a custom component. */
  removeComponent,

  /** Disables DOM MutationObserver lifecycle listeners. */
  disableLifecycle,

  /** Core utilities made public for custom directives and plugins. */
  utils: {
    uid,
    hash,
    getPlaceholderId,
    escapeHTML,
    unescapeHTML,
    setMetadata,
    isPlainObject,
    isNullOrUndefined,
    isObject,
    isFunction,
    isString,
    isNumber,
    isArray,
    isNode,
    isTextNode,
    isElement,
    isSVG,
    isFragment,
    isTemplate,
    isPlaceholder,
    isTruthy,
    isHook,
  },
};

export default Croft;

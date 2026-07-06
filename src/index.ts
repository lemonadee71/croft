import { createHook, watch, unwatch } from "./hooks";
import { addDirective, removeDirective } from "./directives";
import { defineComponent, removeComponent, ComponentsRegistry, type ComponentRenderer } from "./components";
import {
  onLifecycle,
  removeLifecycle,
  runLifecycle,
  disableLifecycle,
  enableLifecycle,
} from "./lifecycle";

// Start DOM mutation observer lifecycles automatically (safe if DOM is unavailable)
try {
  enableLifecycle();
} catch {
  // Not in a browser environment — lifecycle disabled by default
}
import {
  html,
  render,
  applyProps,
  createElementFromTemplate,
  processDirectives,
  modifyElement,
} from "./renderer";
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

export {
  html,
  render,
  applyProps,
  createElementFromTemplate,
  processDirectives,
  createHook,
  watch,
  unwatch,
  modifyElement,
  defineComponent,
  removeComponent,
};

/**
 * Global configuration and plugin entry point for peasant-jsx.
 */
const PoorManJSX = {
  /** Registered custom plugins configuration. */
  plugins: {} as Record<string, any>,

  /**
   * Mounts a plugin configuration on PoorManJSX.
   * @param name Unique name for the plugin.
   * @param config Configuration object. If it contains `_init`, it will be executed.
   */
  mount(name: string, config: any) {
    if (name in this.plugins) throw new Error(`${name} is already taken`);
    const copy = { ...config };
    delete copy._init;
    this.plugins[name] = copy;
    config._init?.call?.(this);

    if (name === "components") {
      for (const [tagName, renderFn] of Object.entries(copy)) {
        ComponentsRegistry.set(tagName, renderFn as ComponentRenderer);
      }
    }
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

export default PoorManJSX;

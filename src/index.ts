import { createHook, watch, unwatch } from "./hooks";
import { addDirective, removeDirective } from "./directives";
import {
  onBeforeCreate,
  removeBeforeCreate,
  runBeforeCreate,
  onAfterCreate,
  removeAfterCreate,
  runAfterCreate,
  onBeforeHydrate,
  removeBeforeHydrate,
  runBeforeHydrate,
  onAfterHydrate,
  removeAfterHydrate,
  runAfterHydrate,
  disableLifecycle,
  enableLifecycle,
} from "./lifecycle";
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

// Start DOM mutation observer lifecycles automatically
enableLifecycle();

export {
  /**
   * Tagged template literal to create a Template from JSX-like HTML string.
   */
  html,
  /**
   * Compiles a Template and attaches it to a target DOM node or selector.
   */
  render,
  /**
   * Programmatically applies properties/directives to a DOM element.
   */
  applyProps,
  /**
   * Creates a DocumentFragment from a Template.
   */
  createElementFromTemplate,
  /**
   * Manually triggers directive processing/hydration on a DOM node.
   */
  processDirectives,
  /**
   * Creates a typesafe reactive state proxy.
   */
  createHook,
  /**
   * Subscribes to changes on a reactive hook property reference.
   */
  watch,
  /**
   * Unsubscribes a listener from a hook property reference.
   */
  unwatch,
  /**
   * Helper utility to apply directives/attributes directly to an element.
   */
  modifyElement,
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
  },

  /** Registers custom directives. */
  addDirective,
  /** Removes custom directives. */
  removeDirective,

  /** Registers a hook to run before DocumentFragment creation. */
  onBeforeCreate,
  /** Removes a hook running before DocumentFragment creation. */
  removeBeforeCreate,
  /** Evaluates all hooks before DocumentFragment creation. */
  runBeforeCreate,

  /** Registers a hook to run after DocumentFragment creation. */
  onAfterCreate,
  /** Removes a hook running after DocumentFragment creation. */
  removeAfterCreate,
  /** Evaluates all hooks after DocumentFragment creation. */
  runAfterCreate,

  /** Registers a hook to run before directive hydration. */
  onBeforeHydrate,
  /** Removes a hook running before directive hydration. */
  removeBeforeHydrate,
  /** Evaluates all hooks before directive hydration. */
  runBeforeHydrate,

  /** Registers a hook to run after directive hydration. */
  onAfterHydrate,
  /** Removes a hook running after directive hydration. */
  removeAfterHydrate,
  /** Evaluates all hooks after directive hydration. */
  runAfterHydrate,

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

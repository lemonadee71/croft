import {
  PLACEHOLDER_REGEX,
  WRAPPING_BRACKETS,
  WRAPPING_QUOTES,
  LIFECYCLE_METHODS,
  BOOLEAN_ATTRS,
  Template,
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
  setMetadata,
  addKeyRecursive,
  uid,
  hash,
  escapeHTML,
  unescapeHTML,
  compose,
  resolve,
  isPlainObject,
  inTheDocument,
  getChildNodes,
  getChildren,
  traverse,
  getPlaceholderId,
  getPlaceholders,
  getBoundary,
  createMarkers,
} from "./utils";

import { registerIfHook, createHook, watch, unwatch } from "./hooks";

export {
  html,
  render,
  applyProps,
  createElementFromTemplate,
  processDirectives,
  createHook,
  watch,
  unwatch,
};

// ============= DIRECTIVES RESOLUTION =============

const attrNameDirectives = [
  (key: string) => ["on", "class", "style"].includes(key) && key,
  (key: string) => key.startsWith("style:") && ["style:prop", key.replace("style:", "")],
  (key: string) => key.startsWith("class:") && ["class:name", key.replace("class:", "")],
  (key: string) => {
    const k = key.toLowerCase().trim();
    const name = k.replace("on", "");
    return k.startsWith("on") && LIFECYCLE_METHODS.includes(name) ? ["lifecycle", name] : null;
  },
  (key: string) =>
    key.toLowerCase().startsWith("on") && key !== "on"
      ? ["listener", key.replace("on", "").toLowerCase()]
      : null,
  (key: string) => {
    const [k] = key.split(".");
    return BOOLEAN_ATTRS.includes(k) || k.startsWith("toggle:")
      ? ["toggle", key.replace("toggle:", "")]
      : null;
  },
  (key: string) => key === ":key" && "key",
  (key: string) => key === ":skip" && "skip",
  (key: string) => key === ":text" && "text",
  (key: string) => key === ":html" && "html",
  (key: string) => key === ":children" && "children",
  (key: string) => key === ":ref" && "ref",
  (key: string) => key === ":show" && "show",
  (key: string) => key === ":visible" && "visible",
];

const objKeyDirectives = [
  (key: string) => key === "textContent" && "text",
  (key: string) => key === "innerHTML" && "html",
  (key: string) => key === "html" && "html",
  (key: string) => key === "children" && "children",
  (key: string) => key === "_key" && "key",
  (key: string) => key === "_skip" && "skip",
  (key: string) => key === "_ref" && "ref",
  (key: string) => key === "_show" && "show",
  (key: string) => key === "_visible" && "visible",
];

const getType = (str: string, directives: Function[]) => {
  for (const predicate of directives) {
    const result = predicate(str);
    if (isString(result)) return [result, str];
    if (isArray(result)) return result;
  }
  return ["attr", str];
};

export const getTypeOfAttrName = (attrName: string) => {
  const allDirectives = [...attrNameDirectives, ...getAdditionalAttrDirectives()];
  return getType(attrName, allDirectives);
};

export const getTypeOfKey = (objKey: string) => {
  const allDirectives = [
    ...attrNameDirectives,
    ...getAdditionalAttrDirectives(),
    ...objKeyDirectives,
    ...getAdditionalKeyDirectives(),
  ];
  return getType(objKey, allDirectives);
};

// ============= DIRECTIVE PLUGIN REGISTRY =============

interface Directive {
  name?: string;
  type: string;
  predicate?: any;
  callback: (element: HTMLElement, data: any, modify: any) => void;
}

const DirectivesRegistry = new Map<
  string,
  {
    type: string;
    predicate: { attrName: Function | null; objKey: Function | null };
    callback: Function;
  }
>();

const getAdditionalAttrDirectives = () =>
  Array.from(DirectivesRegistry.values())
    .map((dir) => dir.predicate.attrName)
    .filter((fn): fn is Function => !!fn);

const getAdditionalKeyDirectives = () =>
  Array.from(DirectivesRegistry.values())
    .map((dir) => dir.predicate.objKey)
    .filter((fn): fn is Function => !!fn);

const getPlugins = () => {
  const map: Record<string, Function> = {};
  for (const [_, data] of DirectivesRegistry.entries()) {
    map[data.type] = data.callback;
  }
  return map;
};

const createPredicate = (type: string, fn?: Function) => (key: string) =>
  (fn ? fn(key) : key === type) && [type, key];

const registerDirective = ({ name, type, predicate, callback }: Directive) => {
  const typeChecker = {
    attrName: null as Function | null,
    objKey: null as Function | null,
  };

  if (!predicate) {
    typeChecker.attrName = createPredicate(type);
    typeChecker.objKey = createPredicate(type);
  } else if (isFunction(predicate)) {
    typeChecker.attrName = createPredicate(type, predicate);
    typeChecker.objKey = createPredicate(type, predicate);
  } else if (isArray(predicate)) {
    typeChecker.attrName = createPredicate(type, predicate[0]);
    typeChecker.objKey = createPredicate(type, predicate[1]);
  } else if (isPlainObject(predicate)) {
    typeChecker.attrName = createPredicate(type, (predicate as any).attrName);
    typeChecker.objKey = createPredicate(type, (predicate as any).objKey);
  }

  DirectivesRegistry.set(name || type, {
    type,
    predicate: typeChecker,
    callback,
  });
};

export const addDirective = (...directives: Directive[]) => {
  directives.forEach((dir) => registerDirective(dir));
};

export const removeDirective = (...names: string[]) => {
  names.forEach((name) => DirectivesRegistry.delete(name));
};

// ============= TEMPLATE LIFECYCLE HOOKS =============

interface LifecycleHooks {
  beforeCreate: Function[];
  afterCreate: Function[];
  beforeHydrate: Function[];
  afterHydrate: Function[];
}

const lifecycleHooks: LifecycleHooks = {
  beforeCreate: [],
  afterCreate: [],
  beforeHydrate: [],
  afterHydrate: [],
};

export const onBeforeCreate = (...callbacks: Function[]) =>
  lifecycleHooks.beforeCreate.push(...callbacks);
export const removeBeforeCreate = (callback: Function) => {
  lifecycleHooks.beforeCreate = lifecycleHooks.beforeCreate.filter((fn) => fn !== callback);
};
export const runBeforeCreate = (htmlString: string): string =>
  lifecycleHooks.beforeCreate.reduce(
    (result, fn) => (isArray(fn) ? compose(...fn)(result) : fn(result)),
    htmlString
  );

export const onAfterCreate = (...callbacks: Function[]) =>
  lifecycleHooks.afterCreate.push(...callbacks);
export const removeAfterCreate = (callback: Function) => {
  lifecycleHooks.afterCreate = lifecycleHooks.afterCreate.filter((fn) => fn !== callback);
};
export const runAfterCreate = (...args: any[]) =>
  lifecycleHooks.afterCreate.forEach((fn) => fn(...args));

export const onBeforeHydrate = (...callbacks: Function[]) =>
  lifecycleHooks.beforeHydrate.push(...callbacks);
export const removeBeforeHydrate = (callback: Function) => {
  lifecycleHooks.beforeHydrate = lifecycleHooks.beforeHydrate.filter((fn) => fn !== callback);
};
export const runBeforeHydrate = (...args: any[]) =>
  lifecycleHooks.beforeHydrate.forEach((fn) => fn(...args));

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

export const enableLifecycle = () => {
  observer = new MutationObserver(mutationCallback);
  observer.observe(document.body, OBSERVER_CONFIG);
};

export const disableLifecycle = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

// ============= RENDERING & DIRECTIVES ENGINE =============

const html = (fragments: TemplateStringsArray, ...values: any[]): Template => {
  const mappedValues: Record<string, any> = {};
  const replacedValues = values.map((value) => {
    if (isNullOrUndefined(value)) return "";

    if (isObject(value) || isFunction(value)) {
      const id = uid();
      mappedValues[id] = value;
      return `__${id}__`;
    }

    return escapeHTML(`${value}`);
  });

  const templateString = replacedValues
    .reduce((full, str, i) => `${full}${str}${fragments[i + 1]}`, fragments[0])
    .trim();

  return new Template(templateString, mappedValues);
};

const render = (template: Template, target?: string | HTMLElement): any => {
  const fragment = createElementFromTemplate(template);

  if (target) {
    const parent = isString(target) ? document.querySelector(target) : target;
    if (!parent || !(parent instanceof HTMLElement)) {
      throw new Error("Target is not a valid HTMLElement");
    }
    parent.append(fragment);
    return parent;
  }

  return fragment;
};

const createElementFromTemplate = (template: Template): DocumentFragment => {
  const str = runBeforeCreate(template.template);
  const fragment = document.createRange().createContextualFragment(str);

  runAfterCreate(fragment, template.values);
  processDirectives(fragment, template.values);

  for (const child of getChildren(fragment)) {
    triggerLifecycle("create", child);
  }

  return fragment;
};

const processDirectives = (root: HTMLElement | DocumentFragment, context: Record<string, any>) => {
  const fns = [resolveBody, runBeforeHydrate, resolveAttributes, runAfterHydrate];

  for (const fn of fns) fn.call(null, root, context);
};

const resolveBody = (root: HTMLElement | DocumentFragment, values: Record<string, any>) => {
  for (const node of getPlaceholders(root)) {
    const text = (node.textContent || "").trim();
    const value = values[getPlaceholderId(text)];
    const options = {
      element: node.parentElement as HTMLElement,
      type: "children",
      target: undefined as any,
    };

    if (isHook(value)) {
      const [head, tail, marker] = createMarkers();
      options.target = marker;
      node.before(head);
      node.after(tail);
    }

    node.replaceWith(...resolveValue(value, options));
  }
};

const resolveAttributes = (root: HTMLElement | DocumentFragment, values: Record<string, any>) => {
  for (const child of getChildren(root)) {
    traverse(child, (element: any) => {
      if (element.__meta?.hydrated) return;

      for (const attr of Array.from(element.attributes) as Attr[]) {
        const rawName = attr.name;
        const rawValue = attr.value.trim();

        // 1: If passed as an attribute placeholder
        if (isPlaceholder(rawName)) {
          const id = getPlaceholderId(rawName);
          const value = values[id];

          if (isArray(value)) {
            for (const item of value) {
              if (isPlainObject(item)) {
                applyProps(element, item);
              } else if (isString(item)) {
                const [n, v] = item.split("=");
                element.setAttribute(n, (v || "").replace(WRAPPING_QUOTES, ""));
              } else {
                throw new TypeError(
                  "Arrays passed inside the opening tag can only contain strings and plain objects"
                );
              }
            }
          } else if (isPlainObject(value)) {
            applyProps(element, value);
          } else {
            throw new Error("You can only pass plain objects or arrays");
          }

          element.removeAttribute(rawName);
        }
        // 2: If passed as a value
        else {
          const [type, attrName] = getTypeOfAttrName(rawName);
          const match = rawValue.match(PLACEHOLDER_REGEX);
          const value = match ? values[getPlaceholderId(match[0])] : rawValue;

          if (type !== "attr") {
            element.removeAttribute(rawName);

            modifyElement(element, type, {
              key: attrName,
              value: resolveValue(value, {
                element,
                type,
                target: attrName,
              }),
            });
          }
        }
      }

      setMetadata(element, "hydrated", true);
    });
  }
};

const addTrap = (hook: any, callback: Function) => {
  const previousTrap = hook.data.trap;
  hook.data.trap = compose((value: any) => resolve(value, previousTrap), callback);
  return hook;
};

const normalizeChildren = (items: any): Node[] => {
  const normalized = [items]
    .flat()
    .filter((item) => item !== true && item !== false && !isNullOrUndefined(item))
    .map((item) => {
      if (isString(item) || isNumber(item)) return document.createTextNode(String(item));
      if (isTemplate(item)) return createElementFromTemplate(item);
      return item;
    })
    .flatMap((item) => (isFragment(item) ? getChildNodes(item) : item));

  addKeyRecursive(normalized);

  return normalized;
};

const resolveValue = (value: any, options: { element: HTMLElement; type: string; target: any }) => {
  let final = value;

  if (options.type === "children") {
    final = isHook(final)
      ? addTrap(
          final,
          compose(normalizeChildren, (items: Node[]) =>
            items.map((item) => setMetadata(item, "ignore", true))
          )
        )
      : normalizeChildren(final);
  }

  return registerIfHook(final, options);
};

const applyProps = (element: HTMLElement, changes: Record<string, any>): HTMLElement => {
  for (const [rawKey, value] of Object.entries(changes)) {
    const [type, key] = getTypeOfKey(rawKey);

    modifyElement(element, type, {
      key,
      value: resolveValue(value, { element, type, target: key }),
    });
  }

  return element;
};

export const modifyElement = (
  target: any,
  type: string,
  data: { key: any; value: any },
  context: Document | HTMLElement | DocumentFragment = document
): HTMLElement => {
  const plugins = getPlugins();
  const element =
    isElement(target) || isSVG(target) ? target : (context as any).querySelector(target);

  if (!element) return target;

  switch (type) {
    case "text":
      element.textContent = data.value;
      break;
    case "html":
      element.innerHTML = unescapeHTML(data.value);
      break;
    case "attr":
      element.setAttribute(data.key, data.value);
      break;
    case "toggle": {
      const [arg, option] = data.key.split(".");
      const attrs = arg.replace(WRAPPING_BRACKETS, "").split(",");

      for (const name of attrs) {
        if (isTruthy(data.value)) {
          let value = "";
          if (option === "mirror") value = name;
          else if (option === "preserve") value = data.value;

          element.setAttribute(name, value);
        } else {
          element.removeAttribute(name);
        }
      }
      break;
    }
    case "class:name": {
      const [ifTrue, ifFalse] = data.key
        .replace(WRAPPING_BRACKETS, "")
        .split("|")
        .map((str: string) => str.split(","));

      if (isTruthy(data.value)) {
        if (ifFalse) element.classList.remove(...ifFalse);
        element.classList.add(...ifTrue);
      } else {
        element.classList.remove(...ifTrue);
        if (ifFalse) element.classList.add(...ifFalse);
      }
      break;
    }
    case "class":
      if (isString(data.value)) {
        element.classList.add(...data.value.split(" ").filter(isTruthy));
      } else if (isArray(data.value)) {
        for (const value of data.value) {
          modifyElement(element, "class", { key: undefined, value });
        }
      } else if (isPlainObject(data.value)) {
        for (const [n, v] of Object.entries(data.value)) {
          modifyElement(element, "class:name", { key: n, value: v });
        }
      } else {
        throw new TypeError("You can only pass a string, an array, or a plain object to class.");
      }
      break;
    case "style:prop":
      element.style[data.key] = data.value;
      break;
    case "style":
      if (isString(data.value)) {
        element.setAttribute("style", data.value);
      } else if (isPlainObject(data.value)) {
        for (const [n, v] of Object.entries(data.value)) {
          modifyElement(element, "style:prop", { key: n, value: v });
        }
      } else {
        throw new TypeError("You can only pass a string or a plain object to style.");
      }
      break;
    case "lifecycle": {
      const fns = [data.value].flat();
      const key = data.key === "load" ? "mount" : data.key;
      const once = data.key === "create" || data.key === "load";

      for (const fn of fns) {
        element.addEventListener(`@${key}`, fn, { once });
      }
      break;
    }
    case "listener": {
      const [eventName, ...options] = data.key.split(".");
      const fns = [data.value].flat();

      if (!fns.every(isFunction)) {
        throw new TypeError("Event listener only accepts function | function[]");
      }

      for (const fn of fns) {
        const callback = (e: Event) => {
          if (options.includes("self") && e.target !== e.currentTarget) return;
          fn(e);
          if (options.includes("prevent")) e.preventDefault();
          if (options.includes("only")) e.stopImmediatePropagation();
          else if (options.includes("stop")) e.stopPropagation();
        };

        element.addEventListener(eventName, callback as any, {
          once: options.includes("once"),
          capture: options.includes("capture"),
          passive: options.includes("passive"),
        });
      }
      break;
    }
    case "on":
      if (!isPlainObject(data.value) || !Object.values(data.value).flat().every(isFunction)) {
        throw new TypeError("Event listener only accepts function | function[]");
      }

      for (const [evt, fns] of Object.entries(data.value)) {
        const evtType = LIFECYCLE_METHODS.includes(evt) ? "lifecycle" : "listener";

        modifyElement(element, evtType, { key: evt, value: fns });
      }
      break;
    case "children": {
      const previousActiveElement = document.activeElement;

      const allNodes = getChildNodes(element);
      const [start, end] = data.key ? getBoundary(data.key, allNodes) : [0, allNodes.length];
      const targetNodes = allNodes.slice(start, end);

      for (const node of targetNodes) element.removeChild(node);

      const fragment = document.createDocumentFragment();
      fragment.append(...data.value);

      if (end >= allNodes.length) {
        element.append(fragment);
      } else {
        element.insertBefore(fragment, allNodes[end]);
      }

      const matchingElement = getChildren(element).find((child) =>
        child.isEqualNode(previousActiveElement)
      );
      (matchingElement as HTMLElement)?.focus();
      break;
    }
    case "key": {
      const key = data.value.startsWith("$")
        ? element.getAttribute(data.value.replace("$", ""))
        : data.value;
      setMetadata(element, "key", key);
      break;
    }
    case "skip": {
      if (!data.value) {
        setMetadata(element, "skip", { all: true });
      } else {
        const options = data.value.split(",");
        const others = options.filter((str: string) => !["all", "attr"].includes(str));

        setMetadata(element, "skip", {
          all: options.includes("all"),
          attr: options.includes("attr"),
          others,
        });
      }
      break;
    }
    case "ref": {
      const [key, o] = isArray(data.value) ? data.value : ["current", data.value];

      if (!isPlainObject(o)) {
        throw new TypeError("Ref only accepts plain object");
      }

      o[key] = element;
      break;
    }
    case "show": {
      let display = element.__meta?.og_display;

      if (!display) {
        display = window.getComputedStyle(element).display;
        setMetadata(element, "og_display", display);
      }

      if (isTruthy(data.value)) element.style.display = display;
      else element.style.display = "none";
      break;
    }
    case "visible":
      if (isTruthy(data.value)) element.style.visibility = "visible";
      else element.style.visibility = "hidden";
      break;

    default:
      if (plugins[type]) {
        plugins[type](element, data, modifyElement);
      }
  }

  return element;
};

// ============= GLOBAL CONFIG OBJECT =============

const PoorManJSX = {
  plugins: {} as Record<string, any>,
  mount(name: string, config: any) {
    if (name in this.plugins) throw new Error(`${name} is already taken`);
    const copy = { ...config };
    delete copy._init;
    this.plugins[name] = copy;
    config._init?.call?.(this);
  },
  addDirective,
  removeDirective,
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

enableLifecycle();

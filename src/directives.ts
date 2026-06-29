import {
  LIFECYCLE_METHODS,
  BOOLEAN_ATTRS,
  WRAPPING_BRACKETS,
  unescapeHTML,
  isString,
  isArray,
  isPlainObject,
  isFunction,
  isTruthy,
  setMetadata,
  getChildNodes,
  getBoundary,
  getChildren,
} from "./utils";

/**
 * Interface representing a custom directive plugin.
 */
export interface Directive {
  /** Optional name to identify the directive in the registry. Defaults to type. */
  name?: string;
  /** The directive type name (e.g. "autosize"). */
  type: string;
  /**
   * Predicate used to match the attribute name or object key.
   * Can be a function, a tuple of functions `[attrNameFn, objKeyFn]`,
   * or an object `{ attrName: attrNameFn, objKey: objKeyFn }`.
   */
  predicate?: any;
  /**
   * The handler callback executed when the directive is applied.
   * @param element The DOM element the directive is attached to.
   * @param data The payload containing `key` (arguments) and `value` (assigned value).
   * @param modify A utility to recursively modify the element.
   */
  callback: (element: HTMLElement, data: { key: any; value: any }, modify: any) => void;
}

export interface RegistryEntry {
  type: string;
  predicate: {
    attrName: (key: string) => [string, string] | null | false;
    objKey: (key: string) => [string, string] | null | false;
  };
  callback: (element: HTMLElement, data: { key: any; value: any }, modify: any) => void;
}

export const DirectivesRegistry = new Map<string, RegistryEntry>();

const createPredicate = (type: string, fn?: Function) => (key: string): [string, string] | false => {
  if (fn) {
    const result = fn(key);
    if (!result) return false;
    if (isArray(result)) return result as [string, string];
    return [type, key];
  }
  return key === type ? [type, key] : false;
};

const normalizePredicate = (type: string, predicate: any) => {
  const typeChecker = {
    attrName: null as any,
    objKey: null as any,
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
    typeChecker.attrName = createPredicate(type, predicate.attrName);
    typeChecker.objKey = createPredicate(type, predicate.objKey);
  }

  return typeChecker;
};

/**
 * Registers one or more custom directives to extend peasant-jsx.
 * @param directives The custom directive configurations to register.
 */
export const addDirective = (...directives: Directive[]) => {
  directives.forEach((dir) => {
    const typeChecker = normalizePredicate(dir.type, dir.predicate);
    DirectivesRegistry.set(dir.name || dir.type, {
      type: dir.type,
      predicate: typeChecker,
      callback: dir.callback,
    });
  });
};

/**
 * Removes one or more custom directives from the registry by their name or type.
 * @param names The names or types of custom directives to remove.
 */
export const removeDirective = (...names: string[]) => {
  names.forEach((name) => DirectivesRegistry.delete(name));
};

// ============= BUILT-IN DIRECTIVES =============

export const BuiltinDirectives: RegistryEntry[] = [
  {
    type: "attr",
    predicate: {
      attrName: () => false,
      objKey: () => false,
    },
    callback: (element, data) => {
      element.setAttribute(data.key, data.value);
    },
  },
  {
    type: "text",
    predicate: {
      attrName: (key) => key === ":text" && ["text", key],
      objKey: (key) => key === "textContent" && ["text", key],
    },
    callback: (element, data) => {
      element.textContent = data.value;
    },
  },
  {
    type: "html",
    predicate: {
      attrName: (key) => key === ":html" && ["html", key],
      objKey: (key) => (key === "innerHTML" || key === "html") && ["html", key],
    },
    callback: (element, data) => {
      element.innerHTML = unescapeHTML(data.value);
    },
  },
  {
    type: "class:name",
    predicate: {
      attrName: (key) => key.startsWith("class:") && ["class:name", key.replace("class:", "")],
      objKey: (key) => key.startsWith("class:") && ["class:name", key.replace("class:", "")],
    },
    callback: (element, data) => {
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
    },
  },
  {
    type: "class",
    predicate: {
      attrName: (key) => (key === "class" || key === ":_class") && ["class", key],
      objKey: (key) => key === "class" && ["class", key],
    },
    callback: (element, data, modify) => {
      if (isString(data.value)) {
        element.classList.add(...data.value.split(" ").filter(isTruthy));
      } else if (isArray(data.value)) {
        for (const value of data.value) {
          modify(element, "class", { key: undefined, value });
        }
      } else if (isPlainObject(data.value)) {
        for (const [n, v] of Object.entries(data.value)) {
          modify(element, "class:name", { key: n, value: v });
        }
      } else {
        throw new TypeError("You can only pass a string, an array, or a plain object to class.");
      }
    },
  },
  {
    type: "style:prop",
    predicate: {
      attrName: (key) => key.startsWith("style:") && ["style:prop", key.replace("style:", "")],
      objKey: (key) => key.startsWith("style:") && ["style:prop", key.replace("style:", "")],
    },
    callback: (element, data) => {
      const key = data.key.replace(/([A-Z])/g, "-$1").toLowerCase();
      element.style.setProperty(key, data.value);
    },
  },
  {
    type: "style",
    predicate: {
      attrName: (key) => key === "style" && ["style", key],
      objKey: (key) => key === "style" && ["style", key],
    },
    callback: (element, data, modify) => {
      if (isString(data.value)) {
        element.setAttribute("style", data.value);
      } else if (isPlainObject(data.value)) {
        for (const [n, v] of Object.entries(data.value)) {
          modify(element, "style:prop", { key: n, value: v });
        }
      } else {
        throw new TypeError("You can only pass a string or a plain object to style.");
      }
    },
  },
  {
    type: "lifecycle",
    predicate: {
      attrName: (key) => {
        const k = key.toLowerCase().trim();
        const name = k.replace("on", "");
        return k.startsWith("on") && LIFECYCLE_METHODS.includes(name) ? ["lifecycle", name] : false;
      },
      objKey: (key) => {
        const k = key.toLowerCase().trim();
        const name = k.replace("on", "");
        return k.startsWith("on") && LIFECYCLE_METHODS.includes(name) ? ["lifecycle", name] : false;
      },
    },
    callback: (element, data) => {
      const fns = [data.value].flat();
      const key = data.key === "load" ? "mount" : data.key;
      const once = data.key === "create" || data.key === "load";

      for (const fn of fns) {
        element.addEventListener(`@${key}`, fn, { once });
      }
    },
  },
  {
    type: "listener",
    predicate: {
      attrName: (key) =>
        key.toLowerCase().startsWith("on") && key !== "on"
          ? ["listener", key.replace("on", "").toLowerCase()]
          : false,
      objKey: (key) =>
        key.toLowerCase().startsWith("on") && key !== "on"
          ? ["listener", key.replace("on", "").toLowerCase()]
          : false,
    },
    callback: (element, data) => {
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
    },
  },
  {
    type: "on",
    predicate: {
      attrName: (key) => key === "on" && ["on", key],
      objKey: (key) => key === "on" && ["on", key],
    },
    callback: (element, data, modify) => {
      if (!isPlainObject(data.value) || !Object.values(data.value).flat().every(isFunction)) {
        throw new TypeError("Event listener only accepts function | function[]");
      }

      for (const [evt, fns] of Object.entries(data.value)) {
        const evtType = LIFECYCLE_METHODS.includes(evt) ? "lifecycle" : "listener";
        modify(element, evtType, { key: evt, value: fns });
      }
    },
  },
  {
    type: "toggle",
    predicate: {
      attrName: (key) => {
        const [k] = key.split(".");
        return BOOLEAN_ATTRS.includes(k) || k.startsWith("toggle:")
          ? ["toggle", key.replace("toggle:", "")]
          : false;
      },
      objKey: (key) => {
        const [k] = key.split(".");
        return BOOLEAN_ATTRS.includes(k) || k.startsWith("toggle:")
          ? ["toggle", key.replace("toggle:", "")]
          : false;
      },
    },
    callback: (element, data) => {
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
    },
  },
  {
    type: "children",
    predicate: {
      attrName: (key) => key === ":children" && ["children", key],
      objKey: (key) => key === "children" && ["children", key],
    },
    callback: (element, data) => {
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
    },
  },
  {
    type: "key",
    predicate: {
      attrName: (key) => key === ":key" && ["key", key],
      objKey: (key) => key === "_key" && ["key", key],
    },
    callback: (element, data) => {
      const key = data.value.startsWith("$")
        ? element.getAttribute(data.value.replace("$", ""))
        : data.value;
      setMetadata(element, "key", key);
    },
  },
  {
    type: "skip",
    predicate: {
      attrName: (key) => key === ":skip" && ["skip", key],
      objKey: (key) => key === "_skip" && ["skip", key],
    },
    callback: (element, data) => {
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
    },
  },
  {
    type: "ref",
    predicate: {
      attrName: (key) => key === ":ref" && ["ref", key],
      objKey: (key) => key === "_ref" && ["ref", key],
    },
    callback: (element, data) => {
      const [key, o] = isArray(data.value) ? data.value : ["current", data.value];

      if (!isPlainObject(o)) {
        throw new TypeError("Ref only accepts plain object");
      }

      o[key] = element;
    },
  },
  {
    type: "show",
    predicate: {
      attrName: (key) => key === ":show" && ["show", key],
      objKey: (key) => key === "_show" && ["show", key],
    },
    callback: (element, data) => {
      let display = (element as any).__meta?.og_display;

      if (!display) {
        display = window.getComputedStyle(element).display;
        setMetadata(element, "og_display", display);
      }

      if (isTruthy(data.value)) element.style.display = display;
      else element.style.display = "none";
    },
  },
  {
    type: "visible",
    predicate: {
      attrName: (key) => key === ":visible" && ["visible", key],
      objKey: (key) => key === "_visible" && ["visible", key],
    },
    callback: (element, data) => {
      if (isTruthy(data.value)) element.style.visibility = "visible";
      else element.style.visibility = "hidden";
    },
  },
];

export const resolveTypeAndKey = (key: string, isObjKey: boolean): [string, string] => {
  for (const dir of BuiltinDirectives) {
    const pred = isObjKey ? dir.predicate.objKey : dir.predicate.attrName;
    if (pred) {
      const matched = pred(key);
      if (matched) return matched;
    }
  }

  for (const dir of DirectivesRegistry.values()) {
    const pred = isObjKey ? dir.predicate.objKey : dir.predicate.attrName;
    if (pred) {
      const matched = pred(key);
      if (matched) return matched;
    }
  }

  return ["attr", key];
};

/**
 * Resolves the directive type and key from an HTML attribute name.
 * @param attrName The attribute name from an HTML element.
 * @returns A tuple of [type, key].
 */
export const getTypeOfAttrName = (attrName: string): [string, string] => {
  return resolveTypeAndKey(attrName, false);
};

/**
 * Resolves the directive type and key from an object key.
 * @param objKey The key from an object of properties/directives.
 * @returns A tuple of [type, key].
 */
export const getTypeOfKey = (objKey: string): [string, string] => {
  return resolveTypeAndKey(objKey, true);
};

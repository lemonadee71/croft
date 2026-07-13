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

type PredicateFn = (key: string) => string | false | [string, string];

type MatchRule =
  | string
  | PredicateFn
  | { attrName: string | PredicateFn; objKey: string | PredicateFn };

/**
 * Interface representing a custom directive plugin.
 */
export type Directive = {
  /** Registry key. Defaults to type. */
  name?: string;
  /** The directive type (e.g. "autosize"). Used as type/ID in registry. */
  type: string;
  /**
   * How to match this directive against attribute names or object keys.
   * - Omitted: exact match on `type` for both attr and obj.
   * - String: exact match on both attr and obj.
   * - Function: custom matcher used for both attr and obj.
   * - `{ attrName, objKey }`: separate matchers per context (each accepts string or function).
   */
  match?: MatchRule;
  /**
   * The handler callback executed when the directive is applied.
   * @param element The DOM element the directive is attached to.
   * @param data The payload containing `key` (arguments) and `value` (assigned value).
   * @param modify A utility to recursively modify the element.
   */
  callback: (element: HTMLElement, data: { key: any; value: any }, modify: any) => void;
};

export interface RegistryEntry {
  type: string;
  predicate: {
    attrName: (key: string) => [string, string] | null;
    objKey: (key: string) => [string, string] | null;
  };
  callback: (element: HTMLElement, data: { key: any; value: any }, modify: any) => void;
}

export const DirectivesRegistry = new Map<string, RegistryEntry>();

// ============= NORMALIZATION =============

const toPredicate = (
  type: string,
  rule?: string | PredicateFn
): ((key: string) => [string, string] | null) => {
  if (typeof rule === "string") {
    return (key: string) => (key === rule ? [type, key] : null);
  }

  if (rule) {
    return (key: string) => {
      const result = rule(key);
      if (!result) return null;
      if (isArray(result)) return result as [string, string];
      return [type, result];
    };
  }

  return (key: string) => (key === type ? [type, key] : null);
};

const normalizeMatch = (
  type: string,
  match?: MatchRule
): {
  attrName: (key: string) => [string, string] | null;
  objKey: (key: string) => [string, string] | null;
} => {
  if (match === undefined) {
    const pred = toPredicate(type);
    return { attrName: pred, objKey: pred };
  }

  if (typeof match === "string" || isFunction(match)) {
    const pred = toPredicate(type, match);
    return { attrName: pred, objKey: pred };
  }

  return {
    attrName: toPredicate(type, match.attrName),
    objKey: toPredicate(type, match.objKey),
  };
};

const toEntry = (dir: Directive): RegistryEntry => {
  const predicate = normalizeMatch(dir.type, dir.match);
  return { type: dir.type, predicate, callback: dir.callback };
};

// ============= PUBLIC API =============

/**
 * Registers one or more custom directives to extend Croft.
 * @param directives The custom directive configurations to register.
 */
export const addDirective = (...directives: Directive[]) => {
  directives.forEach((dir) => {
    DirectivesRegistry.set(dir.name || dir.type, toEntry(dir));
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
  toEntry({
    type: "attr",
    match: () => false,
    callback: (element, data) => {
      element.setAttribute(data.key, data.value);
    },
  }),
  toEntry({
    type: "text",
    match: { attrName: ":text", objKey: "textContent" },
    callback: (element, data) => {
      element.textContent = data.value;
    },
  }),
  toEntry({
    type: "html",
    match: { attrName: ":html", objKey: (key) => (key === "innerHTML" || key === "html") && key },
    callback: (element, data) => {
      element.innerHTML = unescapeHTML(data.value);
    },
  }),
  toEntry({
    type: "class:name",
    match: (key) => key.startsWith("class:") && key.replace("class:", ""),
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
  }),
  toEntry({
    type: "class",
    match: { attrName: (key) => (key === "class" || key === ":_class") && key, objKey: "class" },
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
  }),
  toEntry({
    type: "style:prop",
    match: (key) => key.startsWith("style:") && key.replace("style:", ""),
    callback: (element, data) => {
      const key = data.key.replace(/([A-Z])/g, "-$1").toLowerCase();
      element.style.setProperty(key, data.value);
    },
  }),
  toEntry({
    type: "style",
    match: "style",
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
  }),
  toEntry({
    type: "lifecycle",
    match: (key) => {
      const k = key.toLowerCase().trim();
      const name = k.replace("on", "");
      return k.startsWith("on") && LIFECYCLE_METHODS.includes(name) && name;
    },
    callback: (element, data) => {
      const fns = [data.value].flat();
      const key = data.key === "load" ? "mount" : data.key;
      const once = data.key === "create" || data.key === "load";

      for (const fn of fns) {
        element.addEventListener(`@${key}`, fn, { once });
      }
    },
  }),
  toEntry({
    type: "listener",
    match: (key) => {
      const lower = key.toLowerCase();
      return lower.startsWith("on") && key !== "on" && key.replace("on", "").toLowerCase();
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
          fn.call(element, e);
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
  }),
  toEntry({
    type: "on",
    match: "on",
    callback: (element, data, modify) => {
      if (!isPlainObject(data.value) || !Object.values(data.value).flat().every(isFunction)) {
        throw new TypeError("Event listener only accepts function | function[]");
      }

      for (const [evt, fns] of Object.entries(data.value)) {
        const evtType = LIFECYCLE_METHODS.includes(evt) ? "lifecycle" : "listener";
        modify(element, evtType, { key: evt, value: fns });
      }
    },
  }),
  toEntry({
    type: "toggle",
    match: (key) => {
      const [k] = key.split(".");
      return BOOLEAN_ATTRS.includes(k) || k.startsWith("toggle:")
        ? key.replace("toggle:", "")
        : false;
    },
    callback: (element, data) => {
      const [arg, option] = data.key.split(".");
      const attrs = arg.replace(WRAPPING_BRACKETS, "").split(",");

      for (const name of attrs) {
        const active = isTruthy(data.value) || (data.value === "" && BOOLEAN_ATTRS.includes(name));

        if (active) {
          let value = "";
          if (option === "mirror") value = name;
          else if (option === "preserve") value = data.value;

          if (name === "checked" && "checked" in element) {
            (element as HTMLInputElement).checked = true;
          } else if (name === "indeterminate" && "indeterminate" in element) {
            (element as HTMLInputElement).indeterminate = true;
          } else {
            element.setAttribute(name, value);
          }
        } else {
          if (name === "checked" && "checked" in element) {
            (element as HTMLInputElement).checked = false;
          } else if (name === "indeterminate" && "indeterminate" in element) {
            (element as HTMLInputElement).indeterminate = false;
          } else {
            element.removeAttribute(name);
          }
        }
      }
    },
  }),
  toEntry({
    type: "children",
    match: { attrName: ":children", objKey: "children" },
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
  }),
  toEntry({
    type: "key",
    match: { attrName: ":key", objKey: "_key" },
    callback: (element, data) => {
      const key = data.value.startsWith("$")
        ? element.getAttribute(data.value.replace("$", ""))
        : data.value;
      setMetadata(element, "key", key);
    },
  }),
  toEntry({
    type: "skip",
    match: { attrName: ":skip", objKey: "_skip" },
    callback: (element, _data) => {
      setMetadata(element, "skip", true);
    },
  }),
  toEntry({
    type: "ref",
    match: { attrName: ":ref", objKey: "_ref" },
    callback: (element, data) => {
      const [key, o] = isArray(data.value) ? data.value : ["current", data.value];

      if (!isPlainObject(o)) {
        throw new TypeError("Ref only accepts plain object");
      }

      o[key] = element;
    },
  }),
  toEntry({
    type: "show",
    match: { attrName: ":show", objKey: "_show" },
    callback: (element, data) => {
      let display = (element as any).__meta?.og_display;

      if (!display) {
        display = window.getComputedStyle(element).display;
        setMetadata(element, "og_display", display);
      }

      if (isTruthy(data.value)) element.style.display = display === "none" ? "" : display;
      else element.style.display = "none";
    },
  }),
  toEntry({
    type: "visible",
    match: { attrName: ":visible", objKey: "_visible" },
    callback: (element, data) => {
      if (isTruthy(data.value)) element.style.visibility = "visible";
      else element.style.visibility = "hidden";
    },
  }),
  toEntry({
    type: "value",
    match: { attrName: ":value", objKey: "value" },
    callback: (element, data) => {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = String(data.value ?? "");
      }
    },
  }),
  toEntry({
    type: "model",
    match: { attrName: ":model", objKey: "model" },
    callback: (element, data, modifyElement) => {
      modifyElement(element, "value", { key: "value", value: data.value });
    },
  }),
];

// ============= RESOLUTION =============

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

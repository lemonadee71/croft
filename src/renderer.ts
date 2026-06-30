import {
  PLACEHOLDER_REGEX,
  WRAPPING_QUOTES,
  Template,
  isNullOrUndefined,
  isObject,
  isFunction,
  isString,
  isNumber,
  isArray,
  isFragment,
  isTemplate,
  isPlaceholder,
  isHook,
  setMetadata,
  addKeyRecursive,
  uid,
  escapeHTML,
  compose,
  resolve,
  isPlainObject,
  getChildNodes,
  getChildren,
  traverse,
  getPlaceholderId,
  getPlaceholders,
  createMarkers,
  isElement,
  isSVG,
} from "./utils";

import { watch } from "./hooks";
import { BuiltinDirectives, DirectivesRegistry, getTypeOfAttrName, getTypeOfKey } from "./directives";
import {
  runLifecycle,
  triggerLifecycle,
} from "./lifecycle";
import { resolveComponents } from "./components";

/**
 * Tagged template literal to create a Template from JSX-like HTML string.
 * @param fragments The string fragments of the template.
 * @param values The interpolated values (functions, hooks, nested templates, etc.).
 */
export const html = (fragments: TemplateStringsArray, ...values: any[]): Template => {
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

  let templateString = replacedValues
    .reduce((full, str, i) => `${full}${str}${fragments[i + 1]}`, fragments[0])
    .trim();

  // Avoid duplicate class attributes: transform class=PLACEHOLDER to :_class=PLACEHOLDER
  templateString = templateString.replace(/\bclass=(__\w+__)/g, ":_class=$1");

  return new Template(templateString, mappedValues);
};

/**
 * Compiles a Template and attaches it to a target DOM node or selector.
 * @param template The peasant-jsx Template object to compile.
 * @param target Optional selector string or HTMLElement to append the rendered template to.
 */
export const render = (template: Template, target?: string | HTMLElement): any => {
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

/**
 * Creates a DocumentFragment from a template object, executing pre/post-creation hooks.
 * @param template The template object.
 */
export const createElementFromTemplate = (template: Template): DocumentFragment => {
  const str = runLifecycle("beforeCreate", template.template);
  const fragment = document.createRange().createContextualFragment(str);

  runLifecycle("afterCreate", fragment, template.values);
  processDirectives(fragment, template.values);

  for (const child of getChildren(fragment)) {
    triggerLifecycle("create", child);
  }

  return fragment;
};

/**
 * Traverses a root element and processes placeholders/directives using values context.
 * @param root The root element or document fragment.
 * @param context The values dictionary.
 */
export const processDirectives = (root: HTMLElement | DocumentFragment, context: Record<string, any>) => {
  const fns = [resolveBody, resolveComponents, runLifecycle.bind(null, "beforeHydrate"), resolveAttributes, runLifecycle.bind(null, "afterHydrate")];

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

const addTransform = (hook: any, callback: Function) => {
  const previousTransform = hook.data.transform;
  hook.data.transform = compose((value: any) => resolve(value, previousTransform), callback);
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

const bindHook = (
  value: any,
  options: { element: HTMLElement; type: string; target: any }
): any => {
  if (!isHook(value)) return value;

  const hook = value;

  if (["listener", "lifecycle"].includes(options.type)) {
    throw new Error("You can't dynamically set lifecycle methods or event listeners");
  }

  const updateDOM = (newValue: any) => {
    const resolvedValue = resolve(newValue, hook.data.transform);
    modifyElement(options.element, options.type, {
      key: options.target,
      value: resolvedValue,
    });
  };

  const unsubscribe = watch(hook, updateDOM);

  options.element.addEventListener("@destroy", () => unsubscribe());

  return resolve(hook.data.value, hook.data.transform);
};

const resolveValue = (value: any, options: { element: HTMLElement; type: string; target: any }) => {
  let final = value;

  if (options.type === "children") {
    final = isHook(final)
      ? addTransform(
          final,
          compose(normalizeChildren, (items: Node[]) =>
            items.map((item) => setMetadata(item, "ignore", true))
          )
        )
      : normalizeChildren(final);
  }

  return bindHook(final, options);
};

/**
 * Programmatically applies an object of properties/directives to an element.
 * @param element The target element.
 * @param changes Key-value dictionary of properties/directives to apply.
 */
export const applyProps = (element: HTMLElement, changes: Record<string, any>): HTMLElement => {
  for (const [rawKey, value] of Object.entries(changes)) {
    const [type, key] = getTypeOfKey(rawKey);

    modifyElement(element, type, {
      key,
      value: resolveValue(value, { element, type, target: key }),
    });
  }

  return element;
};

/**
 * Updates a DOM element attribute or state based on directive type.
 * @param target The target HTMLElement or query selector string.
 * @param type The directive type.
 * @param data Payload containing argument key and value.
 * @param context Optional context node for query selection.
 */
export const modifyElement = (
  target: any,
  type: string,
  data: { key: any; value: any },
  context: Document | HTMLElement | DocumentFragment = document
): HTMLElement => {
  const element =
    isElement(target) || isSVG(target) ? target : (context as any).querySelector(target);

  if (!element) return target;

  const builtin = BuiltinDirectives.find((dir) => dir.type === type);
  if (builtin) {
    builtin.callback(element, data, modifyElement);
    return element;
  }

  const custom = DirectivesRegistry.get(type);
  if (custom) {
    custom.callback(element, data, modifyElement);
    return element;
  }

  return element;
};

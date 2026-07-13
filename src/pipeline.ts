import {
  PLACEHOLDER_REGEX,
  WRAPPING_QUOTES,
  Template,
  isNullOrUndefined,
  isString,
  isNumber,
  isArray,
  isFragment,
  isTemplate,
  isPlaceholder,
  isHook,
  setMetadata,
  addKeyRecursive,
  compose,
  resolve,
  isPlainObject,
  getChildNodes,
  getChildren,
  traverse,
  getPlaceholderId,
  getPlaceholders,
  createMarkers,
} from "./utils";

import { watch } from "./hooks";
import {
  BuiltinDirectives,
  DirectivesRegistry,
  getTypeOfAttrName,
  getTypeOfKey,
} from "./directives";
import { runLifecycle, triggerLifecycle } from "./lifecycle";

// ============= RESOLVE BODY =============

const hasSkipAncestor = (element: HTMLElement | null): boolean => {
  let current: any = element;
  while (current) {
    if (current.__meta?.skip) return true;
    current = current.parentElement;
  }
  return false;
};

const resolveBody = (root: HTMLElement | DocumentFragment, values: Record<string, any>) => {
  for (const node of getPlaceholders(root)) {
    const parent = node.parentElement as HTMLElement;
    if (!parent || hasSkipAncestor(parent)) continue;

    const text = (node.textContent || "").trim();
    const value = values[getPlaceholderId(text)];
    const options = {
      element: parent,
      type: "children" as const,
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

// ============= RESOLVE ATTRIBUTES =============

const resolveAttributes = (root: HTMLElement | DocumentFragment, values: Record<string, any>) => {
  for (const child of getChildren(root)) {
    traverse(child, (element: any) => {
      if (element.__meta?.hydrated) return;

      // If this element has skip, don't process it or any descendants
      if (element.__meta?.skip) return false;

      for (const attr of Array.from(element.attributes) as Attr[]) {
        const rawName = attr.name;
        const rawValue = attr.value.trim();

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
        } else {
          const [type, attrName] = getTypeOfAttrName(rawName);
          const match = rawValue.match(PLACEHOLDER_REGEX);
          const value = match ? values[getPlaceholderId(match[0])] : rawValue;

          if (type !== "attr") {
            element.removeAttribute(rawName);

            const options: any = { element, type, target: attrName };

            if (type === "children" && match && isHook(value)) {
              const [head, tail, marker] = createMarkers();
              element.prepend(head);
              element.append(tail);
              options.target = marker;
            }

            modifyElement(element, type, {
              key: options.target,
              value: resolveValue(value, options),
            });
          }
        }
      }

      setMetadata(element, "hydrated", true);
    });
  }
};

// ============= HOOK HELPERS =============

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

// ============= PUBLIC PIPELINE API =============

/**
 * Creates a DocumentFragment from a template object, executing pre/post-creation hooks.
 * Component resolution is handled separately by the caller.
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
 * Pre-processes :skip directives so the metadata is available during body resolution and
 * attribute processing.
 */
const preprocessSkip = (root: HTMLElement | DocumentFragment, context: Record<string, any>) => {
  for (const child of getChildren(root)) {
    traverse(child, (element: any) => {
      if (element.getAttribute(":skip") !== null) {
        setMetadata(element, "skip", true);
        element.removeAttribute(":skip");
        return false;
      }

      for (const attr of Array.from(element.attributes) as Attr[]) {
        if (!isPlaceholder(attr.name)) continue;
        const value = context[getPlaceholderId(attr.name)];
        if (isPlainObject(value) && value._skip) {
          setMetadata(element, "skip", true);
          return false;
        }
      }
    });
  }
};

/**
 * Traverses a root element and processes placeholders/directives using values context.
 * Component resolution is handled separately by the caller.
 */
export const processDirectives = (
  root: HTMLElement | DocumentFragment,
  context: Record<string, any>
) => {
  const fns: Array<(root: HTMLElement | DocumentFragment, context: Record<string, any>) => void> = [
    preprocessSkip,
    resolveBody,
  ];

  fns.push(
    (r, c) => runLifecycle("beforeHydrate", r, c),
    resolveAttributes,
    (r, c) => runLifecycle("afterHydrate", r, c)
  );

  for (const fn of fns) fn(root, context);
};

/**
 * Programmatically applies an object of properties/directives to an element.
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
 */
export const modifyElement = (
  target: Element | string,
  type: string,
  data: { key: any; value: any },
  context: Document | HTMLElement | DocumentFragment = document
): Element | null => {
  const element: Element | null =
    target instanceof Element ? target : ((context as any).querySelector(target) ?? null);

  if (!element) return null;

  const builtin = BuiltinDirectives.find((dir) => dir.type === type);
  if (builtin) {
    builtin.callback(element as HTMLElement, data, modifyElement);
    return element;
  }

  const custom = DirectivesRegistry.get(type);
  if (custom) {
    custom.callback(element as HTMLElement, data, modifyElement);
    return element;
  }

  return element;
};

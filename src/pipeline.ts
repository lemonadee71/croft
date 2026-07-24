import {
  Template,
  isHook,
  isString,
  isNumber,
  isTemplate,
  isFragment,
  isNullOrUndefined,
  setMetadata,
  addKeyRecursive,
  getChildNodes,
  getChildren,
  compose,
  resolve,
  HOOK_DATA,
} from "./utils";

import { watch } from "./hooks";
import { BuiltinDirectives, DirectivesRegistry, getTypeOfKey } from "./directives";
import { runLifecycle, triggerLifecycle } from "./lifecycle";
import { resolveBody } from "./resolve-body";
import { preprocessSkip, resolveAttributes } from "./resolve-attributes";

// ============= CHILDREN NORMALIZATION =============

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

// ============= HOOK HELPERS =============

const addTransform = (hook: any, callback: Function) => {
  const previousTransform = hook[HOOK_DATA].transform;
  hook[HOOK_DATA].transform = compose((value: any) => resolve(value, previousTransform), callback);
  return hook;
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
    const resolvedValue = resolve(newValue, hook[HOOK_DATA].transform);
    modifyElement(options.element, options.type, {
      key: options.target,
      value: resolvedValue,
    });
  };

  const unsubscribe = watch(hook, updateDOM);

  options.element.addEventListener("@destroy", () => unsubscribe());

  return resolve(hook[HOOK_DATA].value, hook[HOOK_DATA].transform);
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

export const processDirectives = (
  root: HTMLElement | DocumentFragment,
  context: Record<string, any>
) => {
  const fns: Array<(root: HTMLElement | DocumentFragment, context: Record<string, any>) => void> = [
    preprocessSkip,
    (r, c) => resolveBody(r, c, resolveValue),
  ];

  fns.push(
    (r, c) => runLifecycle("beforeHydrate", r, c),
    (r, c) => resolveAttributes(r, c, { resolveValue, applyProps, modifyElement }),
    (r, c) => runLifecycle("afterHydrate", r, c)
  );

  for (const fn of fns) fn(root, context);
};

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

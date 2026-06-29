import { createHook } from "./hooks";

export const HOOK_TARGET = Symbol.for("peasant_hook_target");

export const PLACEHOLDER_REGEX = /__\S+__/;
export const WRAPPING_BRACKETS = /^\[|\]$/g;
export const WRAPPING_QUOTES = /^['"]|['"]$/g;
export const LIFECYCLE_METHODS = ["create", "destroy", "mount", "unmount", "load"];
export const BOOLEAN_ATTRS = [
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
  "truespeed",
];

// Template class
export class Template {
  template: string;
  values: Record<string, any>;

  constructor(template: string, values: Record<string, any>) {
    this.template = template;
    this.values = values;
  }
}

// Type Predicates
export const isNullOrUndefined = (value: any): value is null | undefined =>
  value === null || value === undefined;

export const isObject = (value: any): value is object =>
  typeof value === 'object' && value !== null;

export const isFunction = (value: any): value is Function =>
  typeof value === 'function';

export const isString = (value: any): value is string =>
  typeof value === 'string';

export const isArray = (value: any): value is any[] =>
  Array.isArray(value);

export const isPlainObject = (value: any): value is Record<string, any> => {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
};

export const isNumber = (value: any): value is number =>
  typeof value === 'number' && !Number.isNaN(value);

export const isNode = (value: any): value is Node => value instanceof Node;

export const isTextNode = (value: any): value is Text => value instanceof Text;

export const isElement = (value: any): value is HTMLElement => value instanceof HTMLElement;

export const isSVG = (value: any): value is SVGElement => value instanceof SVGElement;

export const isFragment = (value: any): value is DocumentFragment =>
  value instanceof DocumentFragment;

export const isTemplate = (value: any): value is Template => value instanceof Template;

export const isPlaceholder = (str: string): boolean => PLACEHOLDER_REGEX.test(str);

export const isTruthy = (value: any): boolean =>
  !!value && !["0", "false", "null", "undefined", "NaN"].includes(String(value));

export const isHook = (value: any): boolean => {
  if (isObject(value) || isFunction(value)) {
    return !!(value as any)[HOOK_TARGET];
  }
  return false;
};

// Metadata helpers
export const setMetadata = (node: any, key: string, value: any): any => {
  if (!node.__meta) node.__meta = {};

  const keys = key.split(".");
  const path = keys.slice(0, keys.length - 1);
  const _key = keys[keys.length - 1];

  let prev = node.__meta;
  for (const k of path) {
    if (!prev[k]) prev[k] = {};
    prev = prev[k];
  }
  prev[_key] = value;

  return node;
};

export const getKey = (node: any): string | undefined => node.__meta?.key;

export const addKeyRecursive = (nodes: Node[]): void => {
  const idMap: Record<string, number> = {};

  for (const item of nodes) {
    const itemAny = item as any;
    if (!itemAny?.__meta?.key) {
      if (isTextNode(item)) {
        const id = hash(item.textContent || "");
        if (!idMap[id]) idMap[id] = 0;
        setMetadata(item, "key", `${id}_${++idMap[id]}`);
      } else if (isElement(item)) {
        const tag = item.tagName;
        if (!idMap[tag]) idMap[tag] = 0;
        setMetadata(item, "key", `${tag}_${++idMap[tag]}`);
      }
    }

    if (isElement(item)) {
      addKeyRecursive(Array.from(item.childNodes));
    }
  }
};

// Identity and General helpers
export const uid = (length = 8): string =>
  Math.random()
    .toString(36)
    .slice(2, 2 + length);

export const hash = (str: string): string => {
  let hashVal = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    hashVal = (hashVal << 5) - hashVal + str.charCodeAt(i);
    hashVal |= 0; // Convert to 32bit integer
  }
  return hashVal.toString(36);
};

export const escapeHTML = (unsafe: string): string =>
  unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const unescapeHTML = (safe: string): string =>
  safe
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

export const compose = (...fns: Function[]): Function => {
  if (fns.some((fn) => typeof fn !== "function")) {
    throw new Error("Argument must be a function");
  }

  return fns.reduce(
    (f, g) =>
      (...args: any[]) =>
        g(f(...args))
  );
};

export const resolve = (value: any, fn: Function | null = null): any => (fn ? fn(value) : value);



// DOM Helpers
export const inTheDocument = (node: Node): boolean => document.body.contains(node);

export const getChildNodes = (parent: Node): Node[] => Array.from(parent.childNodes);

export const getChildren = (parent: ParentNode): Element[] => Array.from(parent.children);

export const removeChildren = (parent: Node): void => {
  while (parent.firstChild) {
    parent.removeChild(parent.lastChild!);
  }
};

export const traverse = (
  element: Element,
  callback: (el: Element) => void,
  topDown = true
): void => {
  if (topDown) callback(element);

  if (element.childElementCount) {
    getChildren(element).forEach((child) => traverse(child, callback, topDown));
  }

  if (!topDown) callback(element);
};

export const cloneNode = <T extends Node>(node: T): T => {
  const clone = node.cloneNode(true) as T;
  (clone as any).__meta = { ...(node as any).__meta };
  return clone;
};

export const getPlaceholderId = (str: string): string => str.replaceAll("__", "");

export const getPlaceholders = (root: Node): Text[] => {
  // Collect all text nodes recursively — some DOM environments have issues with TreeWalker filter callbacks
  const collectTextNodes = (node: Node, result: Text[]): void => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (isPlaceholder(child.textContent || "")) {
          result.push(child as Text);
        }
      } else if (
        child.nodeType === Node.ELEMENT_NODE ||
        child.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ) {
        collectTextNodes(child, result);
      }
    }
  };

  const oldNodes: Text[] = [];
  collectTextNodes(root, oldNodes);

  const newNodes: Text[] = [];

  for (const node of oldNodes) {
    const text = node.textContent || "";
    const matches = text.match(new RegExp(PLACEHOLDER_REGEX, "g")) || [];
    const fragments = text.split(PLACEHOLDER_REGEX);
    const strings = matches
      .reduce((arr: any[], value, i) => [...arr, value, fragments[i + 1]], [fragments[0]])
      .map((str) => document.createTextNode(str));

    newNodes.push(...strings);
    node.replaceWith(...strings);
  }

  return newNodes.filter((node) => isPlaceholder(node.textContent || ""));
};

export const getBoundary = (id: string, nodes: Node[]): [number, number] => {
  const start = nodes.findIndex((n) => getKey(n) === `start_${id}`);
  const end = nodes.findIndex((n) => getKey(n) === `end_${id}`);

  return [start + 1, end];
};

export const createMarkers = (): [Comment, Comment, string] => {
  const id = uid();

  const head = document.createComment("{peasant-jsx-start}");
  const tail = document.createComment("{peasant-jsx-end}");
  setMetadata(head, "key", `start_${id}`);
  setMetadata(tail, "key", `end_${id}`);

  return [head, tail, id];
};

export { createHook };

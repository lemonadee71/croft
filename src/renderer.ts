import {
  Template,
  isNullOrUndefined,
  isObject,
  isFunction,
  isString,
  uid,
  escapeHTML,
} from "./utils";

import { resolveComponents } from "./components";
import { createElementFromTemplate } from "./pipeline";

/**
 * Tagged template literal to create a Template from JSX-like HTML string.
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
 * Compiles a Template into a DocumentFragment.
 */
export const render = (template: Template): DocumentFragment => {
  const fragment = createElementFromTemplate(template);
  resolveComponents(fragment, template.values);
  return fragment;
};

/**
 * Mounts a DocumentFragment into a target DOM node or selector.
 */
export const mount = (fragment: DocumentFragment, target: string | HTMLElement): void => {
  const parent = isString(target) ? document.querySelector(target) : target;
  if (!parent || !(parent instanceof HTMLElement)) {
    throw new Error("Target is not a valid HTMLElement");
  }
  parent.append(fragment);
};

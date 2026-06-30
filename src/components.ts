import { PLACEHOLDER_REGEX, getChildren, traverse, getPlaceholderId, isHook } from "./utils";
import { createElementFromTemplate, processDirectives } from "./renderer";

export const ComponentsRegistry = new Map<string, Function>();

export const defineComponent = (name: string, renderFn: Function) => {
  ComponentsRegistry.set(name, renderFn);
};

export const removeComponent = (name: string) => {
  ComponentsRegistry.delete(name);
};

/**
 * Resolves props values — hooks are resolved to their current static value.
 */
const resolvePropValue = (value: any): any => {
  if (isHook(value)) return (value as any).data?.value;
  return value;
};

/**
 * Phase 2 of the rendering pipeline.
 * Walks the DOM bottom-up, finds registered custom element tags,
 * renders their component template, and replaces the element in-place.
 *
 * The replaced content goes through `createElementFromTemplate` →
 * `processDirectives`, so all directives, nested components, and hooks
 * are fully handled on the component's own subtree.
 */
export const resolveComponents = (root: HTMLElement | DocumentFragment, context: Record<string, any>) => {
  if (ComponentsRegistry.size === 0) return;

  const customElements: Element[] = [];

  for (const child of getChildren(root)) {
    traverse(child, (el) => {
      if (ComponentsRegistry.has(el.tagName.toLowerCase())) {
        customElements.push(el);
      }
    }, false);
  }

  for (const el of customElements) {
    if (!el.parentNode) continue;

    const tagName = el.tagName.toLowerCase();
    const renderFn = ComponentsRegistry.get(tagName)!;

    const props: Record<string, any> = {};
    for (const attr of Array.from(el.attributes)) {
      const rawValue = attr.value.trim();
      const match = rawValue.match(PLACEHOLDER_REGEX);
      props[attr.name] = match ? resolvePropValue(context[getPlaceholderId(match[0])]) : rawValue;
    }

    const children = Array.from(el.childNodes);

    let processedChildren = children;
    if (children.length > 0) {
      const childFragment = document.createDocumentFragment();
      childFragment.append(...children);
      processDirectives(childFragment, context);
      processedChildren = Array.from(childFragment.childNodes);
    }

    const template = renderFn(props, processedChildren);
    const fragment = createElementFromTemplate(template);

    el.parentNode.replaceChild(fragment, el);
  }
};

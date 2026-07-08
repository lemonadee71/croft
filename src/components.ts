import { PLACEHOLDER_REGEX, getChildren, traverse, getPlaceholderId, isHook } from "./utils";
import { createElementFromTemplate, processDirectives } from "./pipeline";
import type { Template } from "./utils";

export type ComponentRenderer<P extends Record<string, any> = Record<string, any>> = (
  props: P,
  slots: Record<string, Node[]>
) => Template;

export const ComponentsRegistry = new Map<string, ComponentRenderer>();

export const defineComponent = <P extends Record<string, any> = Record<string, any>>(
  name: string,
  renderFn: ComponentRenderer<P>
) => {
  ComponentsRegistry.set(name, renderFn as ComponentRenderer);
};

export const removeComponent = (name: string) => {
  ComponentsRegistry.delete(name);
};

const resolvePropValue = (value: any): any => {
  if (isHook(value)) return (value as { data?: { value?: any } }).data?.value;
  return value;
};

const extractSlots = (children: Node[]): Record<string, Node[]> => {
  const slots: Record<string, Node[]> = {};
  for (const child of children) {
    if (child instanceof Element) {
      const slotAttr = child.getAttribute("slot");
      if (slotAttr) {
        child.removeAttribute("slot");
        if (!slots[slotAttr]) slots[slotAttr] = [];
        slots[slotAttr].push(child);
        continue;
      }
    } else if (child instanceof Text && !child.textContent?.trim()) {
      continue;
    }
    if (!slots.default) slots.default = [];
    slots.default.push(child);
  }
  return slots;
};

const resolveSlots = (fragment: DocumentFragment, slots: Record<string, Node[]>) => {
  for (const child of getChildren(fragment)) {
    traverse(
      child,
      (el) => {
        if (el.tagName?.toLowerCase() === "slot") {
          const name = el.getAttribute("name") || "default";
          const matchingChildren = slots[name];
          if (matchingChildren && matchingChildren.length > 0) {
            el.replaceWith(...matchingChildren);
          } else {
            const fallback = Array.from(el.childNodes);
            if (fallback.length > 0) {
              el.replaceWith(...fallback);
            } else {
              el.remove();
            }
          }
        }
      },
      true
    );
  }
};

export const resolveComponents = (
  root: HTMLElement | DocumentFragment,
  context: Record<string, any>
) => {
  if (ComponentsRegistry.size === 0) return;

  const customElements: Element[] = [];

  for (const child of getChildren(root)) {
    traverse(
      child,
      (el) => {
        if (ComponentsRegistry.has(el.tagName.toLowerCase())) {
          customElements.push(el);
        }
      },
      true
    );
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
    const slots = extractSlots(children);

    for (const key of Object.keys(slots)) {
      const slotChildren = slots[key];
      if (slotChildren.length > 0) {
        const childFragment = document.createDocumentFragment();
        childFragment.append(...slotChildren);
        processDirectives(childFragment, context);
        resolveComponents(childFragment, context);
        slots[key] = Array.from(childFragment.childNodes);
      }
    }

    const template = renderFn(props, slots);
    const fragment = createElementFromTemplate(template);

    resolveComponents(fragment, context);
    resolveSlots(fragment, slots);

    el.parentNode.replaceChild(fragment, el);
  }

  warnUnregistered(root);
};

/** Warns about unregistered custom elements remaining in the DOM after resolution. */
export const warnUnregistered = (root: HTMLElement | DocumentFragment) => {
  for (const child of getChildren(root)) {
    traverse(
      child,
      (el) => {
        const tagName = el.tagName.toLowerCase();
        if (tagName.includes("-") && !ComponentsRegistry.has(tagName)) {
          console.warn(
            `[peasant-jsx] Unregistered custom element: <${tagName}>. ` +
              `Did you forget to call defineComponent("${tagName}", ...)?`
          );
        }
      },
      true
    );
  }
};

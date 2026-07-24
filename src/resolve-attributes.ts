import {
  PLACEHOLDER_REGEX,
  WRAPPING_QUOTES,
  isPlainObject,
  isString,
  isArray,
  isPlaceholder,
  isHook,
  setMetadata,
  getChildren,
  getPlaceholderId,
  traverse,
  createMarkers,
  HOOK_TARGET,
  HOOK_DATA,
} from "./utils";

import { getTypeOfAttrName } from "./directives";
import { getProxy } from "./hooks";

export const preprocessSkip = (
  root: HTMLElement | DocumentFragment,
  context: Record<string, any>
) => {
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

export const resolveAttributes = (
  root: HTMLElement | DocumentFragment,
  values: Record<string, any>,
  deps: {
    resolveValue: (value: any, options: { element: HTMLElement; type: string; target: any }) => any;
    applyProps: (element: HTMLElement, changes: Record<string, any>) => HTMLElement;
    modifyElement: (
      target: Element | string,
      type: string,
      data: { key: any; value: any },
      context?: Document | HTMLElement | DocumentFragment
    ) => Element | null;
  }
) => {
  const { resolveValue, applyProps, modifyElement } = deps;

  for (const child of getChildren(root)) {
    traverse(child, (element: any) => {
      if (element.__meta?.hydrated) return;

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

            if (type === "model" && match && isHook(value)) {
              element.removeAttribute(rawName);
              const proxy = getProxy(value[HOOK_TARGET]);
              if (proxy) {
                const prop = value[HOOK_DATA].prop;
                applyProps(element, {
                  value,
                  onInput: () => {
                    proxy[prop] = (element as HTMLInputElement).value;
                  },
                });
              }
              continue;
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

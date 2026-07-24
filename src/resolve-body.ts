import { getPlaceholders, getPlaceholderId, createMarkers, isHook } from "./utils";

import { hasSkipAncestor } from "./normalize";

export const resolveBody = (
  root: HTMLElement | DocumentFragment,
  values: Record<string, any>,
  resolveValue: (value: any, options: { element: HTMLElement; type: string; target: any }) => any
) => {
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

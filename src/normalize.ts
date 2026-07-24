/**
 * Walks up the ancestor chain checking for a `:skip` directive ancestor.
 */
export const hasSkipAncestor = (element: HTMLElement | null): boolean => {
  let current: any = element;
  while (current) {
    if (current.__meta?.skip) return true;
    current = current.parentElement;
  }
  return false;
};

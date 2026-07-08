# children

Replaces an element's child nodes with new content.

## Syntax

```typescript
html`<div :children=${nodes}></div>`

// Property object
applyProps(element, { children: nodeArray });
```

## Example

```typescript
const newChildren = [
  document.createTextNode("Hello"),
  document.createElement("span"),
];

html`<div :children=${newChildren}></div>`;
```

This removes all existing children and appends the new ones in a single operation. Focus is preserved — if the previously active element was a child, focus is restored to its matching replacement.

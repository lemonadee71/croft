# skip

Skips directive processing on an element and its subtree.

## Syntax

```typescript
html`<div :skip></div>`
html`<div :skip=${"all"}></div>`

// Skip only attribute resolution
html`<div :skip=${"attr"}></div>`

// Property object
applyProps(element, { _skip: true });
```

## Options

| Value | Effect |
|---|---|
| (no value) | Skips all processing on subtree |
| `"all"` | Skips all processing on subtree |
| `"attr"` | Skips only attribute/directive resolution |

Useful for integrating with third-party libraries that manage their own DOM subtrees, preventing Croft from interfering with their elements.

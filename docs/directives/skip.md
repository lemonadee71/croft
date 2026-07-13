# skip

Skips all Croft processing (body resolution, directives, reactivity) on an element and its entire subtree. Useful for integrating with third-party libraries that manage their own DOM subtrees.

## Syntax

```typescript
html`<div :skip></div>`

// Property object
applyProps(element, { _skip: true });
```

The presence of the attribute alone is enough — no value needed.

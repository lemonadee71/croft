# key

Sets a tracking key on an element for identification during reconciliation.

## Syntax

```typescript
html`<div :key=${keyValue}></div>`

// Property object
applyProps(element, { _key: "my-key" });
```

## Example

```typescript
html`
  <li :key=${item.id}>${item.title}</li>
`;
```

Keys are used internally for tracking elements across updates. Unlike some frameworks, Croft does not require keys for list rendering — they are available for advanced use cases like custom reconciliation in plugins.

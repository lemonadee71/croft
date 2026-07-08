# Props

Components receive attributes as a typed props object.

## Static Props

```typescript
defineComponent("my-card", (props: { title: string, variant: string }) => {
  return html`
    <div class="card card-${props.variant}">
      <h2>${props.title}</h2>
    </div>
  `;
});

// Usage:
html`<my-card title="Hello" variant="primary"></my-card>`;
```

## Dynamic Props

Props can receive reactive values, but the component renders once with the current value:

```typescript
const state = createHook({ name: "Croft" });

html`<my-greeting name=${state.$name}></my-greeting>`;

// To update, the parent template must re-render
// or the component itself should watch reactive sources
```

## Prop Types

All prop values are strings when passed as HTML attributes:

```typescript
// All props are strings at the attribute level
html`<my-counter count="5"></my-counter>`;
// props.count === "5"

// For numbers, use expressions:
html`<my-counter count=${5}></my-counter>`;
// props.count === "5" (still string from attribute)
```

## Boolean-like Props

For boolean behavior, check the string value:

```typescript
defineComponent("my-toggle", (props: { active: string }) => {
  const isActive = props.active === "true" || props.active === "";
  return html`<div class:active=${isActive}>...</div>`;
});
```

Or use expression interpolation to pass actual booleans in computed values.

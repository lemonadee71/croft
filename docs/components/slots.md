# Slots

Components receive child content through the `slots` parameter.

## Default Slot

Children without a `slot` attribute go into `slots.default`:

```typescript
defineComponent("my-card", (_props, slots) => html`
  <div class="card">
    ${slots.default?.length ? slots.default : html`<p>No content</p>`}
  </div>
`);

html`
  <my-card>
    <h2>Title</h2>
    <p>Body content</p>
  </my-card>
`;
```

## Named Slots

Children with `slot="name"` go into `slots.name`:

```typescript
defineComponent("my-layout", (_props, slots) => html`
  <div class="layout">
    <header><slot name="header"></slot></header>
    <main><slot></slot></main>
    <footer><slot name="footer"></slot></footer>
  </div>
`);

html`
  <my-layout>
    <h1 slot="header">Page Title</h1>
    <p>Main content</p>
    <small slot="footer">Footer note</small>
  </my-layout>
`;
```

The `slot` attribute is automatically removed from rendered output.

## Slot Elements

Use `<slot>` elements in component templates to declare insertion points. Content inside a `<slot>` element serves as fallback:

```typescript
defineComponent("my-card", (_props, slots) => html`
  <div class="card">
    <slot name="header"><h1>Default Title</h1></slot>
    <slot><p>Default body</p></slot>
  </div>
`);

// With no children:
html`<my-card></my-card>`;
// → <div class="card"><h1>Default Title</h1><p>Default body</p></div>

// With matching children:
html`
  <my-card>
    <h2 slot="header">Custom Title</h2>
    <span>Custom body</span>
  </my-card>
`;
// → <div class="card"><h2>Custom Title</h2><span>Custom body</span></div>
```

## Programmatic Access

The `slots` object is passed directly to the render function:

```typescript
defineComponent("my-counter", (_props, slots) => html`
  <span data-testid="count">
    ${slots.default ? slots.default.length : 0} children
  </span>
`);
```

## Whitespace Handling

Text nodes consisting only of whitespace are excluded from slots automatically. Only meaningful element and text nodes are included.

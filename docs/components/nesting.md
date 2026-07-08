# Nesting & Composition

Components can contain other components, enabling composition patterns.

## Nested Components

```typescript
defineComponent("my-avatar", (props: { src: string }) => {
  return html`<img class="avatar" src=${props.src} />`;
});

defineComponent("my-user-card", (props: { name: string, avatar: string }) => {
  return html`
    <div class="user-card">
      <my-avatar src=${props.avatar}></my-avatar>
      <h3>${props.name}</h3>
    </div>
  `;
});
```

## Component Trees

Components resolve top-down — parent components resolve first, then their child components. Each component's template goes through the full pipeline independently.

```typescript
defineComponent("my-app", () => html`
  <my-header></my-header>
  <my-content>
    <my-card title="Hello">
      <p>Body text</p>
    </my-card>
  </my-content>
  <my-footer></my-footer>
`);
```

## Slots with Components

Components in slots work naturally:

```typescript
defineComponent("my-list", (_props, slots) => html`
  <ul>
    ${slots.default?.map(child => html`<li>${child}</li>`)}
  </ul>
`);

defineComponent("my-app", () => html`
  <my-list>
    <my-item text="One"></my-item>
    <my-item text="Two"></my-item>
  </my-list>
`);
```

## Composition Patterns

### Layout Components

```typescript
defineComponent("my-page", (_props, slots) => html`
  <article>
    <header><slot name="header"></slot></header>
    <section><slot></slot></section>
    <footer><slot name="footer"></slot></footer>
  </article>
`);
```

### Wrapper Components

```typescript
defineComponent("my-loading", (props: { loading: string }) => {
  const isLoading = props.loading === "true";
  return isLoading
    ? html`<div class="spinner">Loading...</div>`
    : null;
});
```

For wrapper patterns, return `null` or an empty fragment to skip rendering.

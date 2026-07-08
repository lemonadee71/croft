# createHook

`createHook` creates a reactive state container backed by an ES6 Proxy. When you mutate a property on the returned object, any DOM nodes bound to that property automatically update.

## Signature

```typescript
function createHook<T extends Record<string, any>>(initial: T): Hook<T>
```

- **initial** — The initial state object.
- **Returns** — A proxied object where properties can be read/written directly. Properties read through the `$` prefix return reactive references.

## Basic Usage

```typescript
const state = createHook({ name: "World" });

// Read normally
console.log(state.name); // "World"

// Write normally — triggers updates
state.name = "Croft";
```

## Reactive References (`$`)

Properties accessed with a `$` prefix return a reactive reference — a special object that, when placed into a template, creates a live binding:

```typescript
const state = createHook({ name: "World" });

// Creates a reactive text node
html`<div>Hello, ${state.$name}!</div>`;

// When you update the value, the DOM updates automatically
state.name = "Croft"; // DOM updates to: Hello, Croft!
```

## TypeScript Support

`createHook` preserves your types:

```typescript
interface User {
  name: string;
  age: number;
  tags: string[];
}

const state = createHook<User>({ name: "Alice", age: 30, tags: ["dev"] });

// Fully typed
state.name; // string
state.$tags; // HookRef<string[]>
state.$age.toFixed(0); // method forwarding works
```

## Arrays

Arrays work naturally with reactive references:

```typescript
const state = createHook({ items: ["a", "b", "c"] });

// Use in templates
html`
  <ul>
    ${state.$items.map((item) => html`<li>${item}</li>`)}
  </ul>
`;

// Mutate — DOM updates
state.items = [...state.items, "d"];
```

::: tip Immutable Updates
Array methods like `.push()` mutate in-place and won't trigger reactivity. Always use immutable updates (`state.items = [...state.items, newItem]`) to ensure the proxy detects the change.
:::

## Nested Objects

Nested objects are also proxied:

```typescript
const state = createHook({
  user: { name: "Alice", settings: { theme: "dark" } },
});

// Reactive reference to nested property
html`<div>${state.$user.settings.$theme}</div>`;

state.user = { ...state.user, settings: { theme: "light" } };
```

However, for deeply nested reactivity, you may want to flatten your state or create separate hooks for different concerns.

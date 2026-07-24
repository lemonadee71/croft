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

The `$` proxy only applies to **top-level** properties. Nested objects are not deeply proxied — they're returned as raw values:

```typescript
const state = createHook({
  user: { name: "Alice", settings: { theme: "dark" } },
});

// ❌ Does NOT work — $theme on a raw nested object, not a HookRef
html`<div>${state.$user.settings.$theme}</div>`;

// ✅ Works — access top-level $ ref directly
html`<div>${state.$user}</div>`;

// To reactively update a nested value, replace the top-level property:
state.user = { ...state.user, settings: { theme: "light" } };
```

For deeply nested reactivity, flatten your state or create separate hooks:

```typescript
// Option A: flatten
const state = createHook({ userName: "Alice", theme: "dark" });
html`<div>${state.$theme}</div>`;

// Option B: separate hooks
const user = createHook({ name: "Alice" });
const prefs = createHook({ theme: "dark" });
html`<div>${prefs.$theme}</div>`;
```

## Traps / Transforms

A **trap** (or transform) is a callback you pass to a `$` reference to derive a new value. Unlike JavaScript operators (`===`, `>`, `.length`), traps create a reactive chain — they re-evaluate whenever the source value changes.

```typescript
const state = createHook({ todos: [], filter: "all" });

// ❌ Not reactive — evaluated immediately
state.$filter === "all"      // true/false at render time only
state.$todos.length          // function reference, breaks in templates

// ✅ Reactive — trap re-evaluates on every change
state.$filter((f) => f === "all")                                  // boolean
state.$todos((todos) => todos.filter(t => !t.completed))            // filtered array
state.$todos((todos) => todos.filter(t => !t.completed).length)     // count
```

### With plain state access

The trap callback receives a plain snapshot of all hook properties as the second argument:

```typescript
const state = createHook({ todos: [], filter: "all" });

// Derive filtered todos from both filter and todos
html`
  <ul>
    ${state.$filter((filter, snapshot) => {
      // snapshot is a plain object with ALL current hook values
      // snapshot.todos has the current todos array
      // NOTE: snapshot is NOT reactive — use it only for reading
      if (filter === "all") return snapshot.todos;
      return snapshot.todos.filter(t =>
        filter === "active" ? !t.completed : t.completed
      );
    }).map(todo => html`<li>${todo.title}</li>`)}
  </ul>
`;
```

### Method forwarding

Method forwarding is another form of transform. When you call a method on a `$` reference, it chains into the transform pipeline:

```typescript
state.$tags.reverse()                // reactive: value => value.reverse()
state.$tags.map(t => t.upperCase)    // reactive: value => value.map(...)
state.$value.trim().toUpperCase()    // reactive: value => value.trim().toUpperCase()
```

This works for any method that takes arguments. Property-only accesses like `.length` are not callable — use a trap instead.

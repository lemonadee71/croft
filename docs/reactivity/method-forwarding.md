# Method Forwarding

Reactive references support **method forwarding** — you can call methods on a `$` reference as if it were the actual value. This enables inline transformations in templates.

## String Methods

```typescript
const state = createHook({ title: "croft" });

// In a template:
html`<h1>${state.$title.toUpperCase()}</h1>`;
// Renders: <h1>CROFT</h1>
```

Available string methods include `.toUpperCase()`, `.toLowerCase()`, `.trim()`, `.slice()`, `.concat()`, `.replace()`, and more.

## Array Methods

```typescript
const state = createHook({ tags: ["a", "b", "c"] });

html`
  <ul>
    ${state.$tags.reverse().map((tag) => html`<li>${tag}</li>`)}
  </ul>
`;
```

Available array methods include `.map()`, `.filter()`, `.reverse()`, `.slice()`, `.concat()`, `.join()`, and more.

## Chaining

You can chain multiple method calls:

```typescript
html`
  <p>${state.$message.trim().toUpperCase().slice(0, 10)}</p>
`;
```

## How It Works

When you call a method on a `$` reference, it doesn't execute immediately. Instead, it records the method calls as a chain. When the template is rendered, the chain is evaluated against the current value. If the underlying value changes, the chain is re-evaluated and the DOM updates.

## Limitations

- Method forwarding works on **primitive values and arrays**. Object method forwarding has limited support.
- You cannot use `$` references inside the chained method calls (e.g., `state.$items.filter(item => item.includes(state.$query))` — `state.$query` would not react to changes).
- For complex computed values, derive them in your application code and store them as separate properties.

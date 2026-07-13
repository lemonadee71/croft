# model

Two-way data binding for form inputs. Composes the `:value` directive with an `input` event listener that writes back to the hook.

## Syntax

```typescript
html`<input :model=${state.$name} />`

// Property object (one-way initial value only)
applyProps(element, { model: "initial" });
```

## Behavior

- Delegates element value management to the [`:value`](value.md) directive
- Listens to `input` events and writes back to the hook

## Example

```typescript
const state = createHook({ name: "World" });

html`
  <input :model=${state.$name} />
  <p>Hello, ${state.$name}!</p>
`;

// User types in input → state.name updates → <p> re-renders
// state.name = "Alice" → input value updates
```

## Supported Elements

| Element | Property |
|---|---|
| `<input>` | `value` |
| `<textarea>` | `value` |

Only `<input>` and `<textarea>` elements are supported. Other element types are silently ignored.

## Reactivity

When a hook is used with `:model`, two-way binding is set up:

1. **Hook → Element**: Changes to the hook update the element's value (via `:value`'s watcher).
2. **Element → Hook**: The `input` event updates the hook value (via the proxy setter, which notifies watchers).

## vs Manual Binding

```typescript
// :model — two lines, fully reactive
const state = createHook({ search: "" });
html`<input :model=${state.$search} />`;

// Manual equivalent — :value + onInput
const state = createHook({ search: "" });
html`<input :value=${state.$search} onInput=${(e: Event) => {
  state.search = (e.target as HTMLInputElement).value;
}} />`;
// :model is sugar over the above
```

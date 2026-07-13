# model

Two-way data binding for form inputs. Syncs a hook value to the element and listens for user input to update the hook.

## Syntax

```typescript
html`<input :model=${state.$name} />`

// Property object (one-way initial value only)
applyProps(element, { model: "initial" });
```

## Behavior

- Sets `element.value` from the hook's current value
- Watches the hook for changes and updates the element
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

1. **Hook → Element**: Changes to the hook update the element's value (via `watch`).
2. **Element → Hook**: The `input` event updates the hook value (via the proxy setter, which notifies watchers).

## vs Manual Binding

```typescript
// :model — two lines, fully reactive
const state = createHook({ search: "" });
html`<input :model=${state.$search} />`;

// Manual equivalent — need watch + event listener
const state = createHook({ search: "" });
html`<input :value=${state.$search} onInput=${(e: Event) => {
  state.search = (e.target as HTMLInputElement).value;
}} />`;
```

# value

Sets the live `.value` property on `<input>` and `<textarea>` elements. Unlike the default `attr` directive (which calls `setAttribute`), this sets the property directly.

## Syntax

```typescript
html`<input :value=${state.$name} />`

// Property object
applyProps(element, { value: "initial" });
```

## Example

```typescript
const state = createHook({ search: "" });

html`
  <input :value=${state.$search} />
  <p>Searching for: ${state.$search}</p>
`;

// state.search = "hello" → input value updates
```

## Supported Elements

| Element | Property |
|---|---|
| `<input>` | `value` |
| `<textarea>` | `value` |

Only `<input>` and `<textarea>` elements set `.value`. Other element types are silently ignored.

## vs attr:value

The `attr` directive calls `element.setAttribute("value", val)`, which sets the HTML default value attribute. The browser uses this as the initial `.value`, but subsequent `.value` changes don't sync back.

The `value` directive calls `element.value = val`, which sets the live value.

```typescript
// Sets the attribute (default value)
html`<input attr:value="hello" />`;

// Sets the live property
html`<input :value="hello" />`;
```

## vs :model

The `:value` directive is one-way (hook → element). For two-way binding, use [`:model`](model.md) which composes `:value` with an `input` listener.

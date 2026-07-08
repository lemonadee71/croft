# show / visible

Controls element visibility.

## show

Sets `display: none` when the value is falsy. The element is removed from layout flow.

```typescript
html`<div :show=${isVisible}></div>`

// Property object
applyProps(element, { _show: true });
```

### Example

```typescript
const state = createHook({ isOpen: false });

html`
  <div :show=${state.$isOpen}>
    This content is hidden when isOpen is false
  </div>
`;

state.isOpen = true; // Shows the div
```

The element always exists in the DOM — only its `display` style is toggled. This preserves element state (e.g., input values, scroll position).

## visible

Sets `visibility: hidden` when the value is falsy. The element remains in layout flow.

```typescript
html`<div :visible=${isVisible}></div>`

// Property object
applyProps(element, { _visible: true });
```

## Difference

| Directive | Falsy Value | Space Occupied? | Children Interactive? |
|---|---|---|---|
| `:show` | `display: none` | No | No |
| `:visible` | `visibility: hidden` | Yes | No |

Use `:show` when you want the element to take no space; use `:visible` when you want to preserve layout while hiding content.

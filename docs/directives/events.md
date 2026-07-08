# Event Handlers

Attach event listeners using `on` + event name attributes.

## Syntax

```typescript
html`<button onClick=${handler}>Click</button>`
html`<input onInput=${handler} onKeydown=${handler} />`
html`<form onSubmit=${handler}>...</form>`

// Property object
applyProps(element, { onClick: handler });
```

## Example

```typescript
const state = createHook({ count: 0 });

html`
  <button onClick=${() => state.count++}>+</button>
  <span>${state.$count}</span>
  <button onClick=${() => state.count--}>-</button>
`;
```

## Event Object

The handler receives the native `Event` object:

```typescript
const handleSubmit = (e: Event) => {
  e.preventDefault();
  console.log("Form submitted");
};

html`
  <form onSubmit=${handleSubmit}>
    <input name="title" />
    <button type="submit">Save</button>
  </form>
`;
```

## Event Modifiers

Append modifiers with a dot after the event name:

| Modifier | Effect |
|---|---|
| `.prevent` | Calls `e.preventDefault()` |
| `.stop` | Calls `e.stopPropagation()` |
| `.only` | Calls `e.stopImmediatePropagation()` |
| `.self` | Only fires if `e.target === e.currentTarget` |
| `.once` | Removes listener after first invocation |
| `.capture` | Listener runs in capture phase |
| `.passive` | Listener is passive (can't call `preventDefault`) |

```typescript
// Prevent default form submission
html`<form onSubmit.prevent=${handleSubmit}>`

// Stop click propagation
html`<button onClick.stop=${handleClick}>`

// Multiple modifiers
html`<a onClick.prevent.stop=${handleLink}>`

// Fire only once
html`<div onMouseenter.once=${handleIntro}>`
```

## Multiple Handlers

Pass an array of handlers for a single event:

```typescript
const log = (e: Event) => console.log("clicked");
const track = (e: Event) => analytics.track("click");

html`<button onClick=${[log, track]}>Click</button>`;
```

## Object Syntax (`on`)

Bind multiple events at once using the `on` attribute with an object:

```typescript
html`
  <input on=${{
    focus: () => console.log("focused"),
    blur: () => console.log("blurred"),
    keydown: [handleEnter, handleEscape],
  }} />
`;
```

This also works for lifecycle events (see [DOM Lifecycles](/lifecycles/dom-lifecycles)):

```typescript
html`
  <div on=${{
    mount: () => console.log("mounted"),
    destroy: () => cleanup(),
  }} />
`;
```

## Dynamic Handlers

Handlers can reference reactive state:

```typescript
const state = createHook({ editingId: null as string | null });

const startEdit = (id: string) => () => {
  state.editingId = id;
};

html`
  <li>
    <label onDblClick=${startEdit(todo.id)}>${todo.title}</label>
  </li>
`;
```

## Supported Events

All native DOM events are supported: `onClick`, `onDblClick`, `onChange`, `onInput`, `onSubmit`, `onKeydown`, `onKeyup`, `onFocus`, `onBlur`, `onMouseover`, `onMouseout`, `onLoad`, `onScroll`, `onResize`, and any custom event name.

## Cleanup

Event listeners are automatically cleaned up when elements are removed from the DOM (via the `@destroy` lifecycle). No manual cleanup needed.

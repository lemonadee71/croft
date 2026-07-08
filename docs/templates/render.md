# render

The `render` function takes a compiled `Template` and mounts it to the DOM.

## Signature

```typescript
function render(template: Template, mount?: string | HTMLElement): DocumentFragment
```

- **template** — A template created by the `html` tag.
- **mount** — A CSS selector string or `HTMLElement`. Defaults to `document.body`.
- **Returns** — The compiled `DocumentFragment`.

## Basic Mounting

```typescript
import { html, render } from "croft";

const template = html`<h1>Hello, World!</h1>`;

// Mount to body
render(template);

// Mount to a specific element
render(template, "#app");

// Mount to an element reference
const container = document.getElementById("app");
render(template, container);
```

## Re-rendering

Croft templates are compiled once and mounted. To update content, use reactive references inside the template rather than re-rendering:

```typescript
const state = createHook({ time: new Date().toLocaleTimeString() });

const template = html`<h1>${state.$time}</h1>`;
render(template, "#app");

// Update the bound value — DOM updates automatically
setInterval(() => {
  state.time = new Date().toLocaleTimeString();
}, 1000);
```

## Return Value

`render` returns the compiled `DocumentFragment`. You can inspect it or re-use it:

```typescript
const fragment = render(template);
console.log(fragment.querySelector("h1")?.textContent);
```

## Multiple Mounts

A single template can be rendered multiple times:

```typescript
const item = html`<li>Item</li>`;

render(item, "#list1");
render(item, "#list2"); // Cloned independently
```

Each mount creates an independent clone of the compiled template.

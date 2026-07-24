# render

The `render` function compiles a `Template` into a `DocumentFragment`. It is a pure function with no side effects — it does not touch the DOM.

## Signature

```typescript
function render(template: Template): DocumentFragment
```

- **template** — A template created by the `html` tag.
- **Returns** — The compiled `DocumentFragment`.

Use `mount(fragment, target)` to append the fragment to the DOM (see below).

## Basic Usage

```typescript
import { html, render, mount } from "@lemonadee/croft";

const template = html`<h1>Hello, World!</h1>`;
const fragment = render(template);

// Mount to a specific element
mount(fragment, "#app");

// Or mount to an element reference
const container = document.getElementById("app");
mount(fragment, container);
```

## Pure Creation, Separate Mount

`render` only creates DOM — it never appends. This lets you inspect or manipulate the fragment before mounting:

```typescript
const fragment = render(html`<h1>Hello</h1>`);
console.log(fragment.querySelector("h1")?.textContent); // "Hello"

// When ready, mount it
mount(fragment, "body");
```

## Re-rendering

Croft templates are compiled once and mounted. To update content, use reactive references inside the template rather than re-rendering:

```typescript
import { html, render, mount } from "@lemonadee/croft";

const state = createHook({ time: new Date().toLocaleTimeString() });

const template = html`<h1>${state.$time}</h1>`;
mount(render(template), "#app");

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

mount(render(item), "#list1");
mount(render(item), "#list2"); // Cloned independently
```

Each mount creates an independent clone of the compiled fragment.

## mount

```typescript
function mount(fragment: DocumentFragment, target: string | HTMLElement): void
```

Appends a rendered fragment to the DOM. Throws if the target is not a valid HTMLElement.

- **fragment** — A `DocumentFragment` returned by `render()`.
- **target** — A CSS selector string or an `HTMLElement`.

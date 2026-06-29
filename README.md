# Peasant JSX 🌾

A lightweight, decoupled, and highly reactive JSX-like templating engine using native DOM. 

Unlike traditional virtual DOM libraries, Peasant JSX uses native browser features, a clean pub/sub reactivity system based on ES6 Proxies, and a plug-and-play directive engine to build fast, robust web interfaces with zero build-step requirements.

---

## Features

- **⚡ Native DOM Performance:** Directly compiles HTML string templates into native DOM elements without any virtual DOM diffing overhead.
- **🔄 Decoupled Reactivity:** Powered by a clean pub/sub hook proxy model that updates only the specific elements bound to state changes.
- **🛡️ Typesafe Hook References:** Provides complete TypeScript support for property references and nested method forwarding (e.g. array/string manipulations).
- **🔌 Unified Directives Registry:** All directives (built-in and custom plugins) share a common matcher-handler interface, eliminating hardcoded switch blocks.
- **🏷️ Native DOM Lifecycles:** MutationObserver-based lifecycles supporting `@create`, `@mount`, `@unmount`, and `@destroy` hooks.
- **🪶 Ultra-Lightweight:** Zero heavy dependencies; uses the lightweight `is-what` library for fast, robust type checking.

---

## Installation

```bash
pnpm install peasant-jsx
# or
npm install peasant-jsx
```

---

## Quick Start

```typescript
import PoorManJSX, { html, render, createHook } from "peasant-jsx";

// 1. Create a reactive state hook
const state = createHook({
  count: 0,
  items: ["Apple", "Banana"]
});

// 2. Build templates with standard JSX-like syntax
const App = () => html`
  <div class="app">
    <h1>Counter: ${state.$count}</h1>
    <button onClick=${() => state.count++}>Increment</button>

    <ul>
      ${state.$items.map((item) => html`<li>${item}</li>`)}
    </ul>
  </div>
`;

// 3. Render and mount to the body
render(App(), "body");
```

---

## Core API Guide

### 1. Reactivity & Hooks

The reactive state in Peasant JSX is created using `createHook`. Properties starting with `$` represent reactive references (subscribers/watchers) that can be inserted into the DOM.

```typescript
const state = createHook({ name: "World" });

// Inserts a reactive listener
html`<div>Hello, ${state.$name}!</div>`;

// Update state directly - updates DOM node instantly
state.name = "Peasant";
```

#### Typesafe Method Forwarding
Peasant JSX supports method and property forwarding directly on reactive references. All methods are fully typed!

```typescript
const state = createHook({
  title: "peasant jsx",
  tags: ["refactor", "typesafe"]
});

// 1. String method forwarding
html`<h1>${state.$title.toUpperCase()}</h1>`

// 2. Array method forwarding
html`
  <ul>
    ${state.$tags.reverse().map((tag) => html`<li>${tag}</li>`)}
  </ul>
`
```

#### Watching State programmatically
You can observe property updates manually using `watch` and `unwatch`.

```typescript
import { watch } from "peasant-jsx";

// watch returns an unsubscribe cleanup function
const unsubscribe = watch(state.$title, (newTitle) => {
  console.log("Title changed to:", newTitle);
});

// Stop observing
unsubscribe();
```

---

## Directives System

Directives customize the behavior of elements during hydration. Attributes prefixed with `:` or keys in properties objects are resolved to directives.

### Built-in Directives

| Directive | HTML Syntax | Property Object | Description |
| :--- | :--- | :--- | :--- |
| **text** | `:text=${val}` | `textContent` | Sets element text content safely. |
| **html** | `:html=${val}` | `innerHTML` | Sets inner HTML (unescaped). |
| **class** | `class=${val}` | `class` | Adds class string, array, or object keys. |
| **class:name** | `class:name=${bool}` | `class:name` | Toggles single class name conditionally. |
| **style** | `style=${val}` | `style` | Sets styles via string or object. |
| **style:prop**| `style:color=${val}` | `style:color` | Sets style property individually (supports camelCase). |
| **toggle** | `toggle:disabled=${val}`| `toggle:disabled` | Toggles presence of boolean attributes. |
| **children** | `:children=${val}` | `children` | Replaces target children nodes. |
| **ref** | `:ref=${myRef}` | `_ref` | Binds the element node to a reference object. |
| **show** | `:show=${val}` | `_show` | Controls visibility via display property. |
| **visible** | `:visible=${val}` | `_visible` | Controls visibility via visibility property. |

### Custom Directives (Plugins)
You can define custom directives to handle custom attributes or behaviors.

```typescript
import PoorManJSX from "peasant-jsx";

PoorManJSX.addDirective({
  type: "tooltip",
  predicate: (key) => key === ":tooltip",
  callback: (element, data) => {
    element.setAttribute("title", data.value);
    element.classList.add("has-tooltip");
  }
});

// Usage in HTML:
html`<span :tooltip="Helpful information">Hover me</span>`
```

---

## DOM Lifecycles

Elements managed by Peasant JSX receive lifecycles via standard custom events.

```typescript
const handleMount = () => console.log("Element added to DOM!");
const handleDestroy = () => console.log("Element destroyed/garbage collected!");

html`
  <div 
    onMount=${handleMount} 
    onDestroy=${handleDestroy}
  >
    Lifecycle Box
  </div>
`
```

- `onCreate`: Dispatched when the DocumentFragment is first created.
- `onMount` / `onLoad`: Dispatched when the element is attached to the DOM body.
- `onUnmount`: Dispatched when the element is removed from its parent node.
- `onDestroy`: Dispatched when the element is detached and no longer in the document (perfect for cleaning up resources/event listeners).

---

## License

MIT

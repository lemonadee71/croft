# Peasant JSX 🌾

A lightweight, decoupled, and highly reactive JSX-like templating engine using native DOM. 

Unlike traditional virtual DOM libraries, Peasant JSX uses native browser features, a clean pub/sub reactivity system based on ES6 Proxies, and a plug-and-play directive engine to build fast, robust web interfaces with zero build-step requirements.

---

## Features

- **⚡ Native DOM Performance:** Directly compiles HTML string templates into native DOM elements without any virtual DOM diffing overhead.
- **🔄 Decoupled Reactivity:** Powered by a clean pub/sub hook proxy model that updates only the specific elements bound to state changes.
- **🛡️ Typesafe Hook References:** Provides complete TypeScript support for property references and nested method forwarding (e.g. array/string manipulations).
- **🔌 Unified Directives Registry:** All directives (built-in and custom plugins) share a common matcher-handler interface, eliminating hardcoded switch blocks.
- **🏷️ Native DOM Lifecycles:** MutationObserver-based lifecycles supporting `@create`, `@mount`, `@unmount`, and `@destroy` hooks, with a generic plugin hook pipeline (`onLifecycle`).
- **🧩 Custom Components:** Register components with custom tag names — they work just like native elements in templates, with full directive and lifecycle support.
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
  match: ":tooltip",
  callback: (element, data) => {
    element.setAttribute("title", data.value);
    element.classList.add("has-tooltip");
  }
});

// Usage in HTML:
html`<span :tooltip="Helpful information">Hover me</span>`
```

The `match` field accepts several forms:

| Form | Behavior |
| :--- | :--- |
| Omitted | Exact match on `type` for both HTML attrs and object keys |
| `match: ":foo"` | Exact match on `:foo` for both contexts |
| `match: (key) => key.endsWith("foo")` | Custom matcher for both contexts |
| `match: { attrName: ":foo", objKey: "foo" }` | Separate matchers per context |

The predicate function returns the matched key as a string, `false` for no match, or `[type, key]` for advanced overrides.

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

### Rendering Pipeline Hooks

For plugins that need to hook into the template compilation pipeline, use the generic lifecycle API:

```typescript
import PoorManJSX from "peasant-jsx";

// Register a callback for a pipeline stage
PoorManJSX.onLifecycle("beforeCreate", (htmlString: string) => htmlString.replace(/foo/g, "bar"));
PoorManJSX.onLifecycle("afterCreate", (fragment: DocumentFragment, values: Record<string, any>) => { /* ... */ });
PoorManJSX.onLifecycle("beforeHydrate", (root: HTMLElement, context: Record<string, any>) => { /* ... */ });
PoorManJSX.onLifecycle("afterHydrate", (root: HTMLElement, context: Record<string, any>) => { /* ... */ });

// Remove a callback
PoorManJSX.removeLifecycle("beforeCreate", myCallback);

// Run all callbacks for a stage (used internally)
PoorManJSX.runLifecycle("beforeCreate", templateString);
```

| Stage | Signature | Description |
| :--- | :--- | :--- |
| `beforeCreate` | `(htmlString) => htmlString` | Transform the raw HTML string before DOM parsing. |
| `afterCreate` | `(fragment, values)` | Inspect/modify the DocumentFragment after creation. |
| `beforeHydrate` | `(root, context)` | Run logic just before directive hydration. |
| `afterHydrate` | `(root, context)` | Run logic after all directives are applied.

---

## Custom Components

Peasant JSX supports custom components — elements with a user-defined tag name that render a template when encountered in the DOM.

### Defining a Component

Components can be registered via `defineComponent` or the plugin mount system:

```typescript
import { defineComponent, html } from "peasant-jsx";

// Generic props type for type safety
interface GreetingProps {
  name: string;
}

defineComponent<GreetingProps>("my-greeting", (props, slots) => {
  return html`<h1>Hello, ${props.name}!</h1>`;
});
```

Or grouped under a plugin mount:

```typescript
import PoorManJSX from "peasant-jsx";

PoorManJSX.mount("components", {
  "my-button": (props: any) =>
    html`<button class=${props.variant}>${props.label}</button>`,
  "my-badge": (props: any) =>
    html`<span class=${props.variant}>${props.label}</span>`,
});
```

### Component Signature

```
<P extends Record<string, any>>(props: P, slots: Record<string, Node[]>) => Template
```

- **props** — Object of resolved attribute values. Static strings passed through; dynamic values (placeholders, hooks) resolved before reaching the component.
- **slots** — Object of named child node arrays. Children with a `slot="name"` attribute go into `slots.name`; children without go into `slots.default`. All children are processed through the directive pipeline and component resolution before reaching the component.

### Usage in Templates

```typescript
// Self-closing tag
html`<my-greeting name="World"></my-greeting>`

// With child content (default slot)
html`
  <my-card variant="primary">
    <h2>Title</h2>
    <p>Content here</p>
  </my-card>
`

// With reactive state (static resolution — parent re-renders on change)
const state = createHook({ name: "Peasant" });
html`<my-greeting name=${state.$name}></my-greeting>`
// → state.name = "JSX"; re-render parent to update component
```

### Slots

Components can define named insertion points using `<slot>` elements in their template. Children are projected into matching slots at render time.

#### Named Slots

Use the `slot` attribute on child elements to target a specific name, and `<slot name="...">` in the component template to declare the insertion point:

```typescript
defineComponent("my-split", (_props: any, slots: any) =>
  html`
    <div class="split">
      <header><slot name="header"></slot></header>
      <main><slot></slot></main>
      <footer><slot name="footer"></slot></footer>
    </div>
  `
);

// Usage:
html`
  <my-split>
    <h1 slot="header">Title</h1>
    <p>Body content</p>
    <small slot="footer">Footer note</small>
  </my-split>
`;
```

- Children without a `slot` attribute go into `slots.default`.
- Children with `slot="name"` go into `slots.name`.
- The `slot` attribute is stripped from rendered output automatically.

#### Fallback Content

Content inside a `<slot>` element is used as fallback when no matching children are provided:

```typescript
defineComponent("my-card", (_props: any, slots: any) =>
  html`
    <div class="card">
      <slot name="header"><h1>Default Title</h1></slot>
      <slot><p>Default body</p></slot>
    </div>
  `
);

// Renders with fallback content:
html`<my-card></my-card>`
// → <div class="card"><h1>Default Title</h1><p>Default body</p></div>

// Renders with projected children:
html`
  <my-card>
    <h2 slot="header">Custom Title</h2>
    <span>Custom body</span>
  </my-card>
`
// → <div class="card"><h2>Custom Title</h2><span>Custom body</span></div>
```

#### Programmatic Access

The `slots` object is passed directly to the render function, enabling programmatic use beyond `<slot>` elements:

```typescript
defineComponent("my-inspector", (_props: any, slots: any) =>
  html`<span>${slots.default ? slots.default.length : 0} children</span>`
);
```

### How It Works

Component resolution runs **after** the standard directive pipeline, meaning basic directives (body, attributes, lifecycle) are applied to the top-level fragment first, then components are resolved top-down:

1. The fragment is compiled through the standard pipeline (`resolveBody` → hydrate lifecycles → `resolveAttributes`).
2. `resolveComponents` walks the DOM top-down, identifying registered custom elements.
3. Each registered custom element has its attributes collected and resolved into a props object.
4. Child DOM nodes are extracted and bucketed into named slots by the `slot` attribute (`slots.default` for unnamed children).
5. Each slot bucket's children are processed through the full pipeline (directives + nested component resolution).
6. The component's render function is called with `(props, slots)`.
7. The returned Template is compiled through `createElementFromTemplate`, then `resolveComponents` is called on the result — its own content goes through the full pipeline independently, including nested component resolution.
8. `<slot>` elements in the fragment are resolved: each slot is replaced with its matching children (or its fallback content if none match).
9. The custom element is replaced with the rendered fragment.

Because components are compiled through the standard pipeline, they support all built-in directives, lifecycle events, slots, and nested components. Unregistered custom tags are reported via `console.warn` automatically.

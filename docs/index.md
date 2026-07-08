# Croft 🌾

A lightweight, decoupled, and highly reactive JSX-like templating engine using native DOM.

Unlike traditional virtual DOM libraries, Croft uses native browser features, a clean pub/sub reactivity system based on ES6 Proxies, and a plug-and-play directive engine to build fast, robust web interfaces with zero build-step requirements.

## Why Croft?

- **⚡ Native DOM Performance** — Directly compiles HTML string templates into native DOM elements without any virtual DOM diffing overhead.
- **🔄 Decoupled Reactivity** — Powered by a clean pub/sub hook proxy model that updates only the specific elements bound to state changes.
- **🛡️ Typesafe Hook References** — Complete TypeScript support for property references and nested method forwarding (e.g. array/string manipulations).
- **🔌 Unified Directives Registry** — All directives (built-in and custom plugins) share a common matcher-handler interface, eliminating hardcoded switch blocks.
- **🏷️ Native DOM Lifecycles** — MutationObserver-based lifecycle hooks (`@create`, `@mount`, `@unmount`, `@destroy`).
- **🧩 Custom Components** — Register components with custom tag names — they work just like native elements in templates.
- **🪶 Ultra-Lightweight** — Zero heavy dependencies.

## Quick Tour

```typescript
import Croft, { html, render, createHook } from "croft";

const state = createHook({ count: 0 });

const App = () => html`
  <div class="app">
    <h1>Counter: ${state.$count}</h1>
    <button onClick=${() => state.count++}>Increment</button>
  </div>
`;

render(App());
```

[Get Started →](/getting-started)

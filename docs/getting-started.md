# Getting Started

## Installation

```bash
pnpm add croft
# or
npm install croft
```

## Quick Start

```typescript
import Croft, { html, render, createHook } from "croft";

// 1. Create a reactive state hook
const state = createHook({
  count: 0,
  items: ["Apple", "Banana"],
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
render(App());
```

Croft renders directly into native DOM — no virtual DOM, no diffing, no build step required.

## Browser Support

Croft requires ES6 Proxy support (all modern browsers). It will not work in IE11.

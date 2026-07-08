# Plugins

Croft has a simple plugin system for grouping related functionality.

## Plugin Mount

```typescript
import Croft from "croft";

Croft.mount("my-plugin", {
  // Components
  "my-component": (props, slots) => html`<div>...</div>`,

  // Directives (via addDirective in _init)
  _init() {
    Croft.addDirective({
      type: "my-directive",
      match: ":my-directive",
      callback: (el, { value }) => { /* ... */ },
    });
  },
});
```

## Plugin Structure

A plugin is an object registered under a unique name. It can contain:
- **Component renderers** — keyed by tag name
- **`_init` function** — called immediately when the plugin is mounted

Components in plugins work identically to `defineComponent` — they're registered in the same component registry.

## Lifecycle Hooks in Plugins

Plugins can hook into the pipeline:

```typescript
Croft.mount("analytics", {
  _init() {
    Croft.onLifecycle("afterHydrate", (root) => {
      // Track all rendered elements
      trackElements(root);
    });
  },
});
```

## Plugin Conflicts

Plugin names must be unique. Mounting with a name that's already taken throws an error:

```typescript
Croft.mount("my-plugin", { /* ... */ });
Croft.mount("my-plugin", { /* ... */ }); // Error: my-plugin is already taken
```

## Creating Reusable Plugins

For distribution, export a function that accepts Croft:

```typescript
// my-plugin.ts
import type Croft from "croft";

export function myPlugin(croft: typeof Croft, options: MyOptions) {
  croft.mount("my-plugin", {
    "my-component": (props) => html`<div>${options.prefix} ${props.text}</div>`,
    _init() {
      croft.addDirective({
        type: "my-dir",
        match: ":my-dir",
        callback: (el, { value }) => { /* ... */ },
      });
    },
  });
}

// Usage:
import Croft from "croft";
import { myPlugin } from "my-plugin";

myPlugin(Croft, { prefix: ">>" });
```

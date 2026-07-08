# Pipeline Hooks

Hook into the template compilation pipeline with lifecycle callbacks.

## Available Stages

| Stage | Signature | Description |
|---|---|---|
| `beforeCreate` | `(htmlString) => htmlString` | Transform the raw HTML before parsing |
| `afterCreate` | `(fragment, values)` | Inspect/modify the DocumentFragment after creation |
| `beforeHydrate` | `(root, context)` | Run logic just before directive hydration |
| `afterHydrate` | `(root, context)` | Run logic after all directives are applied |

## API

```typescript
import Croft from "croft";

// Register
Croft.onLifecycle("beforeCreate", (htmlString: string) => {
  return htmlString.replace(/foo/g, "bar");
});

Croft.onLifecycle("afterCreate", (fragment: DocumentFragment, values: Record<string, any>) => {
  console.log("Template values:", values);
});

// Remove
Croft.removeLifecycle("beforeCreate", myCallback);

// Run (internal use)
Croft.runLifecycle("beforeCreate", templateString);
```

## Use Cases

### Preprocessing HTML

```typescript
Croft.onLifecycle("beforeCreate", (html) => {
  return html.replace(/<icon-(\w+)>/g, (_, name) => {
    return `<span class="icon icon-${name}"></span>`;
  });
});
```

### Custom Element Transformations

```typescript
Croft.onLifecycle("beforeCreate", (html) => {
  // Convert markdown-style syntax to HTML
  return html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
});
```

### Debugging

```typescript
Croft.onLifecycle("afterCreate", (fragment) => {
  console.log("Fragment HTML:", fragment.innerHTML);
});
```

## Order of Execution

1. `beforeCreate` — multiple callbacks run in registration order, chaining the HTML string
2. HTML parsing via `createContextualFragment`
3. `afterCreate` — all callbacks run in parallel
4. `resolveBody` (interpolation resolution)
5. `beforeHydrate` — all callbacks run in parallel
6. `resolveAttributes` (directive application)
7. `afterHydrate` — all callbacks run in parallel
8. `resolveComponents` (component resolution)

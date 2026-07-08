# Pipeline Overview

Every template in Croft goes through a compilation pipeline that transforms an HTML string into live, reactive DOM nodes.

```
HTML String → DocumentFragment → resolveBody → resolveAttributes → resolveComponents
```

## The Pipeline Stages

### 1. `beforeCreate`

The raw HTML string can be transformed by lifecycle hooks before parsing. This is useful for plugins that need to preprocess template strings.

```typescript
Croft.onLifecycle("beforeCreate", (htmlString) => {
  return htmlString.replace(/<custom-element/g, "<div");
});
```

### 2. DocumentFragment Creation

The (possibly transformed) HTML string is parsed into a `DocumentFragment` using the native `Range.createContextualFragment()` API. This is the only point where the browser's HTML parser runs.

### 3. `afterCreate`

After the fragment exists but before any hydration, you can inspect or modify the raw DOM tree.

```typescript
Croft.onLifecycle("afterCreate", (fragment, values) => {
  console.log("Template values:", values);
});
```

### 4. `resolveBody`

Interpolated values (`${}` expressions in the template) are resolved. Text nodes, nested templates, and reactive references are replaced into their placeholder positions.

### 5. `beforeHydrate`

Runs just before directive hydration. The root element and the context (values map) are available.

### 6. `resolveAttributes`

All directives (`:text`, `:show`, event handlers, etc.) are matched and applied to their elements. This is where the actual DOM behavior is wired up.

### 7. `afterHydrate`

Runs after all directives have been applied. Useful for post-processing.

### 8. `resolveComponents`

Registered custom components (`defineComponent`) are resolved top-down. Each component's template goes through its own full pipeline independently.

## The Pipeline API

You can create reusable pipeline functions:

```typescript
import { createElementFromTemplate } from "croft";

const fragment = createElementFromTemplate(template);
// fragment is now fully compiled and ready to mount
```

## Order Guarantees

1. Directives on the root fragment run **before** components are resolved.
2. Components are resolved **top-down** (parents before children).
3. Each component instance runs through its own independent pipeline.

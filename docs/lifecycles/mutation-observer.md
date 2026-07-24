# Mutation Observer

Croft's DOM lifecycle system is built on the native `MutationObserver` API.

## How It Works

When `enableLifecycle()` is called (it's called automatically on import in browser environments), Croft attaches a `MutationObserver` to `document.body` that watches for `childList` mutations in the entire subtree.

When elements are **added**:
- The `@mount` event is dispatched on the element and all its descendants via `traverse`.

When elements are **removed**:
- The `@unmount` event is dispatched immediately.
- If the element is no longer in the document, `@destroy` is also dispatched.

## Enable / Disable

```typescript
import Croft, { enableLifecycle, disableLifecycle } from "@lemonadee/croft";

// Enable (automatic in browser)
enableLifecycle();

// Disable — stops observing mutations
disableLifecycle();
```

## Non-browser Environments

Lifecycles are automatically disabled when Croft is imported in a non-browser environment (e.g., Node.js for SSR or testing). You can manually enable them if needed:

```typescript
import { enableLifecycle } from "@lemonadee/croft";

if (typeof document !== "undefined") {
  enableLifecycle();
}
```

## Performance

The MutationObserver uses `{ childList: true, subtree: true }` — the same pattern used by major frameworks. The event dispatching is batched and only runs on element nodes (`nodeType === 1`), so the performance impact is minimal.

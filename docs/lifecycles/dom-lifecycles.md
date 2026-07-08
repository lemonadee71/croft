# DOM Lifecycles

Elements managed by Croft receive lifecycle events dispatched as native custom events.

## Available Lifecycles

| Attribute | Event | When |
|---|---|---|
| `onCreate` | `@create` | When the DocumentFragment is created |
| `onMount` / `onLoad` | `@mount` | When attached to the document body |
| `onUnmount` | `@unmount` | When removed from its parent |
| `onDestroy` | `@destroy` | When detached from the document |

## Usage

```typescript
html`
  <div
    onCreate=${() => console.log("Element created")}
    onMount=${() => console.log("Element mounted to DOM")}
    onUnmount=${() => console.log("Element removed from DOM")}
    onDestroy=${() => console.log("Element destroyed")}
  >
    Lifecycle Demo
  </div>
`;
```

## onMount / onLoad

Fires when an element is added to the document body. Useful for:
- Starting animations
- Fetching data
- Focusing inputs
- Integrating with third-party libraries

```typescript
html`
  <input
    onMount=${(e: Event) => (e.target as HTMLInputElement).focus()}
  />
`;
```

## onDestroy

Fires when an element is removed from the DOM and is no longer in the document. Useful for:
- Canceling timers/intervals
- Removing event listeners
- Freeing resources

```typescript
const state = createHook({ mounted: true });

const timer = setInterval(() => console.log("tick"), 1000);

html`
  <div onDestroy=${() => clearInterval(timer)}>
    This div cleans up its timer when removed
  </div>
`;
```

## How It Works

Lifecycles are powered by a `MutationObserver` on `document.body`. When elements are added or removed, the observer dispatches the corresponding events on the element and all its descendants.

## Disabling Lifecycles

```typescript
import Croft from "croft";

Croft.disableLifecycle();

// Lifecycles can be re-enabled:
Croft.enableLifecycle();
```

Lifecycle observation is automatically disabled in non-browser environments (SSR, testing).

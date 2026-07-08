# watch / unwatch

The `watch` function lets you observe property changes programmatically.

## Signature

```typescript
function watch<T>(ref: HookRef<T>, callback: (newValue: T) => void): () => void
function unwatch<T>(ref: HookRef<T>, callback: (newValue: T) => void): void
```

- **ref** — A reactive reference (e.g., `state.$count`).
- **callback** — Function called with the new value whenever it changes.
- **Returns** — An unsubscribe function.

## Basic Usage

```typescript
import { createHook, watch } from "croft";

const state = createHook({ count: 0 });

const unsubscribe = watch(state.$count, (newCount) => {
  console.log("Count is now:", newCount);
});

state.count = 5; // Logs: "Count is now: 5"

// Stop watching
unsubscribe();
```

## localStorage Persistence

A common pattern is persisting state to localStorage:

```typescript
const STORAGE_KEY = "my-app-state";

const loadState = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const state = createHook(loadState());

watch(state.$state, (newState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
});
```

## Multiple Watchers

You can add multiple watchers to the same reference:

```typescript
watch(state.$count, (n) => console.log("watcher 1:", n));
watch(state.$count, (n) => console.log("watcher 2:", n));
```

## unwatch

```typescript
const fn = (n) => console.log(n);
watch(state.$count, fn);

// Later:
unwatch(state.$count, fn);
```

## Notes

- The callback fires **after** the value has been set.
- During the callback, the new value is already available on the state object.
- Watch callbacks are synchronous.

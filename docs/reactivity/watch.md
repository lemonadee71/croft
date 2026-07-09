# watch / unwatch

The `watch` function lets you observe property changes programmatically.

## Signature

```typescript
function watch<T>(ref: HookRef<T>, callback: (newValue: T, state: Record<string, any>) => void): () => void
function unwatch<T>(ref: HookRef<T>, callback: (newValue: T, state: Record<string, any>) => void): void
```

- **ref** — A reactive reference (e.g., `state.$count`).
- **callback** — Function called with the new value and a plain state snapshot whenever it changes.
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

## Accessing Other State

The callback receives a **plain object snapshot** of all hook properties as the second argument. This is useful when one property's change depends on another:

```typescript
const state = createHook({ todos: [], filter: "all" });

watch(state.$todos, (newTodos, snapshot) => {
  // snapshot is a plain object — NOT a Proxy
  // snapshot.filter has the current filter value
  localStorage.setItem("todos", JSON.stringify(newTodos));
});

watch(state.$filter, (newFilter, snapshot) => {
  // snapshot.todos is the current todos at the time of the change
  const filtered = newFilter === "all"
    ? snapshot.todos
    : snapshot.todos.filter(t => /* ... */);
  updateUI(filtered);
});
```

The second parameter is a shallow `{ ...target }` copy — it's a plain object, not a Proxy. Writing to it won't trigger watchers.

## localStorage Persistence

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
- The second argument is a plain snapshot — modifying it won't trigger reactivity.
- Watch callbacks are synchronous.

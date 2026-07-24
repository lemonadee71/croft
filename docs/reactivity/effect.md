# effect

`effect` runs a function immediately and automatically re-runs it whenever its reactive dependencies change. Dependencies are tracked during execution — no explicit dependency arrays needed.

## Signature

```typescript
function effect(fn: () => void): () => void
```

- **fn** — A function to run. Any reactive properties accessed inside `fn` are tracked as dependencies.
- **Returns** — A disposer function. Call it to stop tracking and clean up.

## Basic Usage

```typescript
import { createHook, effect } from "croft";

const state = createHook({ count: 0, label: "tick" });

const dispose = effect(() => {
  console.log(state.label + ": " + state.count);
});
// Logs: "tick: 0" (runs immediately)

state.count = 1;
// Logs: "tick: 1" (auto-re-runs)

state.label = "boom";
// Logs: "boom: 1" (re-runs on label change too)

dispose(); // stop tracking
state.count = 2; // nothing logged
```

## With Computed

```typescript
import { createHook, computed, effect } from "croft";

const state = createHook({ items: [1, 2, 3] });
const total = computed(() => state.items.reduce((a, b) => a + b, 0));

effect(() => {
  console.log("Total:", total.value);
});
// Logs: "Total: 6"

state.items = [...state.items, 4];
// Logs: "Total: 10"
```

## Dynamic Branching

Dependencies are re-collected on every run. This means an effect naturally handles conditional logic — it only depends on the properties that were actually accessed in the most recent run:

```typescript
const state = createHook({ show: true, name: "Alice", age: 30 });

effect(() => {
  if (state.show) {
    console.log(state.name); // depends on show + name
  } else {
    console.log(state.age);  // depends on show + age
  }
});

state.name = "Bob";   // re-runs (name is a dep)
state.age = 35;        // does NOT re-run (age is not a dep while show=true)

state.show = false;    // re-runs — now depends on show + age
state.age = 40;        // re-runs (age is now a dep)
state.name = "Charlie"; // does NOT re-run (name is no longer tracked)
```

## Cleanup

The disposer removes the effect from all dependency sets. This is useful for cleaning up effects when a component unmounts or when state changes make an effect obsolete:

```typescript
const state = createHook({ visible: true, count: 0 });

const dispose = effect(() => {
  if (state.visible) {
    console.log("Count:", state.count);
  }
});

// Later: tear down
dispose();
```

## Comparison with watch

| | `watch(ref, fn)` | `effect(fn)` |
|---|---|---|
| **Dependencies** | Explicit (declare the ref) | Auto-tracked during execution |
| **Runs immediately** | No (only on change) | Yes |
| **Multiple deps** | One ref per call | Any accessed properties |
| **Dynamic branching** | N/A | Yes |
| **Returns** | Unsubscribe function | Disposer function |

Use `watch` when you need to observe a specific ref. Use `effect` when you have complex logic with multiple reactive dependencies.

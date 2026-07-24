# computed

`computed` creates a derived reactive value that caches its result and only re-evaluates when its tracked dependencies change. Unlike traps on `$` refs, `computed` is evaluated lazily and can be used standalone (outside templates).

## Signature

```typescript
function computed<T>(getter: () => T): ComputedRef<T>
```

- **getter** — A function that returns the derived value. Dependencies are auto-tracked during execution.
- **Returns** — A read-only ref with a `.value` property.

The returned ref is compatible with `watch()`, `effect()`, and template bindings.

## Basic Usage

```typescript
import { createHook, computed, effect } from "croft";

const count = createHook(0);

// Derived state — lazy, cached
const doubled = computed(() => count.value * 2);

console.log(doubled.value); // 0 (getter runs once)
doubled.value; // 0 (cached — getter not re-called)

count.value = 5;
console.log(doubled.value); // 10 (auto-re-evaluated)
```

## With Templates

```typescript
import { html, render, mount, createHook, computed } from "croft";

const state = createHook({ name: "World" });
const greeting = computed(() => "Hello, " + state.name + "!");

mount(render(html`<h1 :text=${greeting}></h1>`), "body");

state.name = "Croft"; // DOM updates to "Hello, Croft!"
```

## With watch

```typescript
import { createHook, computed, watch } from "croft";

const state = createHook({ count: 0 });
const doubled = computed(() => state.count * 2);

watch(doubled, (newValue) => {
  console.log("doubled:", newValue);
});

state.count = 5; // Logs: "doubled: 10"
```

## With effect

```typescript
import { createHook, computed, effect } from "croft";

const state = createHook({ a: 1, b: 2 });
const sum = computed(() => state.a + state.b);

effect(() => {
  console.log("sum is", sum.value);
});
// Logs: "sum is 3"

state.a = 10; // Logs: "sum is 12"
```

## Multiple Dependencies

The getter can access any number of hook properties — all are tracked automatically:

```typescript
const state = createHook({ firstName: "John", lastName: "Doe" });
const fullName = computed(() => state.firstName + " " + state.lastName);

console.log(fullName.value); // "John Doe"

state.lastName = "Smith";
console.log(fullName.value); // "John Smith"
```

## Chained Computeds

Computeds can depend on other computeds:

```typescript
const state = createHook({ count: 0 });
const doubled = computed(() => state.count * 2);
const quadrupled = computed(() => doubled.value * 2);

console.log(quadrupled.value); // 0

state.count = 3;
console.log(doubled.value);    // 6
console.log(quadrupled.value); // 12
```

## Caching

`computed` only re-evaluates when a dependency actually changed. If multiple dependencies change in the same synchronous block, the getter runs once per change (no batching yet — coming in a future release).

## Why computed instead of traps?

| | Trap (`$ref(fn)`) | `computed(getter)` |
|---|---|---|
| **Evaluated** | At DOM resolution time | Lazily (on `.value` read) |
| **Cached** | No (runs each time DOM resolves) | Yes (until dep changes) |
| **Standalone** | No (designed for templates) | Yes (use anywhere) |
| **Chaining** | Via `.map()`, `.filter()`, etc. | Via nested `computed()` |

Use traps for in-template one-liners. Use `computed()` for reusable derived state or when you need caching.

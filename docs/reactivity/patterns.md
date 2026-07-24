# Patterns

## Derived State

Croft offers two ways to derive values from state: **traps** on `$` references and **`computed()`**.

### Traps ($-prefixed)

A trap is a transform applied to a `$` reference. It re-evaluates when its **source property** changes:

```typescript
const filteredTodos = state.$filter((filter, snapshot) => {
  if (filter === "all") return snapshot.todos;
  return snapshot.todos.filter(t =>
    filter === "active" ? !t.completed : t.completed,
  );
});

const activeCount = state.$todos((todos) =>
  todos.filter((t) => !t.completed).length,
);
```

Traps have access to the full hook state via the second `snapshot` argument, but they **only re-trigger when their own source property changes**. In the `filteredTodos` example above, if `todos` changes but `filter` stays the same, the trap does NOT re-evaluate — the snapshot is stale.

Traps also re-compute on every read — there is no caching.

Use them directly in templates — they're reactive:

```typescript
html`<span>${activeCount} items left</span>`;
```

#### With method forwarding

Method calls on `$` references chain as transforms:

```typescript
html`<span>${state.$todos.filter(t => !t.completed).length()} items left</span>`;
```

Note that calling `length()` works because `.length` on a `$` reference returns a callable, but this is fragile — prefer a trap for getter-only properties.

```typescript
// ✅ Clear and reliable — inline trap
html`<span>${state.$todos((todos) => todos.filter(t => !t.completed).length)} items left</span>`;
```

#### What NOT to do

JavaScript operators on `$` references are evaluated **at render time** and are **not reactive**:

```typescript
// ❌ NOT reactive — evaluated once
state.$filter === "all"                              // returns true/false at render time, never updates
state.$todos.length > 0 ? html`...` : ""             // ternary evaluates once
state.$todos.map(todo => html`<li>...</li>`)          // .map evaluates once
```

Use traps, `computed()`, or `watch()` instead.

### computed()

A `computed()` auto-tracks every dependency it reads during evaluation, and re-runs only when **any** of them changes. It also caches — redundant reads return the last value without re-computing:

```typescript
import { createHook, computed } from "croft";

const state = createHook({ todos: [], filter: "all" });

const visibleTodos = computed(() => {
  if (state.filter === "all") return state.todos;
  return state.todos.filter(t =>
    state.filter === "active" ? !t.completed : t.completed,
  );
});

// In templates — note .value access
render(html`<ul>${visibleTodos.value.map(t => html`<li>...</li>`)}</ul>`);
```

Because `computed()` tracks all accessed properties, `visibleTodos` re-evaluates when **either** `todos` or `filter` changes. No stale snapshots, no manual `watch` to sync.

See the full [`computed` docs](/reactivity/computed).

### Traps vs computed — when to use which

| Situation | Trap | `computed()` |
|-----------|------|--------------|
| Derivation depends on **one** source property | ✅ natural | ✅ works |
| Derivation depends on **multiple** properties | ⚠️ snapshot can go stale — trap only re-triggers on its source | ✅ auto-tracks all deps |
| Used inline in a template with method chaining | ✅ `.map()`/`.filter()` chain directly on `$` ref | ⚠️ needs `.value` or wrapper |
| Value is read many times (expensive computation) | ⚠️ re-computes on every read | ✅ cached until deps change |
| Namespaced on the hook object | ✅ `store.$derived` | ❌ standalone export |

**Rule of thumb:** simple one-source transforms → trap. Multi-source or expensive derivations → `computed()`.

## Trap Chaining

A trap returns a callable `HookRef` that can itself receive a transform, composing the two:

```typescript
const state = createHook({ items: ["a", "b", "c"] });
const length = state.$items((items) => items.length);
const isLong = length((n) => n > 2);
// isLong resolves to true when items.length > 2

// Use in a template — reacts to source changes
html`<span :text=${isLong}></span>`;
```

The second transform receives the result of the first, plus a plain snapshot of the hook state:

```typescript
state.$items((items) => items.length)((n, snapshot) => n > 0);
```

This is equivalent to composing the functions manually, but preserves reactivity through the pipeline.

> **Caveat:** The `snapshot` parameter gives you access to all hook properties at the time the source property was **written**, but the trap only re-triggers when that specific source property changes. If your derivation depends on other properties that may change independently, the snapshot can be stale. Use `computed()` for multi-source derivations.

## Multiple State Slices

For larger apps, split state into separate hooks:

```typescript
const userState = createHook({ name: "", preferences: {} });
const uiState = createHook({ theme: "light", sidebar: true });
const dataState = createHook({ items: [], loading: false });
```

This keeps concerns separate and avoids deeply nested proxies.

## Immutable Updates

Always replace arrays and objects rather than mutating them:

```typescript
// ❌ Won't trigger reactivity
state.todos.push(newTodo);

// ✅ Triggers reactivity
state.todos = [...state.todos, newTodo];

// ❌ Won't trigger reactivity
state.user.name = "New Name";

// ✅ Triggers reactivity
state.user = { ...state.user, name: "New Name" };
```

## State Initialization

Use a factory function for state initialization (especially useful for localStorage persistence):

```typescript
function createInitialState() {
  return {
    count: 0,
    user: null,
    items: [],
  };
}

const state = createHook(createInitialState());
```

## Resetting State

Store the initial state to enable reset functionality:

```typescript
const initial = { count: 0, name: "" };
const state = createHook({ ...initial });

function reset() {
  state.count = initial.count;
  state.name = initial.name;
}
```

## Side Effects with effect

For side effects that react to state changes, use `effect()`:

```typescript
import { createHook, effect } from "croft";

const state = createHook({ todos: [], filter: "all" });

effect(() => {
  // Auto-tracked — re-runs when todos or filter changes
  const filtered = state.filter === "all"
    ? state.todos
    : state.todos.filter(t => !t.completed);

  updateUI(filtered);
});
```

See the full [`effect` docs](/reactivity/effect).

## Choosing the Right Tool

| Task | Tool |
|------|------|
| Render a derived value in a template (single source) | Trap on `$` ref |
| Derivation depending on multiple properties | `computed()` |
| Expensive derivation read many times | `computed()` |
| Side effect that follows state | `effect()` |
| Observe a specific ref for changes | `watch()` |
| Multi-source inline transform in template | `computed()` — use a local variable

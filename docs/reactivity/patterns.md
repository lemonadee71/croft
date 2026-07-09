# Patterns

## Derived State

For computed values that depend on other state, use **traps** (transforms) on `$` references. These re-evaluate automatically when the source data changes:

```typescript
const state = createHook({
  todos: [],
  filter: "all",
});

// Derived values using traps
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

Use them directly in templates — they're reactive:

```typescript
html`<span>${activeCount} items left</span>`;
```

### With method forwarding

Method calls on `$` references are also reactive — they chain as transforms:

```typescript
html`<span>${state.$todos.filter(t => !t.completed).length()} items left</span>`;
```

Note that calling `length()` works because `.length` on a `$` reference returns a callable, but this is fragile — prefer a trap for getter-only properties.

```typescript
// ✅ Clear and reliable — use a trap
html`<span>${state.$todos((todos) => todos.filter(t => !t.completed).length)} items left</span>`;
```

### What NOT to do

JavaScript operators on `$` references are evaluated **immediately at render time** and are **not reactive**:

```typescript
// ❌ NOT reactive — evaluated once
state.$filter === "all"                              // returns true/false at render time, never updates
state.$todos.length > 0 ? html`...` : ""             // ternary evaluates once
state.$todos.map(todo => html`<li>...</li>`)          // .map evaluates once
```

Instead, use traps or move the logic into store properties updated with `watch`.

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

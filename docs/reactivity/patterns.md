# Patterns

## Derived State

For computed values that depend on other state, derive them in your code:

```typescript
const state = createHook({
  todos: [],
  filter: "all",
});

// Derived values — just use functions
const filteredTodos = () => {
  switch (state.filter) {
    case "active": return state.todos.filter(t => !t.completed);
    case "completed": return state.todos.filter(t => t.completed);
    default: return state.todos;
  }
};

const activeCount = () => state.todos.filter(t => !t.completed).length;
```

Since these functions read from the reactive store, they always return current values when called. Use them in templates where you need live data:

```typescript
html`<span>${activeCount()} items left</span>`;
```

However, for automatic DOM updates when the source data changes, use `$` references in the template:

```typescript
html`<span>${state.$todos.filter(t => !t.completed).length} items left</span>`;
```

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

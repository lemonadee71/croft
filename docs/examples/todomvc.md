# TodoMVC Example

This example demonstrates a full TodoMVC implementation built with Croft, showcasing:

- **createHook** for reactive todo state
- **computed()** for multi-source derived state with caching
- **html** template with reactive references and conditional rendering
- **Directives** for class toggling, conditional visibility, event handlers
- **defineComponent** for reusable UI components
- **Routing** with hash-based filter switching

<iframe src="/croft/example/index.html"
  style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 8px;"
  title="TodoMVC Example"
></iframe>

## Source Structure

```
example/
├── index.html              # HTML template (TodoMVC spec)
└── src/
    ├── main.ts             # Entry point
    ├── store.ts            # Reactive store with persistence
    ├── router.ts           # Hash-based routing
    └── components/
        ├── todo-app.ts     # Main app component
        └── todo-footer.ts  # Footer with counter/filters
```

## Store

The store uses `createHook` for raw state, `computed()` for derived values, and `watch()` for localStorage persistence:

```typescript
import { createHook, watch, computed } from "@lemonadee/croft";

const store = createHook({ todos: [], filter: "all" });

// Persistence
watch(store.$todos, (todos) => {
  localStorage.setItem("todos-croft", JSON.stringify(todos));
});

// Multi-source derived with auto-tracking and caching
export const filteredTodos = computed(() => {
  if (store.filter === "active") return store.todos.filter((t) => !t.completed);
  if (store.filter === "completed") return store.todos.filter((t) => t.completed);
  return store.todos;
});

export const allCompleted = computed(
  () => store.todos.length > 0 && store.todos.every((t) => t.completed),
);

export const hasTodos = computed(() => store.todos.length > 0);
```

Mutators are exported as plain functions — components never mutate state directly:

```typescript
export function addTodo(title: string): void {
  store.todos = [...store.todos, { id: uid(), title, completed: false }];
}

export function toggleTodo(id: string): void {
  store.todos = store.todos.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t,
  );
}
```

## Components

### todo-app

```typescript
import { store, filteredTodos, allCompleted, hasTodos, addTodo, ... } from "../store";

defineComponent("todo-app", () => {
  // Render-bound computed wraps the filter + map
  const todoItems = computed(() => filteredTodos.value.map(renderItem));

  function renderItem(todo: Todo) {
    return html`
      <li class:completed=${todo.completed} :key=${todo.id}>
        <div class="view">
          <input class="toggle" type="checkbox" checked=${todo.completed}
            onChange=${() => toggleTodo(todo.id)} />
          <label>${todo.title}</label>
          <button class="destroy" onClick=${() => destroyTodo(todo.id)}></button>
        </div>
      </li>
    `;
  }

  return html`
    <section class="main" :show=${hasTodos}>
      <input class="toggle-all" type="checkbox" checked=${allCompleted} />
      <ul class="todo-list">${todoItems}</ul>
    </section>
    <todo-footer></todo-footer>
  `;
});
```

### todo-footer

Uses `computed()` for all display values — no trap-based derivations:

```typescript
import { computed } from "@lemonadee/croft";
import { store, hasTodos, clearCompleted } from "../store";

defineComponent("todo-footer", () => {
  const activeCount = computed(
    () => store.todos.filter((t) => !t.completed).length,
  );
  const completedCount = computed(
    () => store.todos.filter((t) => t.completed).length,
  );
  const hasCompleted = computed(() => completedCount.value > 0);
  const itemLabel = computed(() => (activeCount.value === 1 ? "item" : "items"));
  const isFilterAll = computed(() => store.filter === "all");
  const isFilterActive = computed(() => store.filter === "active");
  const isFilterCompleted = computed(() => store.filter === "completed");

  return html`
    <footer class="footer" :show=${hasTodos}>
      <span class="todo-count">
        <strong>${activeCount}</strong> ${itemLabel} left
      </span>
      <ul class="filters">
        <li><a class:selected=${isFilterAll} href="#/">All</a></li>
        <li><a class:selected=${isFilterActive} href="#/active">Active</a></li>
        <li><a class:selected=${isFilterCompleted} href="#/completed">Completed</a></li>
      </ul>
      <button class="clear-completed" :show=${hasCompleted} onClick=${clearCompleted}>
        Clear completed
      </button>
    </footer>
  `;
});
```

## Key Patterns

| Requirement | Croft Feature |
|---|---|
| Conditional section visibility | `:show=${hasTodos}` — `computed()` bound directly |
| Class toggling | `class:completed=${todo.completed}` |
| Event handling | `onKeydown=${handler}`, `onDblclick=${handler}` |
| List rendering | `computed(() => filtered.value.map(renderItem))` in component body |
| Multi-source derived state | `computed()` (auto-tracks `todos` + `filter`) |
| Hash routing | `hashchange` event → `store.filter` |
| localStorage | `watch(store.$todos, ...)` |

## Live App

You can find the full source code at [example/](https://github.com/lemonadee71/croft/tree/main/example) in the repository.

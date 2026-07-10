# TodoMVC Example

This example demonstrates a full TodoMVC implementation built with Croft, showcasing:

- **createHook** for reactive todo state and localStorage persistence
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

The store uses `createHook` with immutable updates and `watch` for cross-property derived state and localStorage persistence:

```typescript
const store = createHook({
  todos: [],
  filter: "all",
  filteredTodos: [],
});

// Persistence
watch(store.$todos, saveTodos);

// Derived: recompute filteredTodos when todos or filter change
function updateFiltered(_value: any, state: Record<string, any>) {
  const { todos, filter } = state;
  if (filter === "active") store.filteredTodos = todos.filter((t) => !t.completed);
  else if (filter === "completed") store.filteredTodos = todos.filter((t) => t.completed);
  else store.filteredTodos = todos;
}
watch(store.$todos, updateFiltered);
watch(store.$filter, updateFiltered);
```

## Key Patterns

| Requirement | Croft Feature |
|---|---|
| Conditional section visibility | `:show=${hasTodos}` with a trap: `store.$todos((t) => t.length > 0)` |
| Class toggling | `class:completed=${todo.completed}` |
| Event handling | `onKeydown=${handler}`, `onDblclick=${handler}` |
| List rendering | `${store.$filteredTodos.map(todo => renderItem(todo))}` (body placement) |
| Hash routing | `hashchange` event → `store.filter` |
| localStorage | `watch(store.$todos, ...)` |

## Live App

You can find the full source code at [example/](https://github.com/lemonadee71/croft/tree/main/example) in the repository.

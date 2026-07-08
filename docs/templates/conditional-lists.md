# Conditionals & Lists

## Conditional Rendering

Use ternary expressions inside `${}` for conditional rendering:

```typescript
html`
  <div>
    ${state.$items.length > 0
      ? html`<ul>${state.$items.map(i => html`<li>${i}</li>`)}</ul>`
      : html`<p class="empty">No items</p>`
    }
  </div>
`;
```

When the condition involves a reactive reference, the content updates automatically:

```typescript
const state = createHook({ items: [] });

// Shows empty state initially
// When state.items = [...], the list appears
```

## List Rendering

Use `.map()` with `html` inside interpolations:

```typescript
const items = ["Apple", "Banana", "Cherry"];

html`
  <ul>
    ${items.map((item, index) => html`
      <li class="item-${index}">${item}</li>
    `)}
  </ul>
`;
```

## Reactive Lists

For reactive lists, use a `$` reference:

```typescript
const state = createHook({ todos: [] });

html`
  <ul>
    ${state.$todos.map(todo => html`
      <li class:completed=${todo.completed}>
        ${todo.title}
      </li>
    `)}
  </ul>
`;

// Add item — the list updates
state.todos = [...state.todos, { id: 1, title: "New", completed: false }];
```

## Filtered Lists

For filtered views, compute the filtered array in the interpolation:

```typescript
html`
  <ul>
    ${state.$todos
      .filter(t => state.filter === "all" || 
        (state.filter === "active" ? !t.completed : t.completed))
      .map(todo => html`<li>${todo.title}</li>`)}
  </ul>
`;
```

## Empty State

Combine conditionals with lists:

```typescript
html`
  ${state.$items.length === 0
    ? html`<p class="empty">No items to show</p>`
    : html`
        <ul>
          ${state.$items.map(item => html`<li>${item}</li>`)}
        </ul>
      `
  }
`;
```

## Keyed Lists

Croft does not require explicit keys. Since it maps over arrays to produce new DOM nodes on each render, keys are not needed for efficient updates. However, if you need to preserve state within list items (like input focus), you'll need to manage that yourself.

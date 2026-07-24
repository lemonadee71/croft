import { createHook, watch, computed } from "@lemonadee/croft";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export type Filter = "all" | "active" | "completed";

// ---------- Helpers ----------

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadTodos(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem("todos-croft") || "[]");
  } catch {
    return [];
  }
}

// ---------- State ----------

const initialTodos = loadTodos();

export const store = createHook({
  todos: initialTodos,
  filter: "all" as Filter,
});

// ---------- Persistence ----------

watch(store.$todos, (todos) => {
  localStorage.setItem("todos-croft", JSON.stringify(todos));
});

// ---------- Derived ----------

export const filteredTodos = computed(() => {
  if (store.filter === "active") return store.todos.filter((t) => !t.completed);
  if (store.filter === "completed") return store.todos.filter((t) => t.completed);
  return store.todos;
});

export const allCompleted = computed(
  () => store.todos.length > 0 && store.todos.every((t) => t.completed),
);

export const hasTodos = computed(() => store.todos.length > 0);

// ---------- Mutators ----------

export function addTodo(title: string): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  store.todos = [...store.todos, { id: uid(), title: trimmed, completed: false }];
}

export function toggleTodo(id: string): void {
  store.todos = store.todos.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t,
  );
}

export function destroyTodo(id: string): void {
  store.todos = store.todos.filter((t) => t.id !== id);
}

export function editTodo(id: string, title: string): void {
  const trimmed = title.trim();
  if (!trimmed) {
    destroyTodo(id);
    return;
  }
  store.todos = store.todos.map((t) =>
    t.id === id ? { ...t, title: trimmed } : t,
  );
}

export function clearCompleted(): void {
  store.todos = store.todos.filter((t) => !t.completed);
}

export function toggleAll(completed: boolean): void {
  store.todos = store.todos.map((t) => ({ ...t, completed }));
}

import { createHook, watch, type HookRef } from "croft";

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

function saveTodos(todos: Todo[]): void {
  localStorage.setItem("todos-croft", JSON.stringify(todos));
}

// ---------- State ----------

const initialTodos = loadTodos();

export const store = createHook({
  todos: initialTodos,
  filter: "all" as Filter,
  filteredTodos: initialTodos as Todo[],
});

// ---------- Persistence ----------

watch(store.$todos, saveTodos);

// ---------- Derived (cross-property: depends on both todos and filter) ----------

function updateFiltered(_value: any, state: Record<string, any>) {
  const { todos, filter } = state;
  const filtered =
    filter === "active"
      ? todos.filter((t: Todo) => !t.completed)
      : filter === "completed"
        ? todos.filter((t: Todo) => t.completed)
        : todos;
  store.filteredTodos = filtered;
}

watch(store.$todos, updateFiltered);
watch(store.$filter, updateFiltered);

// ---------- Derived (shared traps) ----------

export const allCompleted: HookRef<boolean> = store.$todos(
  (todos) => todos.length > 0 && todos.every((t) => t.completed)
);
export const hasTodos: HookRef<boolean> = store.$todos((todos) => todos.length > 0);

// ---------- Mutators ----------

export function addTodo(title: string): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  store.todos = [...store.todos, { id: uid(), title: trimmed, completed: false }];
}

export function toggleTodo(id: string): void {
  store.todos = store.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
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
  store.todos = store.todos.map((t) => (t.id === id ? { ...t, title: trimmed } : t));
}

export function clearCompleted(): void {
  store.todos = store.todos.filter((t) => !t.completed);
}

export function toggleAll(completed: boolean): void {
  store.todos = store.todos.map((t) => ({ ...t, completed }));
}

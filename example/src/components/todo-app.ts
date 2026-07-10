import { html, defineComponent } from "croft";
import {
  store,
  allCompleted,
  hasTodos,
  addTodo,
  toggleTodo,
  destroyTodo,
  editTodo,
  toggleAll,
  type Todo,
} from "../store";
import "./todo-footer";

defineComponent("todo-app", () => {
  const ENTER_KEY = 13;

  function onNewTodoKeydown(this: HTMLInputElement, e: KeyboardEvent) {
    if (e.keyCode === ENTER_KEY) {
      addTodo(this.value);
      this.value = "";
    }
  }

  function onToggleAllChange() {
    toggleAll(store.todos.some((t) => !t.completed));
  }

  function onEditStart(el: HTMLElement, todo: Todo) {
    const li = el.closest("li") as HTMLLIElement;
    if (!li) return;
    li.classList.add("editing");
    const input = li.querySelector(".edit") as HTMLInputElement;
    input.value = todo.title;
    input.focus();
    input.select();

    const ESCAPE_KEY = 27;

    function finish() {
      const val = input.value.trim();
      if (val) editTodo(todo.id, val);
      else destroyTodo(todo.id);
      li.classList.remove("editing");
      cleanup();
    }

    function cancel() {
      input.value = todo.title;
      li.classList.remove("editing");
      cleanup();
    }

    function onBlur() {
      finish();
    }

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Enter" || e.keyCode === ENTER_KEY) finish();
      else if (e.key === "Escape" || e.keyCode === ESCAPE_KEY) cancel();
    }

    function cleanup() {
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("keydown", onKeydown);
    }

    input.addEventListener("blur", onBlur);
    input.addEventListener("keydown", onKeydown);
  }

  function renderItem(todo: Todo) {
    return html`
      <li class:completed=${todo.completed} :key=${todo.id}>
        <div class="view">
          <input
            class="toggle"
            type="checkbox"
            checked=${todo.completed}
            onChange=${() => toggleTodo(todo.id)}
          />
          <label onDblclick=${(e: Event) => onEditStart(e.currentTarget as HTMLElement, todo)}
            >${todo.title}</label
          >
          <button class="destroy" onClick=${() => destroyTodo(todo.id)}></button>
        </div>
        <input class="edit" value="${todo.title}" />
      </li>
    `;
  }

  return html`
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input
          class="new-todo"
          placeholder="What needs to be done?"
          autofocus
          onKeydown=${onNewTodoKeydown}
        />
      </header>

      <section class="main" :show=${hasTodos}>
        <input
          id="toggle-all"
          class="toggle-all"
          type="checkbox"
          checked=${allCompleted}
          onChange=${onToggleAllChange}
        />
        <label for="toggle-all">Mark all as complete</label>
        <ul class="todo-list">
          ${store.$filteredTodos.map(renderItem)}
        </ul>
      </section>

      <todo-footer></todo-footer>
    </section>
  `;
});

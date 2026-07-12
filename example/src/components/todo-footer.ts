import { html, defineComponent } from "@lemonadee/croft";
import { store, hasTodos, clearCompleted } from "../store";

defineComponent("todo-footer", () => {
  const activeCount = store.$todos(
    (todos) => todos.filter((t) => !t.completed).length,
  );
  const completedCount = store.$todos(
    (todos) => todos.filter((t) => t.completed).length,
  );
  const hasCompleted = completedCount((count) => count > 0);
  const itemLabel = activeCount((count) => (count === 1 ? "item" : "items"));
  const isFilterAll = store.$filter((f) => f === "all");
  const isFilterActive = store.$filter((f) => f === "active");
  const isFilterCompleted = store.$filter((f) => f === "completed");

  return html`
    <footer class="footer" :show=${hasTodos}>
      <span class="todo-count">
        <strong>${activeCount}</strong> ${itemLabel} left
      </span>
      <ul class="filters">
        <li>
          <a class:selected=${isFilterAll} href="#/">All</a>
        </li>
        <li>
          <a class:selected=${isFilterActive} href="#/active">Active</a>
        </li>
        <li>
          <a class:selected=${isFilterCompleted} href="#/completed">Completed</a>
        </li>
      </ul>
      <button class="clear-completed" :show=${hasCompleted} onClick=${clearCompleted}>
        Clear completed
      </button>
    </footer>
  `;
});

import { html, defineComponent, computed } from "@lemonadee/croft";
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

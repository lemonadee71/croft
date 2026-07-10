import { store, type Filter } from "./store";

function getFilterFromHash(): Filter {
  const hash = location.hash.replace(/^#\/?/, "") || "all";
  if (hash === "active" || hash === "completed") return hash;
  return "all";
}

export function initRouter(): void {
  store.filter = getFilterFromHash();

  window.addEventListener("hashchange", () => {
    store.filter = getFilterFromHash();
  });
}
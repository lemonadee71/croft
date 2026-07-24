import "todomvc-app-css/index.css";
import { html, render, mount } from "@lemonadee/croft";
import { initRouter } from "./router";
import "./components/todo-app";

initRouter();

mount(render(html`<todo-app></todo-app>`), "#app");

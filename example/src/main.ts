import "todomvc-app-css/index.css";
import { html, render } from "croft";
import { initRouter } from "./router";
import "./components/todo-app";

initRouter();

render(html`<todo-app></todo-app>`, "#app");

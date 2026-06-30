import PoorManJSX, { html, render, defineComponent, removeComponent, createHook } from "../src";
import { useTestScope, screen } from "./utils";

describe("component registration", () => {
  useTestScope();

  afterEach(() => {
    removeComponent("my-counter");
    removeComponent("my-panel");
    removeComponent("my-greeting");
    removeComponent("my-avatar");
    removeComponent("my-card");
    removeComponent("my-button");
  });

  it("ignores slot attribute on regular elements outside components", () => {
    render(html`<div slot="foo" data-testid="plain">text</div>`, "body");
    const el = screen.getByTestId("plain");
    expect(el).toHaveAttribute("slot", "foo");
    expect(el).toHaveTextContent("text");
  });

  it("defines and renders a simple component", () => {
    defineComponent("my-counter", (props: any) =>
      html`<span data-testid="counter">Count: ${props.initial}</span>`
    );

    render(html`<my-counter initial="5" />`, "body");

    expect(screen.getByTestId("counter")).toHaveTextContent("Count: 5");
  });

  it("passes children to component", () => {
    defineComponent("my-panel", (props: any, slots: any) =>
      html`<div data-testid="panel" class=${props.type}>${slots.default}</div>`
    );

    render(
      html`<my-panel type="primary"><span data-testid="child">Hello</span></my-panel>`,
      "body"
    );

    expect(screen.getByTestId("panel")).toHaveClass("primary");
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("resolves placeholder attribute values from context", () => {
    defineComponent("my-greeting", (props: any) =>
      html`<p data-testid="greeting">${props.name}</p>`
    );

    const name = "World";
    render(html`<my-greeting name=${name} />`, "body");

    expect(screen.getByTestId("greeting")).toHaveTextContent("World");
  });

  it("handles nested components", () => {
    defineComponent("my-avatar", (props: any) =>
      html`<span data-testid="avatar">${props.label}</span>`
    );

    defineComponent("my-card", (_props: any, slots: any) =>
      html`<div data-testid="card">${slots.default}</div>`
    );

    render(
      html`<my-card><my-avatar label="User" /></my-card>`,
      "body"
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByTestId("avatar")).toHaveTextContent("User");
  });

  it("processes directives on component content", () => {
    defineComponent("my-button", (props: any) =>
      html`<button data-testid="btn" class=${props.kind}>${props.label}</button>`
    );

    render(html`<my-button kind="primary" label="Click" />`, "body");

    expect(screen.getByTestId("btn")).toHaveClass("primary");
    expect(screen.getByTestId("btn")).toHaveTextContent("Click");
  });
});

describe("complex component scenarios", () => {
  useTestScope();

  afterEach(() => {
    removeComponent("my-badge");
    removeComponent("my-todo-item");
    removeComponent("my-todo-list");
  });

  it("renders multiple component instances with different props", () => {
    defineComponent("my-badge", (props: any) =>
      html`<span data-testid=${"badge-" + props.id} class=${props.variant}>${props.label}</span>`
    );

    render(
      html`
        <div>
          <my-badge id="1" variant="info" label="New"></my-badge>
          <my-badge id="2" variant="warn" label="Pending"></my-badge>
          <my-badge id="3" variant="done" label="Completed"></my-badge>
        </div>
      `,
      "body"
    );

    expect(screen.getByTestId("badge-1")).toHaveClass("info");
    expect(screen.getByTestId("badge-1")).toHaveTextContent("New");
    expect(screen.getByTestId("badge-2")).toHaveClass("warn");
    expect(screen.getByTestId("badge-2")).toHaveTextContent("Pending");
    expect(screen.getByTestId("badge-3")).toHaveClass("done");
    expect(screen.getByTestId("badge-3")).toHaveTextContent("Completed");
  });

  it("applies directives (class toggle, event listener) inside component output", () => {
    const onClick = vi.fn();

    defineComponent("my-todo-item", (props: any) =>
      html`
        <li data-testid="item-${props.id}" class:[done|pending]=${props.done}>
          <span>${props.text}</span>
          <button data-testid="done-btn-${props.id}" onClick=${onClick}>Done</button>
        </li>
      `
    );

    render(
      html`
        <ul>
          <my-todo-item id="1" text="Write tests" done=${true}></my-todo-item>
          <my-todo-item id="2" text="Refactor code" done=${false}></my-todo-item>
        </ul>
      `,
      "body"
    );

    const item1 = screen.getByTestId("item-1");
    const item2 = screen.getByTestId("item-2");
    expect(item1).toHaveClass("done");
    expect(item1).not.toHaveClass("pending");
    expect(item2).toHaveClass("pending");
    expect(item2).not.toHaveClass("done");

    screen.getByTestId("done-btn-1").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders a component that internally uses other components (not just via children)", () => {
    defineComponent("my-badge", (props: any) =>
      html`<span data-testid="badge" class=${props.variant}>${props.label}</span>`
    );

    defineComponent("my-todo-list", (props: any) =>
      html`
        <div data-testid="list">
          <h3>${props.title} <my-badge variant="count" label=${props.count} /></h3>
          <ul>${props.items}</ul>
        </div>
      `
    );

    render(
      html`
        <my-todo-list
          title="Tasks"
          count=${3}
          items=${[html`<li key="a">Task A</li>`, html`<li key="b">Task B</li>`]}
        ></my-todo-list>
      `,
      "body"
    );

    expect(screen.getByTestId("list")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toHaveTextContent("3");
    expect(screen.getByTestId("list")).toHaveTextContent("Tasks");
  });

  it("passes a hook value as a component prop (static resolution) and updates on parent re-render", () => {
    const state = createHook({ name: "Alice" });

    defineComponent("my-greeting", (props: any) =>
      html`<p data-testid="greeting">Hello, ${props.name}!</p>`
    );

    const container = document.createElement("div");
    document.body.append(container);

    render(html`<my-greeting name=${state.$name}></my-greeting>`, container);

    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello, Alice!");

    state.name = "Bob";
    container.innerHTML = "";

    render(html`<my-greeting name=${state.$name}></my-greeting>`, container);

    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello, Bob!");
  });

  it("renders component children that contain directives", () => {
    const onClick = vi.fn();

    defineComponent("my-card", (_props: any, slots: any) =>
      html`<div data-testid="card">${slots.default}</div>`
    );

    render(
      html`
        <my-card>
          <button data-testid="btn" onClick=${onClick}>Action</button>
        </my-card>
      `,
      "body"
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    screen.getByTestId("btn").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("targets named slots via <slot> elements and slot attribute", () => {
    defineComponent("my-split", (_props: any, slots: any) =>
      html`
        <div data-testid="split">
          <header><slot name="header"></slot></header>
          <main><slot></slot></main>
          <footer><slot name="footer"></slot></footer>
        </div>
      `
    );

    render(
      html`
        <my-split>
          <h1 slot="header">Title</h1>
          <p>Body content</p>
          <small slot="footer">Footer note</small>
        </my-split>
      `,
      "body"
    );

    expect(screen.getByTestId("split")).toBeInTheDocument();
    expect(screen.getByTestId("split")).toContainHTML("<h1>Title</h1>");
    expect(screen.getByTestId("split")).toContainHTML("<p>Body content</p>");
    expect(screen.getByTestId("split")).toContainHTML("<small>Footer note</small>");
  });

  it("uses fallback content when no matching slot children are provided", () => {
    defineComponent("my-fallback", (_props: any, slots: any) =>
      html`
        <div data-testid="fallback">
          <slot name="header"><h1>Default Header</h1></slot>
          <slot><p>Default body</p></slot>
        </div>
      `
    );

    render(html`<my-fallback></my-fallback>`, "body");

    expect(screen.getByTestId("fallback")).toContainHTML("<h1>Default Header</h1>");
    expect(screen.getByTestId("fallback")).toContainHTML("<p>Default body</p>");
  });

  it("replaces fallback content when matching slot children exist", () => {
    defineComponent("my-fallback", (_props: any, slots: any) =>
      html`
        <div data-testid="replace">
          <slot name="header"><h1>Default Header</h1></slot>
          <slot><p>Default body</p></slot>
        </div>
      `
    );

    render(
      html`
        <my-fallback>
          <h2 slot="header">Custom Title</h2>
          <span>Custom body</span>
        </my-fallback>
      `,
      "body"
    );

    expect(screen.getByTestId("replace")).not.toContainHTML("<h1>Default Header</h1>");
    expect(screen.getByTestId("replace")).toContainHTML("<h2>Custom Title</h2>");
    expect(screen.getByTestId("replace")).not.toContainHTML("<p>Default body</p>");
    expect(screen.getByTestId("replace")).toContainHTML("<span>Custom body</span>");
  });

  it("exposes slots as the third argument for programmatic access", () => {
    defineComponent("my-inspector", (_props: any, slots: any) => {
      return html`<span data-testid="count">${slots.default ? slots.default.length : 0}</span>`;
    });

    render(html`<my-inspector><p>A</p><p>B</p></my-inspector>`, "body");

    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  it("uses slots at the component root without a wrapping element", () => {
    defineComponent("my-skinny", (_props: any, slots: any) =>
      html`<slot name="a"></slot><slot name="b"></slot>`
    );

    render(
      html`
        <my-skinny>
          <span slot="a" data-testid="a">A</span>
          <span slot="b" data-testid="b">B</span>
        </my-skinny>
      `,
      "body"
    );

    expect(screen.getByTestId("a")).toBeInTheDocument();
    expect(screen.getByTestId("b")).toBeInTheDocument();
    expect(screen.getByTestId("a")).toHaveTextContent("A");
    expect(screen.getByTestId("b")).toHaveTextContent("B");
  });

  it("processes directives on named slot children", () => {
    const onClick = vi.fn();

    defineComponent("my-actions", (_props: any, slots: any) =>
      html`<div data-testid="actions"><slot name="buttons"></slot></div>`
    );

    render(
      html`
        <my-actions>
          <button slot="buttons" data-testid="btn" onClick=${onClick}>Go</button>
        </my-actions>
      `,
      "body"
    );

    screen.getByTestId("btn").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("plugin-based component registration via mount", () => {
  useTestScope();

  afterEach(() => {
    delete (PoorManJSX as any).plugins.components;
    removeComponent("my-header");
  });

  it("registers components via PoorManJSX.mount", () => {
    PoorManJSX.mount("components", {
      "my-header": (props: any) =>
        html`<h1 data-testid="header">${props.title}</h1>`,
    });

    render(html`<my-header title="Hello" />`, "body");

    expect(screen.getByTestId("header")).toHaveTextContent("Hello");
  });
});

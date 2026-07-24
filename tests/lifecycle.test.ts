import { waitFor } from "@testing-library/dom";
import { html, render, mount } from "../src";
import { enableLifecycle, disableLifecycle } from "../src/lifecycle";
import { useTestScope, defer } from "./utils";

/**
 * Notes:
 * - With the exception of `create`, the rest needs to be tested asynchronously
 * - Due to the asynchronous nature of mutation observer, each test div has to be localized
 *   to avoid messing with other tests
 */

describe("lifecycle methods", () => {
  const onCreate = vi.fn((e: Event) => e);
  const onDestroy = vi.fn((e: Event) => e);
  const onLoad = vi.fn((e: Event) => e);
  const onMount = vi.fn((e: Event) => e);
  const onUnmount = vi.fn((e: Event) => e);

  useTestScope();

  describe("@create", () => {
    it("runs on element creation", () => {
      const div = html`<div onCreate=${onCreate}>Hello, World!</div>`;
      render(div);
      expect(onCreate).toHaveBeenCalledTimes(1);
    });

    it("runs only once", () => {
      const div = html`<div onCreate=${onCreate}>Hello, World!</div>`;
      const el = render(div);
      el.dispatchEvent(new Event("@create"));
      el.dispatchEvent(new Event("@create"));

      expect(onCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe("@destroy", () => {
    it("runs when element is destroyed", async () => {
      const div = html`<div onDestroy=${onDestroy}>Hello, World!</div>`;
      mount(render(div), "body");
      document.body.lastElementChild!.remove();
      await waitFor(() => expect(onDestroy).toHaveBeenCalledTimes(1));
    });

    it("does not run when node is moved", async () => {
      const div = html`<div onDestroy=${onDestroy}>Hello, World!</div>`;
      mount(render(div), "body");
      const el = document.body.lastElementChild!;
      const extraEl = render(html`<div></div>`).firstElementChild!;
      document.body.append(extraEl);
      extraEl.append(el);

      await waitFor(() => expect(onDestroy).not.toHaveBeenCalled());
    });

    it("fires again if node is destroyed, re-mounted, and destroyed again", async () => {
      const div = html`<div onDestroy=${onDestroy}>Hello, World!</div>`;
      mount(render(div), "body");

      const el = document.body.lastElementChild!;
      el.remove();
      await waitFor(() => expect(onDestroy).toHaveBeenCalledTimes(1));

      document.body.append(el);
      await waitFor(() => {}); // let mount settle

      el.remove();
      await waitFor(() => expect(onDestroy).toHaveBeenCalledTimes(2));
    });
  });

  describe("@load", () => {
    it("runs on mount", async () => {
      const div = html`<div onLoad=${onLoad}>Hello, World!</div>`;
      mount(render(div), "body");
      await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
    });

    it("does not run when node is moved", async () => {
      const div = html`<div onLoad=${onLoad}>Hello, World!</div>`;
      mount(render(div), "body");
      const el = document.body.lastElementChild!;
      mount(render(html`<div id="target"></div>`), "body");

      await defer(() => document.getElementById("target")!.append(el));
      await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
    });
  });

  describe("@mount", () => {
    it("runs on mount", async () => {
      const div = html`<div onMount=${onMount}>Hello, World!</div>`;
      mount(render(div), "body");
      await waitFor(() => expect(onMount).toHaveBeenCalledTimes(1));
    });

    it("runs when node is moved", async () => {
      const div = html`<div onMount=${onMount}>Hello, World!</div>`;
      mount(render(div), "body");
      const el = document.body.lastElementChild!;
      mount(render(html`<div id="target"></div>`), "body");

      await defer(() => document.getElementById("target")!.append(el));
      await waitFor(() => expect(onMount).toHaveBeenCalledTimes(2));
    });
  });

  describe("@unmount", () => {
    it("runs when element is destroyed", async () => {
      const div = html`<div onUnmount=${onUnmount}>Hello, World!</div>`;
      mount(render(div), "body");
      document.body.lastElementChild!.remove();
      await waitFor(() => expect(onUnmount).toHaveBeenCalledTimes(1));
    });

    it("runs when node is moved", async () => {
      const div = html`<div onUnmount=${onUnmount}>Hello, World!</div>`;
      mount(render(div), "body");
      const el = document.body.lastElementChild!;
      const extraEl = render(html`<div></div>`).firstElementChild!;
      document.body.append(extraEl);
      extraEl.append(el);

      await waitFor(() => expect(onUnmount).toHaveBeenCalledTimes(1));
    });
  });

  it("run recursively", () => {
    render(html`<div><div onCreate=${onCreate}>Hello, World!</div></div>`);

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("pass the element as e.target to the callback", () => {
    const fragment = render(
      html`<div onCreate=${onCreate}>Hello, World!</div>`
    ) as DocumentFragment;

    expect(onCreate.mock.results[0].value.target).toBe(fragment.firstElementChild);
  });

  it("can have multiple callbacks for a type", async () => {
    const mock = vi.fn();
    const div = html`<div onDestroy=${[onDestroy, mock] as any}>Hello, World!</div>`;

    mount(render(div), "body");
    document.body.innerHTML = "";

    await waitFor(() => {
      expect(mock).toHaveBeenCalledTimes(1);
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });
});

describe("enableLifecycle / disableLifecycle", () => {
  const onMount = vi.fn();

  beforeEach(() => {
    onMount.mockClear();
    document.body.innerHTML = "";
    disableLifecycle();
  });

  afterEach(() => {
    enableLifecycle();
  });

  it("prevents lifecycle events while disabled", async () => {
    mount(render(html`<div onMount=${onMount}>test</div>`), "body");
    await waitFor(() => expect(onMount).toHaveBeenCalledTimes(0));
  });

  it("fires lifecycle events after re-enabling", async () => {
    enableLifecycle();
    mount(render(html`<div onMount=${onMount}>test</div>`), "body");
    await waitFor(() => expect(onMount).toHaveBeenCalledTimes(1));
  });

  it("enableLifecycle is safe to call multiple times", async () => {
    enableLifecycle();
    enableLifecycle();
    mount(render(html`<div onMount=${onMount}>test</div>`), "body");
    await waitFor(() => expect(onMount).toHaveBeenCalledTimes(1));
  });
});

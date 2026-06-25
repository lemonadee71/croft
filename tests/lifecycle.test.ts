import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { html, render } from "../src";
import { defer, setup, teardown } from "./utils";

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

  beforeEach(setup);
  afterEach(teardown);

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
      const parent = render(div, "body") as HTMLElement;
      parent.firstElementChild!.remove();
      await defer(() => expect(onDestroy).toHaveBeenCalledTimes(1));
    });

    it("does not run when node is moved", async () => {
      const div = html`<div onDestroy=${onDestroy}>Hello, World!</div>`;
      const el = (render(div, "body") as HTMLElement).firstElementChild!;
      const extraEl = (render(html`<div></div>`) as DocumentFragment).firstElementChild!;
      document.body.append(extraEl);
      extraEl.append(el);

      await defer(() => expect(onDestroy).not.toHaveBeenCalled());
    });
  });

  describe("@load", () => {
    it("runs on mount", async () => {
      const div = html`<div onLoad=${onLoad}>Hello, World!</div>`;
      render(div, "body");
      await defer(() => expect(onLoad).toHaveBeenCalledTimes(1));
    });

    it("does not run when node is moved", async () => {
      const div = html`<div onLoad=${onLoad}>Hello, World!</div>`;
      const el = (render(div, "body") as HTMLElement).firstElementChild!;
      render(html`<div id="target"></div>`, "body");

      await defer(() => document.getElementById("target")!.append(el));
      await defer(() => expect(onLoad).toHaveBeenCalledTimes(1));
    });
  });

  describe("@mount", () => {
    it("runs on mount", async () => {
      const div = html`<div onMount=${onMount}>Hello, World!</div>`;
      render(div, "body");
      await defer(() => expect(onMount).toHaveBeenCalledTimes(1));
    });

    it("runs when node is moved", async () => {
      const div = html`<div onMount=${onMount}>Hello, World!</div>`;
      const el = (render(div, "body") as HTMLElement).firstElementChild!;
      render(html`<div id="target"></div>`, "body");

      await defer(() => document.getElementById("target")!.append(el));
      await defer(() => expect(onMount).toHaveBeenCalledTimes(2));
    });
  });

  describe("@unmount", () => {
    it("runs when element is destroyed", async () => {
      const div = html`<div onUnmount=${onUnmount}>Hello, World!</div>`;
      (render(div, "body") as HTMLElement).firstElementChild!.remove();
      await defer(() => expect(onUnmount).toHaveBeenCalledTimes(1));
    });

    it("runs when node is moved", async () => {
      const div = html`<div onUnmount=${onUnmount}>Hello, World!</div>`;
      const el = (render(div, "body") as HTMLElement).firstElementChild!;
      const extraEl = (render(html`<div></div>`) as DocumentFragment).firstElementChild!;
      document.body.append(extraEl);
      extraEl.append(el);

      await defer(() => expect(onUnmount).toHaveBeenCalledTimes(1));
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

    render(div, "body");
    document.body.innerHTML = "";

    await defer(() => {
      expect(mock).toHaveBeenCalledTimes(1);
      expect(onDestroy).toHaveBeenCalledTimes(1);
    });
  });
});

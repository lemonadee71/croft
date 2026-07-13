import { applyProps, html, createHook, watch, unwatch } from "../src";
import { renderToBody as render, getTarget, useTestScope } from "./utils";

useTestScope();

describe("createHook", () => {
  it("returned Proxy is sealed", () => {
    expect(() => {
      const state = createHook({ test: 1 });
      // @ts-ignore testing seal behavior
      state.prop = "test";
    }).toThrowError();
  });

  it("turns primitive argument to object", () => {
    const state = createHook("test");
    expect(state.value).toBe("test");
  });

  it("does not proxify an array", () => {
    const state = createHook([1, 2, 3]);
    expect(state.value.join()).toBe("1,2,3");
  });
});

describe("hook", () => {
  it("updates `hooked` elements when watched value changed", () => {
    const state = createHook("");
    render(html`<div data-target :text=${state.$value}></div>`);
    state.value = "Hello, World!";

    expect(getTarget()).toHaveTextContent("Hello, World!");
  });

  it("can be passed a callback", () => {
    const state = createHook("");
    const reverse = vi.fn((str: string) => str.split("").reverse().join(""));
    render(html`<div data-target :text=${state.$value(reverse)}></div>`);
    state.value = "test";

    expect(getTarget()).toHaveTextContent("tset");
  });

  it("allows calling of method directly", () => {
    const state = createHook({ tags: [] as string[] });

    render(html`
      <ul data-target>
        ${state.$tags
          .reverse()
          .map((tag: string) => `tag: ${tag}`)
          .map((tag: string) => html`<li>${tag}</li>`)}
      </ul>
    `);

    state.tags = ["bug", "enhancement"];

    expect(getTarget().childElementCount).toBe(2);
    expect(getTarget()).toContainHTML("<li>tag: enhancement</li><li>tag: bug</li>");
  });

  it("can be `hooked` to an element's attr/prop using `applyProps`", () => {
    const hook = createHook("test");
    const div = document.createElement("div");
    applyProps(div, { textContent: hook.$value });

    document.body.append(div);
    hook.value = "another test";

    expect(div).toHaveTextContent("another test");
  });

  it("can be passed to a template's body directly", () => {
    const state = createHook("world");
    render(html`<div data-target>Hello, ${state.$value}!</div>`);

    state.value = "Shin";

    expect(getTarget()).toHaveTextContent("Hello, Shin!");
  });

  it("multiple hooks can be passed to a template's body ", () => {
    const name = createHook("Michael:");
    const greeting = createHook("Howdy");
    const subject = createHook("world");

    render(html`<div data-target>${name.$value} ${greeting.$value}, ${subject.$value}!</div>`);

    subject.value = "Shin";
    greeting.value = "Hello";
    // @ts-ignore runtime dynamic type change
    name.value = html`<i>Pam:</i>` as any;

    expect(getTarget()).toHaveTextContent("Pam: Hello, Shin!");
  });

  it("can be passed as an attribute value", () => {
    const classes = createHook({ foo: false, bar: true });
    render(
      html`<div
        data-target
        class="myclass"
        class:bar=${classes.$bar}
        class:foo=${classes.$foo}
      ></div>`
    );
    classes.bar = false;
    classes.foo = true;

    expect(getTarget()).toHaveClass("myclass", "foo");
    expect(getTarget()).not.toHaveClass("bar");
  });

  it("can only be passed as sole value for attributes", () => {
    const state = createHook({ classes: "bar" });
    render(html`<div data-target class="foo ${state.$classes}"></div>`);

    expect(getTarget()).not.toHaveClass("foo");
    expect(getTarget()).toHaveClass("bar");
  });
});

describe("observers", () => {
  it("can observe hook changes with `watch`", () => {
    const mock = vi.fn();
    const count = createHook(1);
    watch(count.$value, mock);

    count.value = 5;

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(5, expect.any(Object));
  });

  it("can be removed with `unwatch`", () => {
    const mock = vi.fn();
    const count = createHook(1);

    watch(count.$value, mock);
    count.value = 5;
    unwatch(count.$value, mock);
    count.value = 10;

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(5, expect.any(Object));
  });

  it("can be removed with unsubscribe function returned by `watch`", () => {
    const mock = vi.fn();
    const count = createHook(1);

    const cleanup = watch(count.$value, mock);
    count.value = 5;
    cleanup();
    count.value = 10;

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(5, expect.any(Object));
  });
});

describe("watch second parameter (plain state)", () => {
  it("passes a plain object snapshot as the second argument", () => {
    const mock = vi.fn();
    const state = createHook({ count: 0, label: "test" });
    watch(state.$count, mock);

    state.count = 5;

    expect(mock).toHaveBeenCalledTimes(1);
    const [value, plainState] = mock.mock.calls[0];
    expect(value).toBe(5);
    expect(plainState).toEqual({ count: 5, label: "test" });
  });

  it("the plain state snapshot is not the proxy — setting a property on it does not trigger watchers", () => {
    const mock = vi.fn();
    const state = createHook({ count: 0 });
    watch(state.$count, mock);

    state.count = 1;
    const [, plainState] = mock.mock.calls[0];

    plainState.count = 99;
    // The proxy wasn't touched — no extra calls
    expect(mock).toHaveBeenCalledTimes(1);
    expect(state.count).toBe(1);
  });

  it("contains all properties of the hook at the moment the callback fires", () => {
    const mock = vi.fn();
    const state = createHook({ a: 1, b: 2, c: 3 });
    watch(state.$a, mock);

    state.a = 10;
    state.b = 20;

    // Only one change to 'a' — b was updated after
    expect(mock).toHaveBeenCalledTimes(1);
    const [, plainState] = mock.mock.calls[0];
    expect(plainState).toEqual({ a: 10, b: 2, c: 3 });
  });

  it("works with primitive hooks", () => {
    const mock = vi.fn();
    const hook = createHook(10);
    watch(hook.$value, mock);

    hook.value = 20;

    const [, plainState] = mock.mock.calls[0];
    expect(plainState).toEqual({ value: 20 });
  });

  it("works with array hooks", () => {
    const mock = vi.fn();
    const hook = createHook([1, 2, 3]);
    watch(hook.$value, mock);

    hook.value = [4, 5, 6];

    const [, plainState] = mock.mock.calls[0];
    expect(plainState).toEqual({ value: [4, 5, 6] });
  });
});

describe("HookRef transform second parameter (plain state)", () => {
  it("passes a plain state snapshot to the trap callback", () => {
    const state = createHook({ items: ["a", "b"], count: 0 });
    const transform = vi.fn((items: string[], _state: any) => items.length);

    // Using the trap in a template — transforms are resolved on render
    render(html`<div data-target>:text=${state.$items(transform)}</div>`);

    expect(transform).toHaveBeenCalledTimes(1);
    const [value, plainState] = transform.mock.calls[0];
    expect(value).toEqual(["a", "b"]);
    expect(plainState).toEqual({ items: ["a", "b"], count: 0 });
  });

  it("the plain state in a trap is not a proxy", () => {
    const state = createHook({ count: 0, label: "hi" });
    let capturedState: any;
    render(
      html`<div data-target>
        :text=${state.$label((label, s) => {
          capturedState = s;
          return label;
        })}
      </div>`
    );

    capturedState.label = "modified";
    expect(state.label).toBe("hi"); // original unchanged
    expect("label" in capturedState).toBe(true);
  });

  it("the trap fires again on change and receives updated plain state", () => {
    const state = createHook({ items: ["a"], count: 0 });
    const transform = vi.fn((items: string[], _state: any) => items.length);
    render(html`<div data-target>:text=${state.$items(transform)}</div>`);

    expect(transform).toHaveBeenCalledTimes(1);

    state.items = ["a", "b", "c"];

    expect(transform).toHaveBeenCalledTimes(2);
    const [, plainState] = transform.mock.calls[1];
    expect(plainState).toEqual({ items: ["a", "b", "c"], count: 0 });
  });

  it("supports chaining traps (trap on a trap result)", () => {
    const state = createHook({ items: ["a", "b", "c"], count: 0 });
    const length = state.$items((items: string[]) => items.length);
    const isLong = length((n: number) => n > 2);

    // Verify the chained trap data structure
    expect((isLong as any).data.prop).toBe("items");
    expect(typeof (isLong as any).data.transform).toBe("function");

    // Resolve manually to verify correct transform composition
    const resolved = (isLong as any).data.transform((isLong as any).data.value);
    expect(resolved).toBe(true);

    render(html`<div data-target :text=${isLong}></div>`);
    expect(getTarget()).toHaveTextContent("true");

    state.items = ["a"];
    expect(getTarget()).toHaveTextContent("false");
  });

  it("chained trap receives plain state as second argument", () => {
    const state = createHook({ items: ["x"], count: 10 });
    const double = vi.fn((items: string[]) => items.length);
    const check = vi.fn((n: number, s: any) => {
      expect(s.count).toBe(10);
      return n > 0;
    });

    const result = state.$items(double)(check);

    render(html`<div data-target :text=${result}></div>`);

    expect(double).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledTimes(1);
    expect(getTarget()).toHaveTextContent("true");
  });
});

describe("method forwarding", () => {
  it("supports primitive string method forwarding", () => {
    const state = createHook("hello world");
    render(html`<div data-target>${state.$value.toUpperCase()}</div>`);

    expect(getTarget()).toHaveTextContent("HELLO WORLD");

    state.value = "hello world";
    expect(getTarget()).toHaveTextContent("HELLO WORLD");
  });

  it("supports chaining method forwards", () => {
    const state = createHook("  hello world  ");
    render(html`<div data-target>${state.$value.trim().toUpperCase()}</div>`);

    expect(getTarget()).toHaveTextContent("HELLO WORLD");

    state.value = "  croft  ";
    expect(getTarget()).toHaveTextContent("CROFT");
  });

  it("handles method arguments correctly", () => {
    const state = createHook("foo-bar-baz");
    render(html`<div data-target>${state.$value.replaceAll("-", " ")}</div>`);

    expect(getTarget()).toHaveTextContent("foo bar baz");

    state.value = "a-b-c";
    expect(getTarget()).toHaveTextContent("a b c");
  });

  it("does not mutate the underlying state value", () => {
    const state = createHook("abc");
    const forwarded = state.$value.toUpperCase();

    expect(state.value).toBe("abc");
    // @ts-ignore forwarded is HookRef at runtime
    expect((forwarded as any).data.value).toBe("abc");
  });
});

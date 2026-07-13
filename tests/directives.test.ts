import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEvent, fireEvent } from "@testing-library/dom";
import { applyProps, html, createHook, modifyElement } from "../src";
import { getTarget as target, renderToBody as render, setup, teardown, screen } from "./utils";

const fn = vi.fn(() => true);

beforeEach(setup);
afterEach(teardown);

describe("on", () => {
  const anotherFn = vi.fn();
  const Button = (callback: any, options: string[] = []) => {
    const optionString = options.length ? `.${options.join(".")}` : "";

    return html` <button data-target onClick${optionString}=${callback}>Click me!</button> `;
  };

  it("accepts an object of { event: fn | fn[] }", () => {
    const fns = { click: fn, keydown: anotherFn };

    render(html`<div data-target on=${fns}></div>`);
    fireEvent.click(target());
    fireEvent.keyDown(target());

    expect(fn).toHaveBeenCalledTimes(1);
    expect(anotherFn).toHaveBeenCalledTimes(1);
  });

  it("on[event] - adds event listener of type `event`", () => {
    render(Button(fn));
    fireEvent.click(target());

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("on[event] - allows multiple listeners to be attached to `event`", () => {
    render(Button([fn, anotherFn]));
    fireEvent.click(target());
    fireEvent.click(target());

    expect(fn).toHaveBeenCalledTimes(2);
    expect(anotherFn).toHaveBeenCalledTimes(2);
  });

  it("on[event] is case insensitive", () => {
    render(html`<button data-target oncLiCK=${fn}>Click me!</button>`);
    fireEvent.click(target());

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("on[event].option - allows listeners to be attached with option/s", () => {
    render(Button(fn, ["once", "prevent"]));

    const myEvent = createEvent.click(target());
    myEvent.preventDefault = vi.fn();

    fireEvent(target(), myEvent);
    fireEvent(target(), myEvent);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(myEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("on[event].option - allows multiple listeners to be attached with option/s", () => {
    render(Button([fn, anotherFn], ["once"]));
    fireEvent.click(target());
    fireEvent.click(target());

    expect(fn).toHaveBeenCalledTimes(1);
    expect(anotherFn).toHaveBeenCalledTimes(1);
  });
});

describe("class", () => {
  it("accepts an object of { className: boolean } (shortcut for multiple class:name)", () => {
    render(html`<div data-target class=${{ hidden: true, visible: false }}>Test</div>`);

    expect(target()).toHaveClass("hidden");
    expect(target()).not.toHaveClass("visible");
  });

  it("accepts an array of acceptable values (string, object)", () => {
    render(html`<div data-target class=${["flex flex-col", { visible: true }]}>Test</div>`);

    expect(target()).toHaveClass("flex flex-col visible");
  });

  it("class:name - toggles a single className", () => {
    render(html`<div class:hidden="true" class:visible="false" data-target>Test</div>`);

    expect(target()).toHaveClass("hidden");
    expect(target()).not.toHaveClass("visible");
  });

  it("class:[name,] - toggles multiple class names at once", () => {
    render(html`<div class:[flex,flex-col]="true" data-target>Test</div>`);

    expect(target()).toHaveClass("flex flex-col");
  });

  it("class:[name1,|name2,] - switches between class/es", () => {
    render(html`<div class:[hidden|visible]="true" data-target>Test</div>`);

    const element = target();
    const firstState = element.cloneNode() as HTMLElement;
    applyProps(element, { "class:[hidden|visible]": false });

    expect(firstState).toHaveClass("hidden");
    expect(target()).toHaveClass("visible");
  });
});

describe("style", () => {
  it("accepts an object (shortcut for multiple style:prop)", () => {
    const style = {
      color: "red",
      "background-color": "blue",
    };

    render(html`<div style=${style} data-target>Test</div>`);

    expect(target()).toHaveStyle({
      color: "rgb(255, 0, 0)",
      "background-color": "rgb(0, 0, 255)",
    });
  });

  it("accepts an object that have camelCase keys instead of kebab-case", () => {
    const style = {
      color: "red",
      fontSize: "14px",
      backgroundColor: "blue",
    };

    render(html`<div style=${style} data-target>Test</div>`);

    expect(target()).toHaveStyle({
      color: "rgb(255, 0, 0)",
      "font-size": "14px",
      "background-color": "rgb(0, 0, 255)",
    });
  });

  it("style:prop - sets a style property individually", () => {
    render(html`<div data-target style:color="red" style:background-color="blue"></div>`);

    expect(target()).toHaveStyle({
      color: "rgb(255, 0, 0)",
      "background-color": "rgb(0, 0, 255)",
    });
  });
});

describe("toggle", () => {
  it("toggle:attr - shows/hides an attribute depending on value", () => {
    render(html`<div data-target toggle:data-visible="undefined">Test</div>`);

    expect(target()).not.toHaveAttribute("data-visible");
  });

  it("toggle:attr.preserve - make the attr value same as passed value", () => {
    render(html`<div data-target toggle:data-visible.preserve="true">Test</div>`);

    expect(target()).toHaveAttribute("data-visible", "true");
  });

  it("toggle:attr.mirror - make the attr value same as attr name", () => {
    render(html`<div data-target readonly.mirror="test">Test</div>`);

    expect(target()).toHaveAttribute("readonly", "readonly");
  });

  it("toggle:[attr,] - show/hide multiple attributes at once", () => {
    render(html`<div data-target toggle:[data-selected,data-drag]="false">Test</div>`);

    expect(target()).not.toHaveAttribute("data-selected");
    expect(target()).not.toHaveAttribute("data-drag");
  });
});

describe(":children", () => {
  it("accepts a string", () => {
    render(html`<div data-target :children=${"Test"}></div>`);

    expect(target()).toHaveTextContent("Test");
  });

  it("accepts a Node", () => {
    render(html`<div data-target :children=${document.createTextNode("Test")}></div>`);

    expect(target()).toHaveTextContent("Test");
  });

  it("accepts a Template", () => {
    render(html`<div :children=${html`<p data-target>Test</p>`}></div>`);

    expect(target()).toHaveTextContent("Test");
  });

  it("accepts an array of string, Node, and Template", () => {
    const div = document.createElement("div");
    const children = ["This is ", html`<span data-testid="span">my component</span>`, div];

    render(html`<div data-target :children=${children}></div>`);

    expect(target()).toContainElement(div);
    expect(screen.getByTestId("span")).toBeInTheDocument();
  });

  it("filters out null, undefined, and boolean values", () => {
    render(html`<div data-target :children=${[true, false, null, undefined] as any}></div>`);

    expect(target()).toHaveTextContent("");
  });

  it("overrides existing children of the element", () => {
    render(
      html`<div data-target :children=${["This is a new paragraph"]}>
        <p>This is a paragraph</p>
      </div>`
    );

    expect(target().childElementCount).toBe(0);
    expect(target()).toHaveTextContent("This is a new paragraph");
  });
});

describe(":text", () => {
  it("sets the textContent of the element", () => {
    render(html`<div :text="Test"></div>`);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});

describe(":html", () => {
  it("sets the innerHTML of the element", () => {
    const str = '<p data-testid="p">Test</p>';
    render(html`<div :html="${str}"></div>`);

    expect(screen.getByTestId("p")).toHaveTextContent("Test");
  });
});

describe(":ref", () => {
  it("stores a reference to the element", () => {
    const ref: any = {};
    render(html`<div :ref=${ref} data-target>Test</div>`);

    expect(target()).toEqual(ref.current);
  });

  it("can use a custom key instead of `current`", () => {
    const ref: any = {};
    render(html`<div :ref=${["self", ref] as any} data-target>Test</div>`);

    expect(target()).toEqual(ref.self);
  });
});

describe(":show", () => {
  it("shows/hides element based on attribute value by changing display", () => {
    render(html`<div style="display: block" :show=${false} data-target></div>`);

    expect(target()).toHaveStyle({ display: "none" });
  });
});

describe(":visible", () => {
  it("toggles element's visibility based on attribute value", () => {
    render(html`<div :visible=${false} data-target></div>`);

    expect(target()).toHaveStyle({
      visibility: "hidden",
    });
  });
});

describe("directives robustness", () => {
  it("combines static classes, class object, and class:name directives correctly", () => {
    const isError = createHook(false);
    render(
      html`<div
        class="base-class"
        class=${{ active: true }}
        class:error=${isError.$value}
        data-target
      ></div>`
    );

    expect(target()).toHaveClass("base-class", "active");
    expect(target()).not.toHaveClass("error");

    isError.value = true;
    expect(target()).toHaveClass("base-class", "active", "error");
  });

  it("handles toggle of multiple attributes at once", () => {
    const isLocked = createHook(true);
    render(html`<input data-target toggle:[disabled,readonly]=${isLocked.$value} />`);

    expect(target()).toHaveAttribute("disabled", "");
    expect(target()).toHaveAttribute("readonly", "");

    isLocked.value = false;
    expect(target()).not.toHaveAttribute("disabled");
    expect(target()).not.toHaveAttribute("readonly");
  });
});

describe(":key", () => {
  it("sets the key metadata from a direct value", () => {
    render(html`<div :key="item-1" data-target></div>`);
    // @ts-ignore __meta is dynamically set
    expect(target().__meta?.key).toBe("item-1");
  });

  it("references another attribute value with $ prefix", () => {
    render(html`<div data-id="abc" :key="$data-id" data-target></div>`);
    // @ts-ignore __meta is dynamically set
    expect(target().__meta?.key).toBe("abc");
  });

  it("works via applyProps with _key", () => {
    const div = document.createElement("div");
    applyProps(div, { _key: "from-props" });
    // @ts-ignore __meta is dynamically set
    expect(div.__meta?.key).toBe("from-props");
  });
});

describe("modifyElement", () => {
  it("sets an attribute with type attr", () => {
    const div = document.createElement("div");
    modifyElement(div, "attr", { key: "data-foo", value: "bar" });
    expect(div.getAttribute("data-foo")).toBe("bar");
  });

  it("sets text content with type text", () => {
    const div = document.createElement("div");
    modifyElement(div, "text", { key: undefined, value: "hello" });
    expect(div.textContent).toBe("hello");
  });

  it("applies a style prop with type style:prop", () => {
    const div = document.createElement("div");
    modifyElement(div, "style:prop", { key: "color", value: "red" });
    expect(div.style.color).toBe("red");
  });

  it("accepts a string selector with context", () => {
    const parent = document.createElement("div");
    parent.innerHTML = '<span data-testid="inner"></span>';
    modifyElement("span", "attr", { key: "data-foo", value: "bar" }, parent);
    expect(parent.querySelector("span")?.getAttribute("data-foo")).toBe("bar");
  });

  it("returns the element after applying the directive", () => {
    const div = document.createElement("div");
    const result = modifyElement(div, "attr", { key: "data-foo", value: "bar" });
    expect(result).toBe(div);
  });

  it("adds a class via type class:name", () => {
    const div = document.createElement("div");
    modifyElement(div, "class:name", { key: "active", value: true });
    expect(div.classList.contains("active")).toBe(true);
  });
});

describe("skip", () => {
  it("prevents directive processing on the element itself", () => {
    const state = createHook("should not appear");
    render(html`<div data-target :skip :text=${state.$value}></div>`);
    expect(target()).toHaveTextContent("");
  });

  it("prevents directive processing on descendants", () => {
    const state = createHook("should not appear");
    render(html`<div :skip><div data-target :text=${state.$value}></div></div>`);
    expect(target()).toHaveTextContent("");
  });

  it("prevents body interpolation in the subtree", () => {
    const state = createHook("should not appear");
    render(html`<div :skip><div data-target>${state.$value}</div></div>`);
    expect(target().textContent).not.toContain("should not appear");
  });

  it("works via object key syntax", () => {
    const state = createHook("should not appear");
    render(html`<div data-target ${{ _skip: true }} :text=${state.$value}></div>`);
    expect(target()).toHaveTextContent("");
  });
});

describe(":model", () => {
  it("sets input value from a static string", () => {
    render(html`<input data-target :model="hello" />`);
    expect(target()).toHaveValue("hello");
  });

  it("sets input value from applyProps", () => {
    const input = document.createElement("input");
    applyProps(input, { model: "static" });
    expect(input).toHaveValue("static");
  });

  it("sets initial value from hook and syncs on input event", () => {
    const state = createHook({ name: "initial" });
    render(html`<input data-target :model=${state.$name} />`);
    expect(target()).toHaveValue("initial");

    const input = target() as HTMLInputElement;
    input.value = "updated";
    fireEvent.input(input);
    expect(state.name).toBe("updated");
  });

  it("updates input value when hook changes", () => {
    const state = createHook({ name: "start" });
    render(html`<input data-target :model=${state.$name} />`);
    expect(target()).toHaveValue("start");

    state.name = "changed";
    expect(target()).toHaveValue("changed");
  });

  it("works with textarea elements", () => {
    const state = createHook({ body: "text" });
    render(html`<textarea data-target :model=${state.$body}></textarea>`);
    expect(target()).toHaveValue("text");

    state.body = "new text";
    expect(target()).toHaveValue("new text");

    const textarea = target() as HTMLTextAreaElement;
    textarea.value = "typed";
    fireEvent.input(textarea);
    expect(state.body).toBe("typed");
  });
});

import PoorManJSX, { applyProps, html, render } from "../src";
import { screen } from "./utils";

describe("runBeforeCreate", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("process template string before creation", () => {
    const fn = vi.fn((str: string) => str.replace(/x-/g, "data-"));

    PoorManJSX.onLifecycle("beforeCreate", fn);
    render(html`<div x-testid="preprocessed"></div>`, "body");

    expect(fn).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("preprocessed")).toBeInTheDocument();
  });
});

describe("addDirective", () => {
  const directive = {
    type: "autosize",
    callback: (element: HTMLElement, _: any, modify: any) => {
      modify(element, "attr", { key: "data-autosize", value: "true" });
      element.removeAttribute(":autosize");
    },
  };
  const attrName = (str: string) => str === ":autosize" && str;
  const objKey = (str: string) => str === "autosize" && str;

  const runAssertions = (id: string | number = "") => {
    expect(screen.getByTestId(`autosize${id}`)).not.toHaveAttribute(":autosize");
    expect(screen.getByTestId(`autosize${id}`)).toHaveAttribute("data-autosize", "true");
  };

  afterEach(() => {
    PoorManJSX.removeDirective("autosize");
    document.body.innerHTML = "";
  });

  it("allow users to add their own directive", () => {
    PoorManJSX.addDirective({
      ...directive,
      match: attrName,
    });

    render(html`<div :autosize data-testid="autosize"></div>`, "body");

    runAssertions();
  });

  it("allow different keys for attrName and objKey", () => {
    PoorManJSX.addDirective({
      ...directive,
      match: { attrName, objKey },
    });

    render(
      html`<div data-testid="autosize1"></div>
        <div :autosize data-testid="autosize2"></div>`,
      "body"
    );
    applyProps(screen.getByTestId("autosize1"), { autosize: true });

    runAssertions(1);
    runAssertions(2);
  });

  it("uses strict equality if `predicate` is not provided", () => {
    PoorManJSX.addDirective(directive);

    render(html`<div autosize data-testid="autosize"></div>`, "body");

    runAssertions();
  });
});

describe("PoorManJSX.mount", () => {
  afterEach(() => {
    delete (PoorManJSX as any).plugins.testPlugin;
  });

  it("stores plugin config in plugins", () => {
    PoorManJSX.mount("testPlugin", { version: "1.0" });
    expect((PoorManJSX as any).plugins.testPlugin).toEqual({ version: "1.0" });
  });

  it("executes _init function during mount", () => {
    const init = vi.fn();
    PoorManJSX.mount("testPlugin", { _init: init, value: 42 });
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("strips _init from stored plugin config", () => {
    PoorManJSX.mount("testPlugin", { _init: vi.fn(), value: 42 });
    expect((PoorManJSX as any).plugins.testPlugin).toEqual({ value: 42 });
  });

  it("throws when mounting a duplicate plugin name", () => {
    PoorManJSX.mount("testPlugin", {});
    expect(() => PoorManJSX.mount("testPlugin", {})).toThrowError("is already taken");
  });
});

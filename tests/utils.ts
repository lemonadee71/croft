import { screen } from "@testing-library/dom";
import PoorManJSX, { render, mount } from "../src";
import { enableLifecycle, disableLifecycle } from "../src/lifecycle";

export const defer = (fn: () => void): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      try {
        fn();
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
};

export const renderToBody = (template: any) => mount(render(template), "body");

export const getTarget = () => screen.getByTestId("target");

const toTestId = (str: string) => str.replace(/data-target/g, 'data-testid="target"');

export const setup = () => {
  PoorManJSX.onLifecycle("beforeCreate", toTestId);
  enableLifecycle();
};

export const teardown = () => {
  disableLifecycle();
  PoorManJSX.removeLifecycle("beforeCreate", toTestId);
  document.body.innerHTML = "";
  vi.clearAllMocks();
};

/** Call in a describe block to set up and tear down the test environment automatically. */
export const useTestScope = () => {
  beforeEach(setup);
  afterEach(teardown);
};

export { screen };

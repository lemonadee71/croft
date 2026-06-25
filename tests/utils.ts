import { expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { screen } from "@testing-library/dom";
import PoorManJSX, { render } from "../src";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers as any);

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

export const renderToBody = (template: any) => render(template, "body");

export const getTarget = () => screen.getByTestId("target");

export const getById = (testid: string) => screen.getByTestId(testid);

const defaultTestId = (str: string) => str.replace(/data-target/g, 'data-testid="target"');

export const setup = () => {
  PoorManJSX.onBeforeCreate(defaultTestId);
};

export const teardown = () => {
  PoorManJSX.removeBeforeCreate(defaultTestId);
  document.body.innerHTML = "";
  vi.clearAllMocks();
};
export { vi };
export { screen };

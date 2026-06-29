import "@testing-library/jest-dom";

declare module "vitest" {
  interface Assertion {
    toHaveClass(...names: string[]): void;
    toHaveStyle(css: Record<string, any> | string): void;
    toHaveAttribute(attr: string, value?: string): void;
    toHaveTextContent(text: string | RegExp): void;
    toContainElement(element: HTMLElement | null): void;
    toBeInTheDocument(): void;
  }
}

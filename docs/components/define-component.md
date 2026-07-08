# defineComponent

Register a custom HTML element that renders a template when encountered in the DOM.

## Signature

```typescript
function defineComponent<P extends Record<string, any>>(
  tagName: string,
  renderer: ComponentRenderer<P>,
): void

type ComponentRenderer<P> = (
  props: P,
  slots: Record<string, Node[]>,
) => Template
```

## Basic Component

```typescript
import { defineComponent, html } from "croft";

defineComponent("my-greeting", (props, slots) => {
  return html`<h1>Hello, ${props.name}!</h1>`;
});
```

## Usage in Templates

```typescript
html`<my-greeting name="World"></my-greeting>`;
// Renders: <h1>Hello, World!</h1>
```

## Typed Props

```typescript
interface ButtonProps {
  variant: string;
  label: string;
}

defineComponent<ButtonProps>("my-button", (props, slots) => {
  return html`
    <button class="btn btn-${props.variant}">
      ${slots.default?.length ? slots.default : props.label}
    </button>
  `;
});
```

## Plugin Mount

Components can also be registered in groups via the plugin mount system:

```typescript
import Croft from "croft";

Croft.mount("components", {
  "my-button": (props: any) =>
    html`<button class=${props.variant}>${props.label}</button>`,
  "my-badge": (props: any) =>
    html`<span class=${props.variant}>${props.label}</span>`,
});
```

## removeComponent

```typescript
import { removeComponent } from "croft";

removeComponent("my-greeting");
```

## How It Works

1. `resolveComponents` walks the DOM top-down, finding registered custom elements.
2. Attributes are collected and resolved into a props object.
3. Child nodes are extracted and bucketed into named slots.
4. Slot children are processed through directives and component resolution.
5. The render function is called with `(props, slots)`.
6. The returned Template is compiled and replaces the custom element.

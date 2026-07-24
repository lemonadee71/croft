# html Tag

The `html` tagged template literal is the primary way to create Croft templates.

## Signature

```typescript
function html(fragments: TemplateStringsArray, ...values: any[]): Template
```

Returns a `Template` object that can be passed to `render()`.

## Basic Syntax

```typescript
import { html } from "@lemonadee/croft";

const template = html`
  <div class="container">
    <h1>Hello, World!</h1>
  </div>
`;
```

## Interpolation

Values are interpolated with `${}`:

```typescript
const name = "Croft";
html`<h1>Hello, ${name}!</h1>`;
```

## Reactive Interpolation

When you interpolate a reactive reference (`$` property from `createHook`), the DOM node updates automatically when the value changes:

```typescript
const state = createHook({ name: "World" });

html`<h1>Hello, ${state.$name}!</h1>`;

state.name = "Croft"; // DOM updates to: Hello, Croft!
```

## Nested Templates

You can nest `html` calls inside interpolations:

```typescript
const items = ["a", "b", "c"];

html`
  <ul>
    ${items.map((item) => html`<li>${item}</li>`)}
  </ul>
`;
```

Nested templates are efficiently merged into the parent fragment — no wrapper elements are created.

## Expressions

Any JavaScript expression can be used in interpolation:

```typescript
html`
  <div class="${isActive ? "active" : "inactive"}">
    ${count > 0 ? `${count} items` : "No items"}
  </div>
`;
```

However, for reactive expressions, use reactive references:

```typescript
html`
  <div>${state.$count > 0 ? "Has items" : "Empty"}</div>
`;
```

## Whitespace Handling

Croft preserves whitespace from template literals. Text nodes consisting only of whitespace between elements are automatically stripped from component slots but are preserved in text interpolation positions.

## Limitations

- Template literals must be valid HTML fragments. They cannot contain `<html>`, `<head>`, or `<body>` tags.
- Self-closing tags for non-void elements (like `<div />`) are not supported by the HTML parser.

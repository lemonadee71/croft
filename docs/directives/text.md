# text

Sets an element's `textContent`. Safe against XSS — HTML is not parsed.

## Syntax

```typescript
html`<div :text=${value}></div>`
// or
applyProps(element, { textContent: value });
```

## Example

```typescript
const message = "Hello, <b>World</b>";

html`<div :text=${message}></div>`;
// Renders: <div>Hello, &lt;b&gt;World&lt;/b&gt;</div>
```

This is safer than using `${message}` in text position (which also escapes) or `:html` (which does not).

## vs Interpolation

Both `:text` and `${}` interpolation set text content, but `:text` is explicit about the attribute and useful in property object contexts.

```typescript
// These are equivalent
html`<div :text=${value}></div>`;
html`<div>${value}</div>`;
```

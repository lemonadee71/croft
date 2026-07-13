# Directives Overview

Directives customize element behavior during hydration. They are defined by attribute names prefixed with `:` or by property object keys.

## Two Syntaxes

All directives can be used two ways:

### HTML Attribute Syntax

```typescript
html`<div :text=${value}></div>`
```

### Property Object Syntax

```typescript
const element = createElement("div");
applyProps(element, { textContent: value });
```

Both forms resolve through the same directive registry.

## How Directives Match

When `resolveAttributes` runs, it:

1. Iterates all attributes on each element.
2. For each attribute, checks the directive registry for a match.
3. If matched, runs the directive's callback with the element and value.
4. Removes the directive attribute from the element (so it doesn't appear in the final DOM).

## Built-in Directives

| Syntax | Property Key | Purpose |
|---|---|---|
| `:text=${val}` | `textContent` | Sets text content (safe) |
| `:html=${val}` | `innerHTML` / `html` | Sets inner HTML (unsafe) |
| `class=${val}` | `class` | Manages classes (string, array, object) |
| `class:name=${bool}` | `class:name` | Toggles a single class |
| `class:[a,b]="${bool}"` | `class:[a,b]` | Toggles multiple classes at once |
| `class:[a\|b]="${bool}"` | `class:[a\|b]` | Toggles between two classes |
| `style=${val}` | `style` | Sets styles (string or object) |
| `style:prop=${val}` | `style:prop` | Sets a single CSS property |
| `attr=${val}` | `attr` | Toggles a native boolean attribute |
| `toggle:attr=${val}` | `toggle:attr` | Toggles any attribute (custom, data-*, etc.) |
| `toggle:[a,b]="${val}"` | `toggle:[a,b]` | Toggles multiple attributes at once |
| `toggle:attr.opt=${val}` | `toggle:attr.opt` | With `.mirror` or `.preserve` option |
| `:children=${val}` | `children` | Replaces element children |
| `:ref=${obj}` | `_ref` | Captures element reference |
| `:key=${val}` | `_key` | Sets tracking key for the element |
| `:skip` | `_skip` | Skips directive processing on subtree |
| `:show=${val}` | `_show` | Toggles `display: none` |
| `:visible=${val}` | `_visible` | Toggles `visibility: hidden` |
| `onEvent=${fn}` | `onEvent` | Event handler (+ modifiers) |
| `on={...}` | `on` | Object-map of event handlers |
| `:model=${val}` | `model` | Two-way value binding on inputs |

## Value Resolution

Directive values are resolved from the template's context. If a value is a reactive reference, some directives set up automatic watchers to update the element when the value changes.

## Custom Directives

You can add custom directives for application-specific behaviors:

```typescript
Croft.addDirective({
  type: "tooltip",
  match: ":tooltip",
  callback: (element, { value }) => {
    element.setAttribute("title", value);
  },
});
```

See [Custom Directives](/directives/custom-directives) for details.

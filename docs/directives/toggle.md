# toggle

Toggles the presence of attributes based on truthy/falsy values.

## Syntax

```typescript
// Boolean attributes work directly (no toggle: prefix needed)
html`<input disabled=${isDisabled} />`
html`<input checked=${isChecked} />`

// Non-boolean attributes need the toggle: prefix
html`<div toggle:data-active=${isActive}></div>`

// Property object
applyProps(element, { disabled: true });
applyProps(element, { "toggle:data-active": true });
```

## Boolean Attributes

These attributes are recognized natively — no `toggle:` prefix needed:

`disabled`, `checked`, `hidden`, `readonly`, `required`, `selected`, `open`, `allowfullscreen`, `autofocus`, `autoplay`, `async`, `defer`, `formnovalidate`, `ismap`, `itemscope`, `loop`, `multiple`, `muted`, `nomodule`, `novalidate`, `playsinline`, `truespeed`, `typemustmatch`, `controls`, `default`

```typescript
html`<input disabled=${isDisabled} />`
// truthy → <input disabled="">
// falsy  → <input>
```

## Non-Boolean Attributes

For custom attributes like `data-*` or `aria-*`, use the `toggle:` prefix:

```typescript
html`<div toggle:data-selected=${isSelected}></div>`
```

## Multiple Attributes

Wrap comma-separated names in `[]` brackets:

```typescript
html`<input toggle:[disabled,readonly]="${isLocked}" />`

// isLocked = true  → <input disabled="" readonly="">
// isLocked = false → <input>
```

## Options

Append a dot after the attribute name (or inside `[]` before the closing bracket):

### `.preserve`

Use the value as-is instead of an empty string:

```typescript
html`<div toggle:data-value.preserve=${value} />`
// value = "hello" → <div data-value="hello">
// value = ""      → <div> (attribute removed)
```

### `.mirror`

Set the attribute value to match the attribute name:

```typescript
html`<div readonly.mirror=${true} />`
// → <div readonly="readonly">
```

## vs Direct Attribute

```typescript
// This sets the attribute to the string "false" — always present!
html`<input disabled=${false} />`

// This correctly removes the attribute when false
html`<input disabled=${false} />` // wait, this also works!
```

Actually, for boolean attributes recognized by HTML, Croft automatically removes them when the value is falsy. The `toggle:` prefix is only needed for **custom attributes** (like `data-*`, `aria-*`) that aren't in the built-in boolean list.

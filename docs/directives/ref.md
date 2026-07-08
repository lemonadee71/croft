# ref

Captures a reference to a DOM element so you can interact with it imperatively.

## Syntax

```typescript
html`<div :ref=${myRef}></div>`

// Property object
applyProps(element, { _ref: myRef });
```

## Example

```typescript
import { createHook } from "croft";

const inputRef = { current: null as HTMLInputElement | null };

html`<input :ref=${inputRef} />`;

// Later, access the element
inputRef.current?.focus();
```

The `ref` object receives the element during hydration. The `current` property is set when the element is created and cleared if the element is removed.

## Use Cases

- Focusing an input on mount
- Measuring element dimensions
- Integrating with third-party libraries that need a DOM node reference
- Managing scroll position

# class

Manages element classes with string, array, or object values.

## Syntax

```typescript
// String
html`<div class=${className}></div>`

// Conditional classes
html`<div class:active=${isActive} class:hidden=${isHidden}></div>`

// Property object
applyProps(element, { class: "foo bar" });
applyProps(element, { "class:active": true });
```

## String Value

```typescript
const classes = "btn btn-primary";

html`<button class=${classes}>Click</button>`;
```

## Conditional Class Toggle

The `class:name` syntax conditionally toggles a single class:

```typescript
const state = createHook({ isActive: false });

html`
  <div class:active=${state.$isActive} class:highlighted=${true}>
    Content
  </div>
`;

state.isActive = true; // Adds "active" class
```

## Toggle Multiple Classes

Separate class names with `,` inside `[]` to toggle them all at once:

```typescript
html`
  <div class:[active,visible]="${isActive}">
    Content
  </div>
`;

// isActive = true  → class="active visible"
// isActive = false → classes removed
```

## Toggle Between Two Classes

Use `|` inside `[]` to toggle between two classes — the first is added when the value is truthy, the second when falsy:

```typescript
html`
  <div class:[active|inactive]="${isActive}">
    Content
  </div>
`;

// isActive = true  → class="active"   (inactive removed)
// isActive = false → class="inactive" (active removed)
```

## Reactive Toggle Examples

```typescript
const state = createHook({ isOpen: false });

html`<div class:[open|closed]="${state.$isOpen}">Panel</div>`;
state.isOpen = true;  // class becomes "open"
state.isOpen = false; // class becomes "closed"
```

## Object Value

```typescript
const classObj = { active: true, disabled: false, highlighted: true };

html`<div class=${classObj}></div>`;
// Renders: <div class="active highlighted"></div>
```

## Array Value

```typescript
const baseClasses = ["btn", "btn-primary"];
const extraClasses = ["shadow", "rounded"];

html`<button class=${[...baseClasses, ...extraClasses]}>Click</button>`;
```

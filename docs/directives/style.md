# style

Sets element styles via string or object values.

## Syntax

```typescript
// String
html`<div style=${styleString}></div>`

// Object
html`<div style=${{ color: "red", fontSize: "14px" }}></div>`

// Individual property
html`<div style:color=${color} style:font-size=${size}></div>`

// Property object
applyProps(element, { style: { color: "red" } });
applyProps(element, { "style:color": "red" });
```

## String Value

```typescript
html`<div style="color: red; font-size: 14px"></div>`;
```

## Object Value

CamelCase or kebab-case property names are both accepted:

```typescript
html`<div style=${{ backgroundColor: "blue", fontSize: "16px" }}></div>`;
// or
html`<div style=${{ "background-color": "blue", "font-size": "16px" }}></div>`;
```

## Individual Style Properties

Set a single style property with `style:prop`:

```typescript
const state = createHook({ color: "red" });

html`<div style:color=${state.$color}>Colored text</div>`;

state.color = "blue"; // Updates inline style
```

This is useful for reactive individual style updates without managing a full style object.

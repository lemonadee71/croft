# Custom Directives

Extend Croft with application-specific directives.

## addDirective

```typescript
Croft.addDirective({
  type: string,
  match?: string | Function | { attrName: string, objKey: string },
  callback: (element: Element, data: { value: any, key: string }) => void,
});
```

## Simple Custom Directive

```typescript
import Croft from "@lemonadee/croft";

Croft.addDirective({
  type: "tooltip",
  match: ":tooltip",
  callback: (element, { value }) => {
    element.setAttribute("title", value);
    element.classList.add("has-tooltip");
  },
});

// Usage:
html`<span :tooltip="Helpful information">Hover me</span>`;
```

## Match Patterns

The `match` field determines when the directive is invoked:

| Form | Behavior |
|---|---|
| Omitted | Matches `type` as both attribute name and property key |
| `match: ":foo"` | Matches attribute `:foo` and property key `foo` |
| `match: (key) => key.endsWith("foo")` | Custom predicate function |
| `match: { attrName: ":foo", objKey: "foo" }` | Separate matchers per syntax |

### Predicate Function

```typescript
Croft.addDirective({
  type: "uppercase",
  match: (key) => key.startsWith(":uppercase"),
  callback: (element, { value }) => {
    element.textContent = String(value).toUpperCase();
  },
});
```

### Separate Matchers

```typescript
Croft.addDirective({
  type: "my-attr",
  match: {
    attrName: ":my-attr",
    objKey: "myAttr",
  },
  callback: (element, { value }) => {
    element.dataset.myAttr = String(value);
  },
});
```

## removeDirective

```typescript
Croft.removeDirective("directive-type");
```

## Callback Data

The callback receives:

| Property | Description |
|---|---|
| `value` | The resolved value from the template |
| `key` | The matched attribute/key name |
| `type` | The directive type |
| `element` | The DOM element |

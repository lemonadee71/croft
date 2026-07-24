# API Reference

## Core

### `html`

```typescript
function html(fragments: TemplateStringsArray, ...values: any[]): Template
```

Creates a template from a tagged template literal.

### `render`

```typescript
function render(template: Template): DocumentFragment
```

Compiles a template into a `DocumentFragment`. Pure function — no side effects.

### `mount`

```typescript
function mount(fragment: DocumentFragment, target: string | HTMLElement): void
```

Appends a rendered `DocumentFragment` to a DOM target. Separated from `render` to keep creation side-effect-free.

### `createElementFromTemplate`

```typescript
function createElementFromTemplate(template: Template): DocumentFragment
```

Compiles a template to a DocumentFragment without mounting.

### `processDirectives`

```typescript
function processDirectives(root: ParentNode, context: Record<string, any>): void
```

Applies directive resolution to a DOM tree.

### `applyProps`

```typescript
function applyProps(element: Element, props: Record<string, any>): void
```

Applies property values to an element through the directive system.

### `modifyElement`

```typescript
function modifyElement(
  element: Element,
  attributes: Record<string, any>,
  context: Record<string, any>,
): Element
```

Modifies an element with attributes and context.

## Reactivity

### `createHook`

```typescript
function createHook<T extends Record<string, any>>(initial: T): Hook<T>
```

Creates a reactive state container.

### `watch`

```typescript
function watch<T>(ref: HookRef<T>, callback: (value: T, state: Record<string, any>) => void): () => void
```

Observes a reactive reference for changes. The callback receives the new value and a plain snapshot of all hook properties.

### `unwatch`

```typescript
function unwatch<T>(ref: HookRef<T>, callback: (value: T, state: Record<string, any>) => void): void
```

Removes a watcher from a reactive reference.

### `computed`

```typescript
function computed<T>(getter: () => T): ComputedRef<T>
```

Creates a derived reactive value. The getter is evaluated lazily — only on first `.value` read. Dependencies are auto-tracked. The result is cached until a dependency changes. Works in templates and with `watch()`.

### `effect`

```typescript
function effect(fn: () => void): () => void
```

Runs a function immediately and re-runs it automatically whenever its reactive dependencies change. Dependencies are tracked during execution (no explicit dep arrays). Each run re-collects dependencies, handling dynamic branching. Returns a disposer function.

## Components

### `defineComponent`

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

Registers a custom component.

### `removeComponent`

```typescript
function removeComponent(tagName: string): void
```

Unregisters a custom component.

## Directives

### `addDirective`

```typescript
Croft.addDirective(config: {
  type: string;
  match?: string | Function | { attrName: string; objKey: string };
  callback: (element: Element, data: { value: any; key: string }) => void;
}): void
```

Registers a custom directive.

### `removeDirective`

```typescript
Croft.removeDirective(type: string): void
```

Removes a custom directive.

## Lifecycles

### `onLifecycle`

```typescript
Croft.onLifecycle(
  stage: "beforeCreate" | "afterCreate" | "beforeHydrate" | "afterHydrate",
  ...callbacks: Function[]
): void
```

Registers callbacks for a pipeline stage.

### `removeLifecycle`

```typescript
Croft.removeLifecycle(
  stage: "beforeCreate" | "afterCreate" | "beforeHydrate" | "afterHydrate",
  callback: Function,
): void
```

Removes a callback from a pipeline stage.

### `runLifecycle`

```typescript
Croft.runLifecycle(stage: string, ...args: any[]): any
```

Runs all callbacks for a pipeline stage.

### `enableLifecycle`

```typescript
Croft.enableLifecycle(): void
```

Enables DOM MutationObserver lifecycles.

### `disableLifecycle`

```typescript
Croft.disableLifecycle(): void
```

Disables DOM MutationObserver lifecycles.

## Plugin System

### `Croft.mount`

```typescript
Croft.mount(name: string, config: Record<string, any>): void
```

Mounts a plugin configuration.

### `Croft.plugins`

```typescript
Croft.plugins: Record<string, any>
```

Access all mounted plugin configurations.

## Utilities

Available via `Croft.utils`:

| Function | Description |
|---|---|
| `uid()` | Generate unique ID |
| `hash(value)` | Hash a value |
| `getPlaceholderId(value)` | Get placeholder ID for a value |
| `escapeHTML(str)` | Escape HTML entities |
| `unescapeHTML(str)` | Unescape HTML entities |
| `setMetadata(obj, key, value)` | Set metadata on an object |
| `isPlainObject(val)` | Check if plain object |
| `isNullOrUndefined(val)` | Check null/undefined |
| `isObject(val)` | Check if object |
| `isFunction(val)` | Check if function |
| `isString(val)` | Check if string |
| `isNumber(val)` | Check if number |
| `isArray(val)` | Check if array |
| `isNode(val)` | Check if DOM Node |
| `isTextNode(val)` | Check if Text node |
| `isElement(val)` | Check if Element |
| `isSVG(val)` | Check if SVG element |
| `isFragment(val)` | Check if DocumentFragment |
| `isTemplate(val)` | Check if Template |
| `isPlaceholder(val)` | Check if placeholder |
| `isTruthy(val)` | Truthy check |
| `isHook(val)` | Check if hook reference |

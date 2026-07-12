# AGENTS.md — Croft (`@lemonadee/croft`)

## Overview

pnpm workspace (3 projects): root library, `docs/`, `example/`. Library entry: `src/index.ts`.
Published as `@lemonadee/croft`. Built via Vite lib mode (`dist/index.js`) + `tsc --emitDeclarationOnly` (`dist/index.d.ts`).

## Commands

| Command | Action |
|---|---|
| `pnpm test` | Run all tests (vitest, jsdom) |
| `pnpm build` | Vite build + type declarations |
| `pnpm lint` | oxlint `src tests` |
| `pnpm format` | oxfmt `src tests` |
| `pnpm dev` | Run docs + example dev servers concurrently |
| `pnpm docs:build` | Build library → example → copy to docs/public → build vitepress |
| `pnpm docs:prebuild` | Just the prep steps (library + example + copy) without vitepress |
| `pnpm changeset` | Create a changeset for the next release |
| `pnpm version-packages` | Consume changesets and bump versions + changelog |
| `pnpm release` | Publish current version to npm (runs `changeset publish`) |

Always run `pnpm format && pnpm lint` after making code changes.

## Testing quirks

- jsdom environment with `@testing-library/jest-dom` matchers
- Globals enabled (`describe`, `it`, `expect`, `vi`)
- Helper at `tests/utils.ts`: `renderToBody`, `getTarget`
- `<div data-target>` convention used in tests for assertions
- Filter tests: `pnpm test -- --testNamePattern "pattern"`

## Architecture

- **createHook** → ES6 Proxy-based reactive state with pub/sub — `docs/reactivity/create-hook.md`
- **`$`-prefixed access** on hook state returns a `HookRef` (callable proxy) — `docs/reactivity/create-hook.md`
- **Traps** (`store.$prop(fn)`) — transform the value reactively; `isHook()` detects these — `docs/reactivity/create-hook.md#traps--transforms`
- **methodForwarder** — `.map()`, `.filter()`, `.toUpperCase()` on `$` refs chain as transforms — `docs/reactivity/method-forwarding.md`
- **Chaining** — trap results are callable: `store.$items((i) => i.length)((n) => n > 2)`
- **`html`** tagged template → `Template` object with placeholder IDs — `docs/templates/html-tag.md`
- **`render`** → parses template, runs pipeline (`resolveBody` → `resolveAttributes` → components) — `docs/templates/render.md`
- **Pipeline** — the full resolve chain order — `docs/pipeline.md`
- **Directives** — `:text`, `:html`, `:show`, `:children`, `class:`, `style:`, `on*` events, etc. — `docs/directives/overview.md`
- **Components** — `defineComponent("tag-name", (props, slots) => Template)` — `docs/components/define-component.md`
- **Lifecycles** — `onCreate`, `onMount`, `onUnmount`, `onDestroy` via MutationObserver — `docs/lifecycles/dom-lifecycles.md`
- **Markers** — comment nodes (`data-key`) track hook boundaries — `docs/directives/children.md`
- `isHook()` check: looks for `Symbol.for("peasant-jsx:hook-target")` on value — `docs/reactivity/create-hook.md`
- `watch()` / `unwatch()` — programmatic subscription to hook property changes — `docs/reactivity/watch.md`
- **Reactivity patterns** — `docs/reactivity/patterns.md`
- **Slots** — template insertion in components — `docs/components/slots.md`
- **Conditional rendering & lists** — `docs/templates/conditional-lists.md`

## CI

- **Auto Changeset** (PR labeled `patch`/`minor`/`major`/`dependencies`): auto-generates a changeset file and commits it to the PR branch. Re-labeling overwrites the existing changeset. `dependencies` maps to `patch`. Changeset description = PR title + PR body.
- **Release** (push `main`): test → `changesets/action@v1` — creates "Version Packages" PR when changesets present, or publishes when PR is merged. Uses OIDC Trusted Publishing (no npm token). Package must be configured as a trusted publisher on npmjs.com. npm upgraded to latest in CI for OIDC support.
- **Deploy Docs** (push `main` or `workflow_dispatch`): build example + vitepress → GitHub Pages at `/croft/`

## Conventions

- **Conventional Commits** — `fix:` → patch, `feat:` → minor, `BREAKING CHANGE:` → major
- **Formatter**: oxfmt (double quotes, trailing commas es5, printWidth 100, semicolons)
- **Does NOT use** automatic formatting on save or pre-commit hooks

## Gotchas

- `docs/public/example/` is gitignored; `docs:prebuild` creates it. Use `pnpm docs:build` for the full pipeline.
- `docs:build` copies `CHANGELOG.md` from root into `docs/` (only if file exists — created by changesets post-first-release).
- Example app aliases `@lemonadee/croft` → `../src/index.ts` (livesource during dev).
- CSS imports: example uses `todomvc-app-css` (npm package).
- `.main` section visibility in TodoMVC uses `:show` directive with a `hasTodos` trap.

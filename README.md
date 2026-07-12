# Croft 🌾

A lightweight, decoupled, native DOM reactive templating engine.

[![CI](https://github.com/lemonadee71/croft/actions/workflows/release.yml/badge.svg)](https://github.com/lemonadee71/croft/actions/workflows/release.yml)

→ **[Full documentation](https://lemonadee71.github.io/croft/)**

---

## Quick Start

```bashpa
npm install croft
```

```typescript
import { html, render, createHook } from "croft";

const state = createHook({ count: 0, items: ["Apple", "Banana"] });

render(html`
  <h1>Counter: ${state.$count}</h1>
  <button onClick=${() => state.count++}>Increment</button>
  <ul>${state.$items.map((item) => html`<li>${item}</li>`)}</ul>
`, "body");
```

---

## Development

### Setup

```bash
git clone <repo>
pnpm install
```

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run docs + example dev servers concurrently |
| `pnpm test` | Run tests |
| `pnpm build` | Build library (vite + types) |
| `pnpm lint` | Lint source |
| `pnpm format` | Format source |
| `pnpm docs:build` | Build docs site (includes example) |

### Project Structure

```
src/          — Library source
example/      — TodoMVC example app
docs/         — VitePress documentation site
tests/        — Vitest test suite
```

### Commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org/). The release workflow automatically versions and publishes based on commit messages.

### CI

| Workflow | Trigger | What it does |
|---|---|---|
| **Release** | Push to `main` | Runs tests, builds, publishespa to npm, creates GitHub Release + CHANGELOG |
| **Deploy Docs** | Push to `main` | Builds example + docs and deploys to GitHub Pages |

### Publishing

A new version is published automatically by the Release workflow. To trigger a release, push commits with the appropriate conventional commit prefixes (`fix:` for patch, `feat:` for minor, `BREAKING CHANGE:` for major).

Manual publish: `pnpm publish` (requires npm token).

---

## License

MIT

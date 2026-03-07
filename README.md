# PassPhoto

Australian passport photo cropping tool. Crop, preview and export photos to Australian passport spec (35x45mm). Guides show correct face position. Works offline — nothing is uploaded.

Deployed at https://miridius.github.io/passphoto/

## Getting Started

```sh
bun install
bun dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server |
| `bun run build` | Production build (static site → `build/`) |
| `bun run preview` | Preview production build |
| `bun test` | Unit tests (Vitest) |
| `bun test:e2e` | E2E tests (Playwright) |
| `bun run check` | Svelte/TypeScript type checking |

## Stack

- **Runtime**: Bun
- **Framework**: SvelteKit with Svelte 5 runes (`$state`, `$derived`)
- **Styling**: scoped `<style>` blocks, plain CSS (no Tailwind)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Build**: Vite → static adapter → GitHub Pages

## Testing

- **Unit tests** (`bun test`): state logic, pure functions, spec data
- **E2E tests** (`bun test:e2e`): UI interactions, visual regressions, layout assertions

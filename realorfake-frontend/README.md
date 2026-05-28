# RealOrFake — Frontend

AI-generated image detector — Next.js 14 frontend that consumes the FastAPI backend.

## Live demo

> Deploy URL goes here after Vercel setup. Screenshot to be added.

## Quickstart

```bash
# Prerequisites: Node 20 LTS, pnpm
pnpm install
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_BASE_URL
pnpm dev
# App runs at http://localhost:3000
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | — | FastAPI backend URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | No | `he` | Default locale (`he` or `en`) |
| `NEXT_PUBLIC_MAX_UPLOAD_MB` | No | `10` | Max upload size in MB |
| `NEXT_PUBLIC_ALLOWED_MIME` | No | `image/jpeg,image/png,image/webp` | Allowed MIME types |
| `NEXT_PUBLIC_GA_ID` | No | `""` | Google Analytics ID (leave blank to disable) |

## Architecture

```
Browser (Next.js 14)
     │
     │  HTTP fetch (JSON / FormData)
     ▼
FastAPI backend (Python)
     │
     │  PyTorch inference
     ▼
ViT-B/16 model checkpoint
     │
     └── Grad-CAM heatmap generation
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server at localhost:3000 |
| `pnpm build` | Production build |
| `pnpm start` | Start production server on port 3000 |
| `pnpm lint` | ESLint check |
| `pnpm typecheck` | TypeScript strict check (`tsc --noEmit`) |
| `pnpm test` | Run Vitest test suite |
| `pnpm test:watch` | Watch mode for tests |
| `pnpm format` | Prettier formatter |

## Tests

```bash
pnpm test
pnpm test --coverage   # with coverage report (target: ≥70% on detector + hooks)
```

Tests use Vitest + Testing Library + MSW for API mocking.

## Course requirements mapping

| Requirement | Implementation |
|---|---|
| User interaction (upload / capture / button) | Drag-and-drop, click-to-upload, URL paste, mobile camera capture via `<input capture>` |
| Working app with basic UI | Three pages: landing (`/`), detector (`/detect`), model info (`/model`) |
| Display of model results | Verdict card, confidence bar, Grad-CAM overlay, probability table |
| Demonstrable in class | Public Vercel URL + sample images bundled in `/public/samples` |

## Project structure

```
app/              # Next.js 14 App Router pages
components/
  ui/             # shadcn/ui components
  detector/       # Image detection UI
  model/          # Model info charts
  layout/         # Header, Footer, Nav
  shared/         # Reusable shared components
lib/
  api/            # API client + typed functions
  hooks/          # React Query hooks
  store/          # Zustand detection store
  i18n/           # Hebrew + English strings
  utils/          # cn, format, image, validation
  config/         # Zod-validated env
tests/            # Vitest + MSW tests
public/samples/   # Sample images for gallery
```

## License

MIT © 2025 Adir Shlomov

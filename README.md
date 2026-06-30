# hv-review — HomeVision Document Review

A take-home project implementing the Document Review page for HomeVision's mortgage document workflow. Reviewers can inspect AI-identified issues in uploaded PDFs, navigate between pages, filter issues by severity, and submit once all critical and major issues are resolved.

---

## Quick start

```bash
npm install
npm run dev        # starts at http://localhost:5173
```

Open `http://localhost:5173` and click **Open demo review**.

**Live demo:** [https://hv-review.vercel.app](https://hv-review.vercel.app) — automatically deploys on every push to `main` via Vercel.

> **Demo PDF:** The sample file is at `public/example_document.pdf`. The mock API returns that path as `pdf_url`; in production it would be a CDN URL. `DocumentViewer` accepts any URL and needs no changes.

---

## Scripts

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Starts the Vite dev server with HMR           |
| `npm run build`        | Type-checks and builds the production bundle  |
| `npm run typecheck`    | Runs TypeScript across all project references |
| `npm run lint`         | Runs ESLint on all source files               |
| `npm run lint:fix`     | Runs ESLint with auto-fix                     |
| `npm run format`       | Formats all files with Prettier               |
| `npm run format:check` | Checks Prettier formatting (used in CI)       |
| `npm run test`         | Runs the Vitest test suite once               |
| `npm run test:watch`   | Runs Vitest in watch mode                     |
| `npm run preview`      | Serves the production build locally           |

CI runs `typecheck → lint → format:check → test → build` on every push and PR to `main`.

---

## Tech stack

| Layer         | Choice                         | Why                                                        |
| ------------- | ------------------------------ | ---------------------------------------------------------- |
| Build         | Vite                           | Fast HMR, native ESM, no SSR overhead needed               |
| UI            | React 19 + TypeScript (strict) | Component model, native document metadata hoisting         |
| Styling       | CSS custom properties          | Design tokens, zero runtime cost, easy dark mode           |
| Data fetching | @tanstack/react-query          | Loading/error states, caching, same interface as real API  |
| Shared state  | Zustand                        | Sibling state without prop drilling or Context boilerplate |
| PDF rendering | react-pdf (pdfjs-dist)         | Text layer = native CMD+F, programmatic page control       |
| Testing       | Vitest + Testing Library       | Native to Vite, fast, no Jest config overhead              |
| Linting       | ESLint + Prettier              | Enforced on commit (Husky + lint-staged) and in CI         |
| Commit style  | Conventional Commits           | Enforced by commitlint                                     |

---

## Project structure

```
src/
├── api/                   # Data layer — swap mock data for real fetch calls
│   ├── review.ts          # getReview(), submitReview()
│   ├── types.ts           # Shared TypeScript types
│   └── mock/review.json   # Mock data (spec-provided)
│
├── features/review/       # Everything for the Review page
│   ├── __tests__/         # Pure unit tests (submission logic)
│   ├── lib/               # Pure helpers (submission gating)
│   ├── schemas/           # Zod prop schemas for runtime component validation
│   ├── components/
│   │   ├── DocumentViewer/  # PDF viewer: zoom, drag-to-scroll, lazy pages
│   │   ├── IssuesPanel/     # Issue list with severity filter tabs
│   │   ├── IssueCard/       # Individual issue (navigate + ignore)
│   │   ├── ReviewError/     # Domain error state
│   │   ├── ReviewSkeleton/  # Layout-specific loading skeleton
│   │   ├── StatusBadge/     # Critical / Major / Minor badge
│   │   └── SubmitBar/       # Header: doc name, step indicator, actions
│   ├── hooks/useReview.ts   # React Query hooks
│   └── store/reviewStore.ts # Zustand: currentPage, ignoredIssues, activeMobileTab
│
├── pages/
│   ├── HomePage.tsx         # Landing page with link to demo review
│   ├── ReviewPage.tsx       # Route component — composes feature components
│   └── ComingSoonPage.tsx   # Placeholder for other routes
│
├── shared/
│   └── components/
│       ├── ErrorState/      # Generic reusable error component
│       └── ThemeToggle/     # Light/dark toggle (reads/writes DOM + localStorage)
│
└── styles/
    ├── tokens.css           # All design tokens as CSS variables
    └── global.css           # Layout, components, utilities
```

---

## User flows

**Review**

1. Open `/reviews/:id` — fetches review data, renders PDF + issue list side by side.
2. Click an issue → scrolls to that page and highlights the card (on mobile, switches to the Document tab).
3. Critical/Major issues block submission; Minor issues can be ignored individually.
4. When all blocking issues are cleared, Submit becomes active.

**Filters** — tabs narrow the issue list; the submission gate always counts the full unfiltered list.

**Mobile** — single-panel layout with a bottom tab bar; Issues tab shows a blocking-count badge.

---

## Key features

| Area         | Highlights                                                                             |
| ------------ | -------------------------------------------------------------------------------------- |
| PDF viewer   | CMD+F text layer, lazy page mounting, zoom (50–200%), drag-to-scroll, page navigation  |
| Issues panel | Grouped by severity, filter tabs, ignore for minor issues                              |
| Header       | Step indicator, blocked submit (`aria-disabled`), theme toggle (OS default, persisted) |

---

## Routing

```
/                        → Home page (demo review link)
/reviews/:id             → Review page
/upload                  → Coming soon
/processing/:id          → Coming soon
/reviews/:id/submitted   → Coming soon
```

---

## Mock API

`src/api/review.ts` exports `getReview()` and `submitReview()` with simulated latency (600 ms / 800 ms). The mock validates the review ID and returns data only for the demo review (`souj5sd12c8a3f`); unknown IDs throw a typed `ApiError` with a `NOT_FOUND` code. Errors are mapped to user-facing copy via `getApiErrorMessage()` in `src/api/errors.ts`.

### API Contract

All shapes are defined as Zod schemas in `src/api/schemas.ts` and inferred at compile time in `src/api/types.ts`. Runtime validation runs on every `getReview()` call — schema drift is caught immediately.

**`GET /reviews/:id`** → `Review`

```ts
{
  id: string
  name: string
  version: number
  status: 'created' | 'processing' | 'on_review' | 'submitted'
  uploaded_at: string // ISO 8601
  user: {
    id: string
    first_name: string
    last_name: string
  }
  document: {
    pdf_url: string // CDN or local path
    pages: Array<{ page_num: number; height: number; width: number }>
  }
  issues: Array<{
    id: string
    title: string
    description: string
    severity: 'critical' | 'major' | 'minor'
    page: number
  }>
}
```

**`POST /reviews/:id/submit`** → `204 No Content`

No request body. Returns 204 on success; the client treats any non-2xx as an error and surfaces it via the error state in `useSubmitReview`.

---

## Theme

Defaults to the OS preference (`prefers-color-scheme`). If the user has previously toggled it, their choice is saved in `localStorage` and applied before first paint (no flash). The toggle button (Sun/Moon) is in the top-right of the header.

---

## Testing

```bash
npm run test           # single run
npm run test:watch     # interactive watch mode
```

**Strategy:** pure logic → components → accessibility. No e2e (out of scope; would use Playwright in production).

| File                      | What it covers                                                |
| ------------------------- | ------------------------------------------------------------- |
| `submissionLogic.test.ts` | Gating rules: blocking severities, ignored issues, edge cases |
| `IssueCard.test.tsx`      | Render, navigation, ignore/unignore, keyboard                 |
| `IssuesPanel.test.tsx`    | Severity filters, empty state                                 |
| `SubmitBar.test.tsx`      | `aria-disabled` gating, blocking message, submit action       |
| `DocumentViewer.test.tsx` | Toolbar controls, page navigation, zoom, page wrapper count   |
| `StatusBadge.test.tsx`    | WCAG 1.4.1 — severity via text, not color alone               |
| `review.test.ts`          | Mock API: valid ID, not-found, typed ApiError codes           |
| `errors.test.ts`          | ApiError code mapping to user-facing messages                 |

---

## CI

GitHub Actions runs on every push and PR to `main`:

1. `typecheck` — `tsc -b --noEmit`
2. `lint` — ESLint
3. `format:check` — Prettier
4. `test` — Vitest
5. `build` — `vite build`

---

## Design

[`docs/design.html`](docs/design.html) — open in a browser. Contains annotated wireframes for the desktop and mobile layouts, plus a table of key design decisions and the alternatives considered (PDF rendering strategy, mobile navigation pattern, submission blocking, accessibility approach).

---

## Architecture notes

Full architectural reasoning — stack choices, PDF text layer, mobile tabs, production gaps — in [`docs/PLAN.md`](docs/PLAN.md).

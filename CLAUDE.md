# CLAUDE.md — hv-review

Context for AI assistants working on this codebase.

## What this is

A take-home project for HomeVision (Senior Frontend Engineer). It implements the Document Review page of a mortgage document workflow. Reviewers see AI-identified issues in an uploaded PDF and can submit once all critical/major issues are resolved.

See `docs/PLAN.md` for full architectural decisions and tradeoffs.

## Stack

- **Vite + React 19 + TypeScript** (strict mode — no `any`, no implicit types)
- **CSS custom properties** — all design tokens in `src/styles/tokens.css`, no Tailwind in practice
- **Zustand** — shared state between sibling components
- **@tanstack/react-query** — data fetching and server state
- **react-pdf (pdfjs-dist)** — PDF rendering with text layer for CMD+F
- **Vitest + @testing-library/react** — tests
- **ESLint + Prettier + Husky** — enforced on commit and in CI

## Folder structure

```
src/
├── api/               # getReview(), submitReview() — mock today, real API tomorrow
├── features/review/   # All Review page code (components, hooks, store, tests)
├── pages/             # Route-level components (thin, compose features)
├── shared/            # Reusable across features (ErrorState, ThemeToggle)
├── lib/               # Utilities (cn.ts, auth.ts)
└── styles/            # tokens.css + global.css
```

## Conventions

- **Feature-based architecture** — code lives next to what it's for. `features/review/` owns everything for the review page.
- **Components** use the `ComponentName/ComponentName.tsx` pattern with co-located tests (`ComponentName.test.tsx`).
- **Commits** follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- **No prop drilling** — if siblings need shared state, it goes in Zustand.
- **No `any`** — TypeScript strict mode is enforced.
- **Accessibility** — WCAG 2.1 AA. Use `aria-disabled` not just `disabled`, communicate severity via text+icon not color alone.

## State management

| State             | Where       | Notes                                       |
| ----------------- | ----------- | ------------------------------------------- |
| Review data       | React Query | Via `useReview(id)` and `useSubmitReview()` |
| Current PDF page  | Zustand     | `reviewStore.currentPage`                   |
| Ignored issues    | Zustand     | `reviewStore.ignoredIssues` (Set<string>)   |
| Active mobile tab | Zustand     | `reviewStore.activeMobileTab`               |
| PDF zoom          | useState    | Local to DocumentViewer                     |
| Issue filter      | useState    | Local to IssuesPanel                        |

## API layer

`src/api/review.ts` — never call `fetch` from components. All data goes through this layer. The mock adds artificial delay to simulate real network behavior.

To switch to a real API: replace the function bodies in `review.ts`. Types, hooks, and components don't change.

## Routing

```
/                  → HomePage (link to demo review)
/reviews/:id       → ReviewPage
/upload            → ComingSoonPage
/processing/:id    → ComingSoonPage
/reviews/:id/submitted → ComingSoonPage
```

## Running

```bash
npm install
npm run dev          # dev server
npm run test         # tests
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
```

## Key implementation notes

- **PDF text layer**: `renderTextLayer={true}` on `<Page>` makes DOM text elements exist for CMD+F. The worker runs off-thread via `public/pdf.worker.min.mjs`.
- **Horizontal scroll at zoom**: `.document-viewer` uses `align-items: flex-start` (not center) so overflow goes right-only. `.document-viewer__document` uses `margin: 0 auto` to center when content fits.
- **Drag-to-scroll**: mousedown/mousemove/mouseup handlers on `.document-viewer` — same pattern as Figma.
- **Theme**: Set on `<html data-theme="...">` before React mounts (in main.tsx) to avoid FOUC. Toggle writes to DOM + localStorage.
- **React 19 title hoisting**: Native `<title>` elements in components are hoisted to `<head>` automatically. No need for react-helmet-async.
- **Mobile tab switch**: When user clicks an issue, `IssueCard` calls `setActiveMobileTab('document')` directly from Zustand — no prop drilling through IssuesPanel.

## CI

GitHub Actions (`.github/workflows/ci.yml`): typecheck → lint → format:check → test → build.
Pre-commit: Husky + lint-staged runs ESLint + Prettier on staged files only.

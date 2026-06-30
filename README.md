# hv-review — HomeVision Document Review

A take-home project implementing the Document Review page for HomeVision's mortgage document workflow. Reviewers can inspect AI-identified issues in uploaded PDFs, navigate between pages, filter issues by severity, and submit once all critical and major issues are resolved.

---

## Quick start

```bash
npm install
npm run dev        # starts at http://localhost:5173
```

Open `http://localhost:5173` and click **Open demo review**.

> **Note:** there is no live deploy — the demo PDF (`public/example_document.pdf`) is served by the local Vite dev server. The `dev` server must be running for the viewer to load it. In production, `pdf_url` in the API response would point to a CDN URL; the viewer component doesn't change.

---

## Scripts

| Command                | What it does                         |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Dev server with HMR                  |
| `npm run build`        | Type-check + production bundle       |
| `npm run typecheck`    | `tsc --noEmit` only (no emit)        |
| `npm run lint`         | ESLint across all source files       |
| `npm run lint:fix`     | ESLint with auto-fix                 |
| `npm run format`       | Prettier write                       |
| `npm run format:check` | Prettier check (used in CI)          |
| `npm run test`         | Vitest single run                    |
| `npm run test:watch`   | Vitest interactive watch mode        |
| `npm run preview`      | Preview the production build locally |

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
├── api/                   # Data layer — swap mock bodies for real fetch calls
│   ├── review.ts          # getReview(), submitReview()
│   ├── types.ts           # Shared TypeScript types
│   └── mock/review.json   # Mock data (spec-provided)
│
├── features/review/       # Everything for the Review page
│   ├── __tests__/         # Pure unit tests (submission logic)
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

**Reviewing a document**

1. A reviewer opens a review link (`/reviews/:id`). The page fetches review data and renders the PDF alongside the issue list.
2. The step indicator in the header shows the current stage: Upload → Processing → **Review** → Submitted.
3. The reviewer reads through the PDF. Clicking an issue card scrolls the document to the relevant page and highlights the card.
4. Critical and Major issues must be resolved (or the document re-uploaded) before submission. Minor issues can be individually ignored via the eye icon — ignored issues are removed from the blocking count.
5. Once all blocking issues are cleared, the Submit button becomes active. Clicking it calls the submit endpoint and navigates to the Submitted state.

**Filtering issues**

The filter tabs (All / Critical / Major / Minor) narrow the issue list without affecting the submission gate — the gate always counts against the full unfiltered list.

**Mobile**

On narrow viewports the layout switches to a single-panel view with a tab bar at the bottom. The Issues tab shows a badge with the blocking count. Clicking an issue automatically switches to the Document tab and scrolls to the right page.

---

## Key features

**PDF viewer**

- Text layer enabled → CMD+F / Ctrl+F native browser search works
- Lazy page rendering via IntersectionObserver → only visible pages render, memory stays flat
- Zoom controls (50%–200%) in the toolbar
- Click-and-drag panning (like Figma) — works at all zoom levels
- Prev / Next page buttons with current page indicator
- Programmatic scroll when clicking an issue

**Issues panel**

- Grouped by severity: Critical → Major → Minor
- Filter tabs (All / Critical / Major / Minor) to narrow the list
- Ignore button for minor issues — ignored issues don't block submission
- Clicking an issue scrolls the PDF to the right page and (on mobile) switches to the Document tab

**Header**

- Step indicator showing: Upload → Processing → Review → Submitted
- Submit button blocked (aria-disabled) while critical/major issues remain
- Theme toggle (light/dark) — defaults to OS preference, persists across sessions

**Mobile**

- Tab bar at the bottom switches between Document and Issues panels
- Blocking issue count shown as badge on the Issues tab
- Step indicator shows only the current step label on small screens

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

`src/api/review.ts` exports `getReview()` and `submitReview()`. Both functions simulate network latency (600ms / 800ms). Swapping to a real backend is a one-line change in each function body — the hook, component, and type contracts don't change.

The example PDF (`public/example_document.pdf`) is served locally by Vite. In production, `pdf_url` in the API response would point to a CDN or object storage URL — the viewer doesn't change.

---

## Theme

Defaults to the OS preference (`prefers-color-scheme`). If the user has previously toggled it, their choice is saved in `localStorage` and applied before first paint (no flash). The toggle button (Sun/Moon) is in the top-right of the header.

---

## Testing

```bash
npm run test
```

Three test files:

- `features/review/__tests__/submissionLogic.test.ts` — 8 pure unit tests for submission gating (no React, no mocks, runs instantly)
- `features/review/components/IssueCard/IssueCard.test.tsx` — rendering, navigation, ignore/unignore
- `features/review/components/StatusBadge/StatusBadge.test.tsx` — WCAG 1.4.1: severity communicated via text, not color alone

---

## CI

GitHub Actions runs on every push and PR to `main`:

1. `typecheck` — `tsc --noEmit`
2. `lint` — ESLint
3. `format:check` — Prettier
4. `test` — Vitest
5. `build` — `vite build`

---

## Design

[`docs/design.html`](docs/design.html) — open in a browser. Contains annotated wireframes for the desktop and mobile layouts, plus a table of key design decisions and the alternatives considered (PDF rendering strategy, mobile navigation pattern, submission blocking, accessibility approach).

---

## Architecture notes

For the full reasoning behind every technical decision — why Vite over Next.js, why Zustand over Context, how the PDF text layer works, the horizontal scroll fix, the mobile tab architecture, and what production would require — see [`docs/PLAN.md`](docs/PLAN.md).

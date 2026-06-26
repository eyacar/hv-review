# Document Review — Engineering Plan

This document covers the architectural decisions made for the HomeVision Document Review take-home challenge. It's meant to give context to the decisions I made, not just describe what I built.

---

## Scope

**In scope:**

- Review Page UI — display the document and its issues side by side
- Issue severity logic — block submission if any critical or major issues remain
- Minor issue handling — users can ignore them individually
- Mock API layer — `getReview()` returns spec-provided data; real implementation is a one-line swap
- Submit button — wired to the enable/disable logic; no actual API call (endpoint not ready)

**Out of scope:**

- Upload Page, Processing Page, Submitted Page — owned by other engineers
- Submit endpoint integration — explicitly excluded in the ticket
- Backend or server of any kind — this is a pure frontend implementation

---

## Tech Stack

### Vite over Next.js

The task is a single-page application. There's no server-side rendering, no routing between multiple pages owned by this project, and no SEO concern. Next.js would add complexity (file-based routing, server components, build overhead) that simply doesn't apply here.

Vite gives a faster dev experience, simpler config, and a cleaner mental model for what this actually is: a client-side app with one page.

### React + TypeScript

My go-to for component-heavy UIs, and the right fit here given the shared state complexity. TypeScript is configured in strict mode — no `any`, explicit types everywhere. This isn't just a style preference; it makes refactoring safer as the codebase grows and is something I care about in every project I work on.

### Tailwind CSS + shadcn/ui

Tailwind for utility-first styling with design tokens (CSS variables) for consistency. shadcn/ui for accessible, unstyled-by-default components that I own and can customize — not a black-box component library. This combo is fast to work with and produces production-quality results.

Design tokens are CSS variables defined in `src/styles/tokens.css`. The entire visual language lives there — changing a token updates every component that uses it, which makes theming and handoffs straightforward.

**Light/Dark theme** is supported out of the box. Tokens are defined under `:root` (light) and `[data-theme="dark"]` (dark). The active theme is stored in `localStorage` and applied on `<html>` before first paint to avoid flash. Tailwind's `darkMode: 'class'` strategy is used so Tailwind utilities respect the theme too.

```css
:root {
  /* Surfaces */
  --color-bg: #ffffff;
  --color-surface: #f8f9fa;
  --color-surface-muted: #f1f3f5;
  --color-border: #e2e8f0;

  /* Text */
  --color-text-primary: #0f172a;
  --color-text-muted: #64748b;

  /* Brand */
  --color-primary: #1e40af;
  --color-primary-hover: #1d4ed8;

  /* Issue severity */
  --color-critical: #dc2626;
  --color-critical-bg: #fef2f2;
  --color-major: #d97706;
  --color-major-bg: #fffbeb;
  --color-minor: #2563eb;
  --color-minor-bg: #eff6ff;

  /* Buttons */
  --btn-primary-bg: var(--color-primary);
  --btn-primary-fg: #ffffff;
  --btn-primary-hover: var(--color-primary-hover);
  --btn-secondary-bg: transparent;
  --btn-secondary-fg: var(--color-text-primary);
  --btn-secondary-border: var(--color-border);
  --btn-danger-bg: var(--color-critical);
  --btn-danger-fg: #ffffff;

  /* Layout */
  --sidebar-width: 360px;
  --header-height: 56px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
}

[data-theme='dark'] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-surface-muted: #263448;
  --color-border: #334155;

  --color-text-primary: #f1f5f9;
  --color-text-muted: #94a3b8;

  --color-primary: #3b82f6;
  --color-primary-hover: #60a5fa;

  --color-critical-bg: #450a0a;
  --color-major-bg: #451a03;
  --color-minor-bg: #1e3a5f;
}
```

The severity colors (`--color-critical`, `--color-major`, `--color-minor`) intentionally stay the same across themes — they carry meaning and need to stay recognizable. Only their backgrounds invert.

### react-pdf (pdfjs-dist)

The acceptance criteria requires the user to be able to search for text across the PDF using CMD+F / Ctrl+F.

The simplest solution would be an `<iframe>` — the browser handles rendering and native search works out of the box. But it gives up all control over the viewer: no programmatic scroll to a specific page, no way to highlight pages with issues, no access to the user's scroll position.

`react-pdf` renders each page as a canvas with an optional text layer as real DOM elements. This means:

1. CMD+F works natively because the text is in the DOM.
2. We can jump to a specific page programmatically when the user clicks an issue.
3. We have full control over the UI around the document.

The tradeoff is more implementation work, but it's the right call for a product that needs to connect issues to specific pages in the document.

**A note on document formats**

The spec says documents are uploaded "for example, a PDF file" and that "format and length may vary." This means users could upload `.docx`, `.xlsx`, or other formats.

`react-pdf` only handles PDFs, so this would be a problem if the frontend received arbitrary file types. I considered handling this client-side — there are libraries like `docx-preview` for Word documents — but that approach doesn't scale: each new format needs a new viewer, output quality is inconsistent, and CMD+F behavior varies across renderers.

The right solution is to keep the frontend out of it entirely. The backend should convert any uploaded document to PDF before storing it, and always return a `pdf_url` in the response. The frontend then always deals with a PDF, regardless of what the user originally uploaded. The mock already follows this contract — it returns a `pdf_url`, implying conversion has already happened.

This assumption is documented here so it's explicit when the real backend integration happens.

### @tanstack/query (React Query)

Used for data fetching, even though the API is mocked. The reason: the interface is identical to what it would be with a real API.

Today, `getReview()` returns mock data with a simulated delay. When the backend is ready, the implementation changes but nothing else does — no component changes, no hook changes, just swap the function body. React Query also gives loading and error states for free, which makes the UI more realistic and the code production-like from day one.

### Zustand

The PDF viewer and the issues panel are siblings in the component tree. They need to share several pieces of state:

1. `currentPage` — when the user clicks an issue, the PDF should scroll to the corresponding page. When the PDF page changes, the active issue in the panel can update accordingly.
2. `ignoredIssues` — the set of minor issue IDs the user has chosen to ignore. This state affects whether submission is allowed, which is computed in the header.
3. `activeMobileTab` — on mobile, only one panel is visible at a time (Document or Issues). When the user clicks an issue, the app should switch to the Document tab automatically. Without Zustand, `IssueCard` would have needed to receive `setActiveTab` threaded down through `IssuesPanel` → `IssueCard` — two levels of prop drilling for a prop neither intermediate component cares about.

Lifting this state to a common ancestor and threading it down via props would work, but it leads to prop drilling — one of the most common pain points in growing React codebases. Components that don't care about the state end up receiving and forwarding it just to pass it deeper, which creates unnecessary coupling and makes refactoring painful. Zustand solves this cleanly: each component subscribes only to what it needs, with a small focused store and no Redux boilerplate or Context gymnastics.

### React 19 document metadata

`react-helmet-async` was initially considered for managing the page `<title>`. React 19 made this unnecessary — it natively hoists `<title>`, `<meta>`, and `<link>` elements from anywhere in the component tree to `<head>`. A plain `<title>{reviewName} — Review</title>` inside `SubmitBar` is all that's needed. No provider, no wrapper, no library.

---

## Routing

Even though only the Review Page is in scope, all four routes from the product flow are defined in the router. The other pages render a simple "Coming Soon" placeholder. This keeps the app coherent — navigation works end to end — and makes it easy for teammates to drop their pages in without touching the router config.

```
/upload                  → UploadPage        (coming soon)
/processing/:id          → ProcessingPage    (coming soon)
/reviews/:id             → ReviewPage        ← built here
/reviews/:id/submitted   → SubmittedPage     (coming soon)
```

React Router v6 handles this with `createBrowserRouter`. Each route is lazy-loaded so the Review Page bundle doesn't pay for the weight of other pages.

---

## Folder Structure

The project follows a feature-based architecture. Each feature owns its components, hooks, and types. Shared code lives in `shared/`. Nothing crosses feature boundaries directly — shared primitives are used instead.

```
src/
├── api/
│   ├── review.ts          # getReview() and submitReview() — mock today, real fetch tomorrow
│   ├── types.ts           # TypeScript types for the API response
│   └── mock/
│       └── review.json    # Mock data provided in the spec
│
├── features/
│   └── review/
│       ├── __tests__/
│       │   └── submissionLogic.test.ts  # Pure unit tests for submission gating
│       ├── components/
│       │   ├── DocumentViewer/    # PDF renderer, zoom controls, drag-to-scroll
│       │   ├── IssuesPanel/       # Issues sidebar
│       │   ├── IssueCard/         # Individual issue item (with tests)
│       │   ├── ReviewError/       # Domain-specific error state (thin wrapper)
│       │   ├── ReviewSkeleton/    # Layout-specific loading skeleton
│       │   ├── StatusBadge/       # Critical / Major / Minor badge (with tests)
│       │   └── SubmitBar/         # Header: doc name, step indicator, actions
│       ├── hooks/
│       │   └── useReview.ts       # React Query hooks: useReview, useSubmitReview
│       └── store/
│           └── reviewStore.ts     # Zustand: currentPage, ignoredIssues, activeMobileTab
│
├── lib/
│   ├── auth.ts            # getToken() — reads JWT from localStorage
│   └── cn.ts              # clsx utility for conditional classNames
│
├── pages/
│   └── ReviewPage.tsx     # Route component — composes feature components
│
├── shared/
│   └── components/
│       └── ErrorState/    # Generic reusable error component
│
├── styles/
│   ├── tokens.css         # All design tokens as CSS variables
│   └── global.css         # Layout, component styles, animations
│
└── main.tsx
```

---

## API Layer

The API layer is a thin abstraction over the data source. All data calls go through functions in `src/api/` — components never call `fetch` directly. Today those functions return mock data; when the backend is ready, only the function body changes.

### getReview — fetch the current review

The Review Page receives a review `id` from the URL (e.g. `/reviews/souj5sd12c8a3f`). It calls `getReview(id)` to load the full review data: document metadata, issue list, version, and the PDF URL.

```ts
// Today (mock)
export async function getReview(id: string): Promise<Review> {
  await new Promise(res => setTimeout(res, 600)) // simulated latency
  return mockData as Review
}

// When the API is ready
export async function getReview(id: string): Promise<Review> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`, // JWT from auth system
    },
  })
  if (!res.ok) throw new Error('Failed to fetch review')
  return res.json()
}
```

### submitReview — submit the review

Once all critical and major issues are resolved, the user can submit. The submit endpoint is not ready yet, so this function is stubbed — but the interface is already defined so it can be wired up without touching the components.

```ts
// Today (stub)
export async function submitReview(id: string): Promise<void> {
  await new Promise(res => setTimeout(res, 800))
  // no-op
}

// When the API is ready
export async function submitReview(id: string): Promise<void> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  })
  if (!res.ok) throw new Error('Failed to submit review')
}
```

### Version handling

The `version` field in the response is read-only from the frontend's perspective. When a user needs to fix critical or major issues, they go back to their system, generate a new document, and upload it via the Upload Page (owned by another engineer). The backend receives the new file, processes it, and increments the version. The Review Page simply displays whatever version the API returns — it never writes or computes version numbers.

### Auth

In the real implementation, every request includes a JWT in the `Authorization` header. The mock skips this entirely since there's no real endpoint. The `user` object already comes from the API response (`user.first_name`, `user.last_name`), so the frontend doesn't need to manage identity — it just displays what the backend returns.

The token is read from `localStorage` via a dedicated utility in `src/lib/auth.ts`. It deliberately does not live in Zustand — Zustand is in-memory and resets on page refresh, which would log the user out on every reload. `localStorage` persists across sessions. Zustand would only be appropriate here if components needed to reactively respond to auth state changes (e.g. token expiry redirects), which is out of scope for this MVP.

```ts
// src/lib/auth.ts
export function getToken(): string | null {
  return localStorage.getItem('auth_token')
}
```

**Document URL handling**

The review response includes `document.pdf_url` — the frontend never manages the file itself. The PDF viewer just receives that URL and streams the document directly from it.

For local development, the example PDF is placed in Vite's `public/` folder, which serves static files at the root path. The `pdf_url` in the mock is set to `/example_document.pdf`, making it available at `http://localhost:5173/example_document.pdf` — a real URL the browser and react-pdf can fetch normally, with no filesystem access or special handling.

```json
"document": {
  "pdf_url": "/example_document.pdf"
}
```

In production, that same field would point to wherever the backend stores files (S3, GCS, etc.). The viewer doesn't change — it just fetches whatever URL the API returns.

The review `id` comes from the URL via `useParams()`. That single value drives the entire page — one `getReview(id)` call returns everything: metadata, issues, and the PDF URL. No state in the URL beyond the ID, no manual cache, no prop drilling of the document.

---

## State Management

| State                              | Where       | Why                                                  |
| ---------------------------------- | ----------- | ---------------------------------------------------- |
| Review data (loading, error, data) | React Query | Server state, async lifecycle                        |
| Current PDF page                   | Zustand     | Shared between DocumentViewer and IssuesPanel        |
| Ignored minor issues               | Zustand     | Shared between IssueCard, SubmitBar                  |
| Active mobile tab                  | Zustand     | IssueCard switches tabs without prop drilling        |
| PDF zoom level                     | useState    | Local to DocumentViewer, no sibling needs it         |
| UI-only state (hover, open/close)  | useState    | Local, no sharing needed                             |

---

## Submission Logic

A review can be submitted when there are no unresolved `critical` or `major` issues. `minor` issues can be explicitly ignored by the user.

Derived values like `canSubmit` and `blockingIssues` are wrapped in `useMemo` so they only recompute when `issues` or `ignoredIssues` actually change — not on every render. The same applies to event handlers, which use `useCallback` to keep references stable and avoid unnecessary re-renders in child components.

```ts
const blockingIssues = useMemo(
  () => issues.filter(i => i.severity !== 'minor' && !ignoredIssues.has(i.id)),
  [issues, ignoredIssues]
)

const canSubmit = useMemo(() => blockingIssues.length === 0, [blockingIssues])

const handleIgnore = useCallback(
  (id: string) => {
    ignoreIssue(id) // Zustand action
  },
  [ignoreIssue]
)
```

Components that receive stable props are wrapped in `React.memo` to prevent renders triggered by unrelated state changes — particularly important for `IssueCard`, which can render up to 25 times in the list.

When submission is blocked, the UI communicates exactly why: a list of the blocking issues with their severity and page number. The submit button uses `aria-disabled` (not just `disabled`) and `aria-describedby` pointing to the blocking message.

---

## Accessibility

I followed WCAG 2.1 AA as a guide. The practical decisions:

- Semantic HTML first: `<main>`, `<nav>`, `<section>`, `<button>` — not div soup.
- The issues panel uses `aria-live="polite"` so screen readers announce when the list changes.
- The submit button uses `aria-disabled` + `aria-describedby` to explain why it's blocked, instead of just being greyed out.
- Issue severity is communicated through text and icon, not color alone (WCAG 1.4.1).
- Full keyboard navigation: the issues panel is traversable with Tab/Enter.

---

## CI/CD & Code Quality

### Pre-commit (Husky + lint-staged)

Only staged files are linted — not the whole project. This keeps commits fast without skipping quality checks.

```
pre-commit → lint-staged → ESLint + Prettier on staged files
commit-msg → commitlint → enforces Conventional Commits
```

### GitHub Actions

Two pipelines:

**`ci.yml`** — runs on every push and PR to `main`:

1. Install dependencies
2. Type check (`tsc --noEmit`)
3. Lint (`eslint`)
4. Run tests (`vitest run`)
5. Build (`vite build`)

**`deploy.yml`** (placeholder) — runs on merge to `main`. Since `vite build` produces a static bundle, it can be deployed to any static hosting provider without changes to the pipeline.

### Commit Convention

I use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new functionality
- `fix:` bug fixes
- `chore:` config, deps, tooling
- `docs:` documentation only
- `test:` adding or updating tests

### Branch Strategy

- `main` — protected. No direct pushes. Requires a passing CI run.
- Feature work happens on short-lived branches (`feat/pdf-viewer`, `fix/submit-logic`).
- In a team context, PRs would require at least one review before merge — that's enforced at the repo level via branch protection rules.

---

## Mobile Layout

On desktop, the document and issues panel sit side by side. On mobile (< 768px), both panels don't fit — the layout switches to a tab bar at the bottom of the screen.

```
[Document] [Issues  3]   ← tab bar, badge shows blocking count
```

The tab state (`activeMobileTab: 'document' | 'issues'`) lives in the Zustand store rather than in `ReviewPage`. This is the key decision: `IssueCard` — deep in the tree — calls `setActiveMobileTab('document')` directly when the user clicks "Go to page." If the state were local to `ReviewPage`, this action would require threading a setter down through `IssuesPanel` → `IssueCard`, coupling two intermediary components to a concern they don't own.

The CSS hides the inactive panel via `.review-layout__panel--hidden { display: none }` on mobile. On desktop, both panels are always visible regardless of `activeMobileTab`.

---

## Step Indicator

The header shows a four-step workflow indicator: **Upload → Processing → Review → Submitted**. This gives users orientation — they know what stage they're in and what comes next.

The current step is derived from the `status` field in the API response via a simple switch:

```ts
function statusToStepIndex(status: ReviewStatus): number {
  switch (status) {
    case 'created':    return 0
    case 'processing': return 1
    case 'on_review':  return 2
    case 'submitted':  return 3
  }
}
```

On mobile, step labels are hidden to save space — only the current step's label is shown (via CSS). The dots remain visible so orientation is preserved without taking up a full row.

---

## PDF Viewer UX

### Zoom

Zoom runs from 50% to 200% in 25% increments. The page width passed to `react-pdf` is `Math.floor(containerWidth * zoom)` — `containerWidth` is measured via `ResizeObserver`, so the document always fills the available space at 100% and scales proportionally at other levels.

Zoom state is local to `DocumentViewer` — no other component needs it, so there's no reason to put it in the store.

### Horizontal scroll at high zoom

When the document is wider than the container (> 100% zoom), it needs to scroll horizontally. A naive `align-items: center` on the flex scroll container overflows content equally on both sides, making the left side unreachable — the browser's scroll origin is at 0 and you can't scroll to negative values.

The fix is `align-items: flex-start` on the scroll container + `margin: 0 auto` on the document itself. At 100% zoom the document centers itself via auto margins. At high zoom, overflow goes right-only, and the full scroll range is accessible.

### Drag-to-scroll

On macOS, overlay scrollbars are invisible until you hover. Users have no visual affordance that the document is scrollable. The viewer implements click-and-drag panning: `mousedown` records the scroll position and cursor coordinates, `mousemove` updates scroll position by the delta, `mouseup`/`mouseleave` ends the drag. The cursor changes to `grabbing` during the drag. This is the standard pattern used by PDF viewers, design tools (Figma), and map interfaces.

---

## Testing

**Vitest** (native to Vite) + **React Testing Library**.

Three test files are included:

**`submissionLogic.test.ts`** — 8 pure unit tests with no React or mocks. Covers the full matrix of submission gating: blocks on critical, blocks on major, allows minor-only, allows when all blocking issues are ignored, partial ignore still blocks. These are the highest-value tests: the logic is pure, the cases are clear, and they run in milliseconds.

**`IssueCard.test.tsx`** — tests the most interactive component. Verifies that clicking the card calls both `setCurrentPage` and `setActiveMobileTab('document')` (the mobile tab fix), that the ignore/unignore buttons call the right store actions, and that the ignore button doesn't appear for non-minor issues. Uses `vi.mock` to mock the Zustand store.

**`StatusBadge.test.tsx`** — verifies WCAG 1.4.1: each severity renders a visible text label, not just a color. This is the kind of test that prevents an "obviously wrong" regression from slipping through.

Integration tests over unit tests where possible — test behavior, not implementation.

---

## What Would Production Require

Beyond what's already in place:

1. **Real API integration** — swap `getReview()` and `submitReview()` implementations, add JWT auth headers via `getToken()`

2. **Authentication** — `getToken()` already reads from `localStorage`. What's missing is the login flow that puts the token there. Session expiry and refresh token logic would live in `src/lib/auth.ts`, keeping it out of components entirely.

3. **Error tracking** — I'd wire up Datadog RUM to the existing `ErrorBoundary`. Datadog gives both frontend error tracking (JS exceptions, stack traces, session replays) and infrastructure monitoring in one place, which avoids running two separate tools. For a team already using Datadog on the backend, this is a natural fit.

4. **Performance** — The current issues list renders up to 25 items, which is fine. If the backend ever returns hundreds of issues, the list would need virtualization (e.g. `@tanstack/virtual`). PDF pages are already lazy-loaded per page, so large documents are handled. This is a known scaling point, not a current problem.

5. **Environment config** — `VITE_API_URL` is already defined as an env var. Production just needs it pointed at the real backend. Per-environment values (staging, prod) are managed in the hosting platform.

6. **Deployment** — I'd use AWS Amplify. It connects directly to the GitHub repo, runs the build on every push, and handles environment variables per branch. Preview deployments for PRs are built in, which makes reviewing frontend changes much easier for the team. Since `vite build` produces a pure static bundle, there's no server to manage.

7. **Bundle analysis** — `vite-bundle-visualizer` before the first production deploy to catch any dependency bloat. `react-pdf` and `pdfjs-dist` are the heaviest dependencies — worth verifying they're being code-split correctly and not bundled into the main chunk.

---

## What Required the Most Expertise

Two things stood out:

**The PDF text layer.** Getting CMD+F to work natively while maintaining full control over the viewer isn't trivial. `react-pdf` renders pages to canvas, and the text layer needs to be configured specifically so the text elements exist in the DOM for the browser's native find to pick them up. Getting the text layer positioned correctly over the canvas — so selection and highlighting work — required careful CSS and an understanding of how pdfjs-dist handles page rendering internally.

**Connecting issues to document pages.** The UX decision to make issues clickable — jumping to the right page in the PDF — required coordinating state between two sibling components that have no natural parent-child relationship. The Zustand store handles this cleanly, but the decision of _where_ to put this logic (not in either component, not in a prop-drilled parent, but in a dedicated store slice) is the kind of architectural judgment that matters in a real codebase.

**Performance: rendering 34 pages without blocking the UI.** Rendering all PDF pages at once is a non-starter — each page is a canvas element that pdfjs renders in a worker thread, and doing all 34 up front causes a noticeable load spike. The solution is lazy rendering via `IntersectionObserver`: pages are only rendered when they enter (or are about to enter) the viewport, and unloaded when they scroll far away. This keeps memory usage flat regardless of document length. The pdfjs worker itself is also configured to run off the main thread, so heavy decode operations don't block user interactions. Getting the worker path right in a Vite build (it needs to be treated as a static asset, not bundled) was one of the more finicky parts of the setup.

**Horizontal scroll at high zoom.** A seemingly simple feature — zoom the PDF — revealed a subtle CSS behavior. `align-items: center` on a flex scroll container distributes overflow equally on both sides. Since the browser's scroll origin is at `0`, negative scroll positions are inaccessible, making the left side of a wide document unreachable. The fix (`align-items: flex-start` + `margin: 0 auto` on the child) is clean once you understand why it works — the document centers itself with auto margins when it fits, and overflows to the right when it doesn't.

**Mobile tab coordination without prop drilling.** On mobile, clicking an issue should both jump to the right page _and_ switch to the Document tab. `IssueCard` is two levels deep inside the panel. The naive approach — pass `setActiveTab` from `ReviewPage` → `IssuesPanel` → `IssueCard` — would couple two components to a prop they don't use. Adding `activeMobileTab` to the Zustand store let `IssueCard` call `setActiveMobileTab` directly, with no intermediary coupling.

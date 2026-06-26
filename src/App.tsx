import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Lazy load all pages — each route only loads what it needs
const HomePage = lazy(() => import('./pages/HomePage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'))

const router = createBrowserRouter([
  {
    path: '/upload',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ComingSoonPage title="Upload" />
      </Suspense>
    ),
  },
  {
    path: '/processing/:id',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ComingSoonPage title="Processing" />
      </Suspense>
    ),
  },
  {
    path: '/reviews/:id',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ReviewPage />
      </Suspense>
    ),
  },
  {
    path: '/reviews/:id/submitted',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ComingSoonPage title="Submitted" />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    ),
  },
])

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        background: 'var(--color-bg)',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-body)',
      }}
    >
      Loading…
    </div>
  )
}

export default function App() {
  return <RouterProvider router={router} />
}

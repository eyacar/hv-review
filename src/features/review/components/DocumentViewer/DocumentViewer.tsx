import { memo, useCallback, useRef, useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { useReviewStore } from '../../store/reviewStore'
import { cn } from '../../../../lib/cn'
import { resolveAssetUrl } from '../../../../lib/assets'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure pdfjs worker as a static asset (Vite serves it from public/)
// This keeps the heavy decode work off the main thread
pdfjs.GlobalWorkerOptions.workerSrc = resolveAssetUrl('pdf.worker.min.mjs')

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.0
const ZOOM_STEP = 0.25
const ZOOM_DEFAULT = 1.0

interface DocumentViewerProps {
  /** URL of the PDF to render — can be a local path (dev) or CDN URL (production). */
  url: string
  /** Total number of pages in the document, used to render page wrappers and clamp navigation. */
  totalPages: number
}

/**
 * PDF viewer optimised for large documents.
 *
 * Memory strategy — lazy page mounting via IntersectionObserver:
 * - Each page wrapper div is always in the DOM (preserves scroll height / no layout shift).
 * - The react-pdf <Page> is only mounted once the wrapper enters the viewport (threshold 0.1).
 * - Once mounted, pages stay mounted — avoids re-parsing PDF binary data on scroll-back.
 * - Per-page IntersectionObservers are stored in a Map ref and disconnected on unmount,
 *   preventing memory leaks regardless of document length.
 *
 * This means memory usage is bounded by the number of pages the user has scrolled past,
 * not the total page count — a 200-page PDF does not load all 200 pages up front.
 *
 * Additional features:
 * - Text layer enabled → CMD+F native search works via DOM text elements
 * - Programmatic scroll when currentPage changes (triggered by clicking an issue)
 * - Page scroll tracking → updates currentPage in the store so the issues panel stays in sync
 * - Zoom controls (50%–200%) → floating toolbar that doesn't affect the scrollable area
 */
export const DocumentViewer = memo(function DocumentViewer({
  url,
  totalPages,
}: DocumentViewerProps) {
  const currentPage = useReviewStore(state => state.currentPage)
  const setCurrentPage = useReviewStore(state => state.setCurrentPage)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingProgrammatically = useRef(false)
  const [containerWidth, setContainerWidth] = useState(612)
  const [zoom, setZoom] = useState(ZOOM_DEFAULT)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  // Pages that have entered the viewport at least once — once rendered, stay rendered
  // to avoid re-parsing PDF data on scroll-back.
  const [visiblePages, setVisiblePages] = useState<ReadonlySet<number>>(() => new Set([1]))
  // Stores per-page observers so we can disconnect on unmount or ref change
  const observersRef = useRef<Map<number, IntersectionObserver>>(new Map())

  // Cleanup: disconnect all per-page IntersectionObservers when the component unmounts.
  // Individual observers are also disconnected in handlePageRef before re-attaching,
  // so there is no double-disconnect risk.
  useEffect(() => {
    const observers = observersRef.current
    return () => {
      observers.forEach(obs => obs.disconnect())
      observers.clear()
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with left button; ignore clicks on interactive elements inside
    if (e.button !== 0) return
    const el = containerRef.current
    if (!el) return
    isDragging.current = true
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const el = containerRef.current
    if (!el) return
    el.scrollLeft = dragStart.current.scrollLeft - (e.clientX - dragStart.current.x)
    el.scrollTop = dragStart.current.scrollTop - (e.clientY - dragStart.current.y)
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    const el = containerRef.current
    if (!el) return
    el.style.cursor = ''
    el.style.userSelect = ''
  }, [])

  const zoomIn = useCallback(
    () => setZoom(z => Math.min(+(z + ZOOM_STEP).toFixed(2), ZOOM_MAX)),
    []
  )
  const zoomOut = useCallback(
    () => setZoom(z => Math.max(+(z - ZOOM_STEP).toFixed(2), ZOOM_MIN)),
    []
  )
  const zoomReset = useCallback(() => setZoom(ZOOM_DEFAULT), [])

  const prevPage = useCallback(
    () => setCurrentPage(Math.max(1, currentPage - 1)),
    [currentPage, setCurrentPage]
  )
  const nextPage = useCallback(
    () => setCurrentPage(Math.min(totalPages, currentPage + 1)),
    [currentPage, totalPages, setCurrentPage]
  )

  // Track container width for responsive PDF page sizing
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      // contentRect already excludes padding — cap at 700 to match max-width of document container
      if (width) setContainerWidth(Math.min(Math.floor(width), 700))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Scroll to the target page when the user clicks an issue in the panel.
  // The 800 ms guard matches smooth-scroll duration — prevents the observer
  // from overwriting currentPage while the scroll animation is in flight.
  useEffect(() => {
    const pageEl = pageRefs.current[currentPage - 1]
    if (!pageEl) return

    isScrollingProgrammatically.current = true
    pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })

    const timeout = setTimeout(() => {
      isScrollingProgrammatically.current = false
    }, 800)

    return () => clearTimeout(timeout)
  }, [currentPage])

  // One observer per page handles two concerns:
  //   threshold 0.1 → page is entering the viewport → start rendering PDF content (lazy mount)
  //   threshold 0.5 → page is mostly visible → update currentPage (skip if programmatic scroll)
  // Once a page is added to visiblePages it stays there — avoids re-parsing PDF data on scroll-back.
  const handlePageRef = useCallback(
    (el: HTMLDivElement | null, pageNum: number) => {
      pageRefs.current[pageNum - 1] = el

      // Clean up any existing observer for this slot before attaching a new one
      observersRef.current.get(pageNum)?.disconnect()
      observersRef.current.delete(pageNum)

      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.intersectionRatio >= 0.1) {
            // Lazy-mount: mark page as visible so <Page> renders
            setVisiblePages(prev => {
              if (prev.has(pageNum)) return prev
              const next = new Set(prev)
              next.add(pageNum)
              return next
            })
          }
          if (entry.intersectionRatio >= 0.5 && !isScrollingProgrammatically.current) {
            // User scrolled manually — sync the issues panel highlight to the visible page
            setCurrentPage(pageNum)
          }
        },
        { root: containerRef.current, threshold: [0.1, 0.5] }
      )

      observer.observe(el)
      observersRef.current.set(pageNum, observer)
    },
    [setCurrentPage]
  )

  const pageWidth = Math.floor(containerWidth * zoom)

  return (
    <div className="document-viewer-wrapper">
      {/* Toolbar sits above the scroll area — never overlaps content */}
      <div className="document-toolbar" role="toolbar" aria-label="Document controls">
        <button
          type="button"
          className="zoom-controls__btn"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
        >
          <ZoomOut size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="zoom-controls__level"
          onClick={zoomReset}
          aria-label={`Zoom ${Math.round(zoom * 100)}% — click to reset`}
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          className="zoom-controls__btn"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
        >
          <ZoomIn size={15} aria-hidden="true" />
        </button>

        {zoom !== ZOOM_DEFAULT && (
          <button
            type="button"
            className="zoom-controls__btn zoom-controls__btn--reset"
            onClick={zoomReset}
            aria-label="Reset zoom to 100%"
          >
            <RotateCcw size={13} aria-hidden="true" />
          </button>
        )}

        <div className="document-toolbar__divider" aria-hidden="true" />

        <button
          type="button"
          className="zoom-controls__btn"
          onClick={prevPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </button>

        <span
          className="document-toolbar__page"
          aria-live="polite"
          aria-label={`Page ${currentPage} of ${totalPages}`}
        >
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          className="zoom-controls__btn"
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="document-viewer"
        aria-label="Document viewer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Document
          file={url}
          loading={<DocumentSkeleton />}
          error={<DocumentError />}
          className="document-viewer__document"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <DocumentPageSlot
              key={pageNum}
              pageNum={pageNum}
              isActive={pageNum === currentPage}
              isVisible={visiblePages.has(pageNum)}
              pageWidth={pageWidth}
              onPageRef={handlePageRef}
            />
          ))}
        </Document>
      </div>
    </div>
  )
})

interface DocumentPageSlotProps {
  pageNum: number
  isActive: boolean
  isVisible: boolean
  pageWidth: number
  onPageRef: (el: HTMLDivElement | null, pageNum: number) => void
}

/** Stable ref callback per page — avoids IntersectionObserver churn on parent re-renders. */
const DocumentPageSlot = memo(function DocumentPageSlot({
  pageNum,
  isActive,
  isVisible,
  pageWidth,
  onPageRef,
}: DocumentPageSlotProps) {
  const setRef = useCallback(
    (el: HTMLDivElement | null) => onPageRef(el, pageNum),
    [onPageRef, pageNum]
  )

  return (
    <div
      ref={setRef}
      className={cn('document-viewer__page-wrapper', {
        'document-viewer__page-wrapper--active': isActive,
      })}
    >
      {isVisible ? (
        <Page
          pageNumber={pageNum}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="document-viewer__page"
          loading={<PageSkeleton />}
          width={pageWidth}
        />
      ) : (
        <PageSkeleton />
      )}
    </div>
  )
})

const DocumentSkeleton = memo(function DocumentSkeleton() {
  return (
    <div className="document-viewer__skeleton" aria-label="Loading document…">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton skeleton--page" />
      ))}
    </div>
  )
})

const PageSkeleton = memo(function PageSkeleton() {
  return <div className="skeleton skeleton--page" aria-hidden="true" />
})

const DocumentError = memo(function DocumentError() {
  return (
    <div className="document-viewer__error" role="alert">
      <p>Failed to load document. Please try refreshing the page.</p>
    </div>
  )
})

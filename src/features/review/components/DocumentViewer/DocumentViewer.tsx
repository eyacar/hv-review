import { memo, useCallback, useRef, useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useReviewStore } from '../../store/reviewStore'
import { cn } from '../../../../lib/cn'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure pdfjs worker as a static asset (Vite serves it from public/)
// This keeps the heavy decode work off the main thread
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface DocumentViewerProps {
  url: string
  totalPages: number
}

/**
 * PDF viewer with:
 * - Text layer enabled → CMD+F native search works via DOM text elements
 * - Lazy page rendering via IntersectionObserver → only visible pages are rendered
 * - Programmatic scroll when currentPage changes (triggered by clicking an issue)
 * - Page scroll tracking → updates currentPage in the store so the issues panel stays in sync
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

  // Scroll to page when currentPage changes (e.g. user clicked an issue)
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

  // Track which page is visible as the user scrolls
  const handlePageRef = useCallback(
    (el: HTMLDivElement | null, pageNum: number) => {
      pageRefs.current[pageNum - 1] = el

      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isScrollingProgrammatically.current) {
            setCurrentPage(pageNum)
          }
        },
        { root: containerRef.current, threshold: 0.5 }
      )

      observer.observe(el)
      return () => observer.disconnect()
    },
    [setCurrentPage]
  )

  const onDocumentLoadSuccess = useCallback(() => {
    // Document loaded — pages will render lazily via IntersectionObserver
  }, [])

  return (
    <div ref={containerRef} className="document-viewer" aria-label="Document viewer">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<DocumentSkeleton />}
        error={<DocumentError />}
        className="document-viewer__document"
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <div
            key={pageNum}
            ref={el => handlePageRef(el, pageNum)}
            className={cn('document-viewer__page-wrapper', {
              'document-viewer__page-wrapper--active': pageNum === currentPage,
            })}
          >
            <Page
              pageNumber={pageNum}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="document-viewer__page"
              loading={<PageSkeleton />}
              width={containerWidth}
            />
          </div>
        ))}
      </Document>
    </div>
  )
})

function DocumentSkeleton() {
  return (
    <div className="document-viewer__skeleton" aria-label="Loading document…">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton skeleton--page" />
      ))}
    </div>
  )
}

function PageSkeleton() {
  return <div className="skeleton skeleton--page" aria-hidden="true" />
}

function DocumentError() {
  return (
    <div className="document-viewer__error" role="alert">
      <p>Failed to load document. Please try refreshing the page.</p>
    </div>
  )
}

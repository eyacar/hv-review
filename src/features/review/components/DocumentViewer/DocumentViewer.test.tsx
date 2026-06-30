import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentViewer } from './DocumentViewer'

vi.mock('react-pdf', () => ({
  Document: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pdf-document">{children}</div>
  ),
  Page: ({ pageNumber }: { pageNumber: number }) => (
    <div data-testid={`pdf-page-${pageNumber}`}>Page {pageNumber}</div>
  ),
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}))

const mockSetCurrentPage = vi.fn()

vi.mock('../../store/reviewStore', () => ({
  useReviewStore: <T,>(
    selector: (state: { currentPage: number; setCurrentPage: typeof mockSetCurrentPage }) => T
  ): T => selector({ currentPage: 1, setCurrentPage: mockSetCurrentPage }),
}))

class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
}

class MockResizeObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('DocumentViewer — toolbar', () => {
  it('renders page indicator and document controls', () => {
    render(<DocumentViewer url="/example_document.pdf" totalPages={5} />)
    expect(screen.getByRole('toolbar', { name: 'Document controls' })).toBeInTheDocument()
    expect(screen.getByLabelText('Page 1 of 5')).toBeInTheDocument()
  })

  it('navigates to the next page via toolbar buttons', () => {
    render(<DocumentViewer url="/example_document.pdf" totalPages={5} />)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(mockSetCurrentPage).toHaveBeenCalledWith(2)
  })

  it('updates zoom level when zoom in is clicked', () => {
    render(<DocumentViewer url="/example_document.pdf" totalPages={3} />)
    fireEvent.click(screen.getByLabelText('Zoom in'))
    expect(screen.getByLabelText('Zoom 125% — click to reset')).toBeInTheDocument()
  })

  it('renders a page wrapper per totalPages', () => {
    const { container } = render(<DocumentViewer url="/example_document.pdf" totalPages={3} />)
    expect(screen.getByTestId('pdf-document')).toBeInTheDocument()
    expect(container.querySelectorAll('.document-viewer__page-wrapper')).toHaveLength(3)
  })
})

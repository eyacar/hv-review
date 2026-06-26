import { useParams } from 'react-router-dom'
import { FileText, AlertCircle } from 'lucide-react'
import { useReview } from '../features/review/hooks/useReview'
import { SubmitBar } from '../features/review/components/SubmitBar/SubmitBar'
import { IssuesPanel } from '../features/review/components/IssuesPanel/IssuesPanel'
import { DocumentViewer } from '../features/review/components/DocumentViewer/DocumentViewer'
import { ReviewSkeleton } from '../features/review/components/ReviewSkeleton/ReviewSkeleton'
import { ReviewError } from '../features/review/components/ReviewError/ReviewError'
import { useReviewStore } from '../features/review/store/reviewStore'
import { cn } from '../lib/cn'

// Fallback ID for development — matches the mock data
const DEV_REVIEW_ID = 'souj5sd12c8a3f'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const reviewId = id ?? DEV_REVIEW_ID
  const activeTab = useReviewStore(state => state.activeMobileTab)
  const setActiveTab = useReviewStore(state => state.setActiveMobileTab)

  const { data: review, isLoading, isError, error, refetch } = useReview(reviewId)

  if (isLoading) return <ReviewSkeleton />
  if (isError) return <ReviewError message={error.message} onRetry={refetch} />
  if (!review) return null

  const userName = `${review.user.first_name} ${review.user.last_name}`
  const blockingCount = review.issues.filter(
    i => i.severity === 'critical' || i.severity === 'major'
  ).length

  return (
    <div className="review-layout">
      <SubmitBar
        reviewId={review.id}
        reviewName={review.name}
        version={review.version}
        status={review.status}
        uploadedAt={review.uploaded_at}
        userName={userName}
        issues={review.issues}
      />

      {/* Desktop: side by side. Mobile: controlled by activeTab */}
      <main className="review-layout__body">
        <div
          className={cn('review-layout__panel', {
            'review-layout__panel--hidden': activeTab !== 'document',
          })}
        >
          <DocumentViewer url={review.document.pdf_url} totalPages={review.document.pages.length} />
        </div>
        <div
          className={cn('review-layout__panel', {
            'review-layout__panel--hidden': activeTab !== 'issues',
          })}
        >
          <IssuesPanel issues={review.issues} />
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav className="mobile-tabs" aria-label="View tabs">
        <button
          type="button"
          className={cn('mobile-tabs__tab', {
            'mobile-tabs__tab--active': activeTab === 'document',
          })}
          onClick={() => setActiveTab('document')}
          aria-pressed={activeTab === 'document'}
        >
          <FileText size={18} aria-hidden="true" />
          <span>Document</span>
        </button>
        <button
          type="button"
          className={cn('mobile-tabs__tab', { 'mobile-tabs__tab--active': activeTab === 'issues' })}
          onClick={() => setActiveTab('issues')}
          aria-pressed={activeTab === 'issues'}
        >
          <AlertCircle size={18} aria-hidden="true" />
          <span>Issues</span>
          {blockingCount > 0 && (
            <span className="mobile-tabs__badge" aria-label={`${blockingCount} blocking issues`}>
              {blockingCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  )
}

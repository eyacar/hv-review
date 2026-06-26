import { useParams } from 'react-router-dom'
import { useReview } from '../features/review/hooks/useReview'
import { SubmitBar } from '../features/review/components/SubmitBar/SubmitBar'
import { IssuesPanel } from '../features/review/components/IssuesPanel/IssuesPanel'
import { DocumentViewer } from '../features/review/components/DocumentViewer/DocumentViewer'

// Fallback ID for development — matches the mock data
const DEV_REVIEW_ID = 'souj5sd12c8a3f'

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const reviewId = id ?? DEV_REVIEW_ID

  const { data: review, isLoading, isError, error } = useReview(reviewId)

  if (isLoading) return <ReviewPageSkeleton />
  if (isError) return <ReviewPageError message={error.message} />
  if (!review) return null

  const userName = `${review.user.first_name} ${review.user.last_name}`

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

      <main className="review-layout__body">
        <DocumentViewer url={review.document.pdf_url} totalPages={review.document.pages.length} />
        <IssuesPanel issues={review.issues} />
      </main>
    </div>
  )
}

function ReviewPageSkeleton() {
  return (
    <div className="review-layout" aria-busy="true" aria-label="Loading review…">
      <div className="skeleton skeleton--header" />
      <div className="review-layout__body">
        <div className="skeleton skeleton--viewer" />
        <div className="skeleton skeleton--panel" />
      </div>
    </div>
  )
}

function ReviewPageError({ message }: { message: string }) {
  return (
    <div className="review-layout__error" role="alert">
      <h2>Failed to load review</h2>
      <p>{message}</p>
      <button type="button" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  )
}

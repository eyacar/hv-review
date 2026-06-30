import { memo } from 'react'

/**
 * Loading state for the review page.
 * Matches the final layout (header + viewer + panel) so there's no layout shift
 * when real content arrives.
 */
export const ReviewSkeleton = memo(function ReviewSkeleton() {
  return (
    <div className="review-layout" aria-busy="true" aria-label="Loading review…">
      <div className="skeleton skeleton--header" />
      <div className="review-layout__body">
        <div className="skeleton skeleton--viewer" />
        <div className="skeleton skeleton--panel" />
      </div>
    </div>
  )
})

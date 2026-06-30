import { memo, useMemo, useCallback, useId, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Upload, Check } from 'lucide-react'
import { useReviewStore } from '../../store/reviewStore'
import { useSubmitReview } from '../../hooks/useReview'
import { canSubmit, getBlockingIssues } from '../../lib/submissionLogic'
import { getApiErrorMessage } from '../../../../api/errors'
import { cn } from '../../../../lib/cn'
import { ThemeToggle } from '../../../../shared/components/ThemeToggle/ThemeToggle'
import type { ReviewStatus } from '../../../../api/types'
import { SubmitBarPropsSchema, type SubmitBarProps } from '../../schemas/componentProps'

// ── Step indicator ────────────────────────────────────────────

const STEPS = ['Upload', 'Processing', 'Review', 'Submitted'] as const

function statusToStepIndex(status: ReviewStatus): number {
  switch (status) {
    case 'created':
      return 0
    case 'processing':
      return 1
    case 'on_review':
      return 2
    case 'submitted':
      return 3
  }
}

const StepIndicator = memo(function StepIndicator({ status }: { readonly status: ReviewStatus }) {
  const currentIndex = statusToStepIndex(status)

  return (
    <nav className="step-indicator" aria-label="Review progress">
      {STEPS.map((label, i) => {
        const done = i < currentIndex
        const current = i === currentIndex
        return (
          <Fragment key={label}>
            {i > 0 && (
              <div
                className={cn('step-indicator__connector', {
                  'step-indicator__connector--filled': i <= currentIndex,
                })}
                aria-hidden="true"
              />
            )}
            <div
              className={cn('step-indicator__step', {
                'step-indicator__step--done': done,
                'step-indicator__step--current': current,
              })}
              aria-current={current ? 'step' : undefined}
            >
              <span className="step-indicator__dot" aria-hidden="true">
                {done ? <Check size={8} strokeWidth={3} /> : null}
              </span>
              <span className="step-indicator__label">{label}</span>
            </div>
          </Fragment>
        )
      })}
    </nav>
  )
})

// ── SubmitBar ─────────────────────────────────────────────────

/**
 * Header bar with:
 * - Dynamic page title via useEffect (document.title) — synced to reviewName
 * - Step indicator showing the full review workflow (Upload → Processing → Review → Submitted)
 * - Review metadata: version, date, assigned user — visible on the second row
 * - Submit button — blocked when critical/major issues remain
 * - "Upload new version" CTA — visible when blocking issues exist, links back to /upload
 *
 * Layout: 2-row header so metadata + stepper don't compete with actions for space.
 * Submit uses aria-disabled (not just disabled) so keyboard users can still reach it
 * and screen readers can announce why it's blocked via aria-describedby.
 */
export const SubmitBar = memo(function SubmitBar(rawProps: SubmitBarProps) {
  const { reviewId, reviewName, version, status, uploadedAt, userName, issues } =
    SubmitBarPropsSchema.parse(rawProps)
  const ignoredIssues = useReviewStore(state => state.ignoredIssues)
  const { mutate: submit, isPending, isSuccess, isError, error: submitError } = useSubmitReview()
  const blockingDescId = useId()

  const blockingIssues = useMemo(
    () => getBlockingIssues(issues, ignoredIssues),
    [issues, ignoredIssues]
  )

  const submitAllowed = useMemo(() => canSubmit(issues, ignoredIssues), [issues, ignoredIssues])

  const handleSubmit = useCallback(() => {
    if (!submitAllowed || isPending) return
    submit(reviewId)
  }, [submitAllowed, isPending, submit, reviewId])

  useEffect(() => {
    document.title = `${reviewName} — Review`
    return () => {
      document.title = 'Document Review — HomeVision'
    }
  }, [reviewName])

  const formattedDate = useMemo(
    () =>
      new Date(uploadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [uploadedAt]
  )

  return (
    <>
      <header className="submit-bar" role="banner">
        {/* Row 1: doc name + actions */}
        <div className="submit-bar__row submit-bar__row--main">
          <h1 className="submit-bar__name" title={reviewName}>
            {reviewName}
          </h1>

          <div className="submit-bar__actions">
            <ThemeToggle />
            {!submitAllowed && (
              <p id={blockingDescId} className="submit-bar__blocking-msg" role="alert">
                <XCircle size={14} aria-hidden="true" />
                {blockingIssues.length} issue{blockingIssues.length > 1 ? 's' : ''} blocking
              </p>
            )}

            {isSuccess && (
              <p className="submit-bar__success-msg">
                <CheckCircle size={14} aria-hidden="true" />
                Submitted
              </p>
            )}

            {isError && (
              <p className="submit-bar__blocking-msg" role="alert">
                <XCircle size={14} aria-hidden="true" />
                {getApiErrorMessage(submitError, 'Failed to submit review')}
              </p>
            )}

            {!submitAllowed && (
              <Link
                to="/upload"
                className="btn btn--secondary btn--icon-mobile"
                aria-label="Upload a new document version"
              >
                <Upload size={14} aria-hidden="true" />
                <span>Upload new version</span>
              </Link>
            )}

            <button
              type="button"
              className={cn('btn btn--primary', { 'btn--disabled': !submitAllowed || isPending })}
              onClick={handleSubmit}
              aria-disabled={!submitAllowed || isPending}
              aria-describedby={!submitAllowed ? blockingDescId : undefined}
            >
              {isPending ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </div>

        {/* Row 2: step indicator + metadata */}
        <div className="submit-bar__row submit-bar__row--sub">
          <StepIndicator status={status} />

          <div className="submit-bar__meta" aria-label="Document info">
            <span className="submit-bar__version">v{version}</span>
            <span className="submit-bar__separator" aria-hidden="true">
              ·
            </span>
            <span className="submit-bar__date">{formattedDate}</span>
            <span
              className="submit-bar__separator submit-bar__separator--hide-mobile"
              aria-hidden="true"
            >
              ·
            </span>
            <span className="submit-bar__user submit-bar__user--hide-mobile">{userName}</span>
          </div>
        </div>
      </header>
    </>
  )
})

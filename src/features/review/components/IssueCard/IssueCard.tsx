import { memo, useCallback } from 'react'
import { FileText, EyeOff, Eye } from 'lucide-react'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import { useReviewStore } from '../../store/reviewStore'
import { cn } from '../../../../lib/cn'
import type { Issue } from '../../../../api/types'

interface IssueCardProps {
  /** The issue to display, including severity, description, and page reference. */
  readonly issue: Issue
  /** Whether this card is the currently active issue (highlighted, scrolled into view). */
  readonly isActive: boolean
}

/**
 * Renders a single issue.
 * - Clicking the card jumps to the corresponding PDF page via Zustand
 * - Minor issues can be individually ignored/unignored
 * - Wrapped in React.memo — up to 25 cards render in the list
 */
export const IssueCard = memo(function IssueCard({ issue, isActive }: IssueCardProps) {
  // Granular selectors — each card re-renders only when its own ignored state or
  // the actions it uses change, not on every setCurrentPage call during scroll.
  const ignored = useReviewStore(state => state.ignoredIssues.has(issue.id))
  const setCurrentPage = useReviewStore(state => state.setCurrentPage)
  const ignoreIssue = useReviewStore(state => state.ignoreIssue)
  const unignoreIssue = useReviewStore(state => state.unignoreIssue)
  const setActiveMobileTab = useReviewStore(state => state.setActiveMobileTab)

  const handleJumpToPage = useCallback(() => {
    setCurrentPage(issue.page)
    // On mobile, switch to the document panel so the user can see the PDF page
    setActiveMobileTab('document')
  }, [issue.page, setCurrentPage, setActiveMobileTab])

  const handleToggleIgnore = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // don't trigger handleJumpToPage
      if (ignored) {
        unignoreIssue(issue.id)
      } else {
        ignoreIssue(issue.id)
      }
    },
    [ignored, issue.id, ignoreIssue, unignoreIssue]
  )

  return (
    <div
      className={cn('issue-card', `issue-card--${issue.severity}`, {
        'issue-card--active': isActive,
        'issue-card--ignored': ignored,
      })}
      onClick={handleJumpToPage}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleJumpToPage()}
      aria-label={`${issue.title}, ${issue.severity} severity, page ${issue.page}`}
    >
      <div className="issue-card__header">
        <StatusBadge severity={issue.severity} />
        <div className="issue-card__page">
          <FileText size={12} aria-hidden="true" />
          <span>Page {issue.page}</span>
        </div>
      </div>

      <h3 className="issue-card__title">{issue.title}</h3>
      <p className="issue-card__description">{issue.description}</p>

      {issue.severity === 'minor' && (
        <button
          type="button"
          className={cn('issue-card__ignore-btn', { 'issue-card__ignore-btn--active': ignored })}
          onClick={handleToggleIgnore}
          aria-label={ignored ? `Unignore: ${issue.title}` : `Ignore: ${issue.title}`}
        >
          {ignored ? (
            <>
              <Eye size={13} aria-hidden="true" /> Unignore
            </>
          ) : (
            <>
              <EyeOff size={13} aria-hidden="true" /> Ignore
            </>
          )}
        </button>
      )}
    </div>
  )
})

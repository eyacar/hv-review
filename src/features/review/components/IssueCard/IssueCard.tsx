import { memo, useCallback } from 'react'
import { FileText, EyeOff, Eye } from 'lucide-react'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import { useReviewStore } from '../../store/reviewStore'
import { cn } from '../../../../lib/cn'
import type { Issue } from '../../../../api/types'

interface IssueCardProps {
  issue: Issue
  isActive: boolean
}

/**
 * Renders a single issue.
 * - Clicking the card jumps to the corresponding PDF page via Zustand
 * - Minor issues can be individually ignored/unignored
 * - Wrapped in React.memo — up to 25 cards render in the list
 */
export const IssueCard = memo(function IssueCard({ issue, isActive }: IssueCardProps) {
  const { setCurrentPage, ignoreIssue, unignoreIssue, isIgnored, setActiveMobileTab } =
    useReviewStore()
  const ignored = isIgnored(issue.id)

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
    <article
      className={cn('issue-card', `issue-card--${issue.severity}`, {
        'issue-card--active': isActive,
        'issue-card--ignored': ignored,
      })}
      onClick={handleJumpToPage}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleJumpToPage()}
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
    </article>
  )
})

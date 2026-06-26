import { memo, useMemo } from 'react'
import { IssueCard } from '../IssueCard/IssueCard'
import { useReviewStore } from '../../store/reviewStore'
import type { Issue, IssueSeverity } from '../../../../api/types'

interface IssuesPanelProps {
  issues: Issue[]
}

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'major', 'minor']

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
}

/**
 * Sidebar panel showing all issues grouped by severity.
 * Uses aria-live so screen readers announce changes to the list.
 */
export const IssuesPanel = memo(function IssuesPanel({ issues }: IssuesPanelProps) {
  const currentPage = useReviewStore(state => state.currentPage)

  const grouped = useMemo(() => {
    return SEVERITY_ORDER.reduce<Record<IssueSeverity, Issue[]>>(
      (acc, severity) => {
        acc[severity] = issues.filter(i => i.severity === severity)
        return acc
      },
      { critical: [], major: [], minor: [] }
    )
  }, [issues])

  const totalCount = issues.length

  return (
    <aside className="issues-panel" aria-label="Issues panel">
      <div className="issues-panel__header">
        <h2 className="issues-panel__title">Issues</h2>
        <span className="issues-panel__count" aria-label={`${totalCount} issues found`}>
          {totalCount}
        </span>
      </div>

      <div className="issues-panel__list" role="status" aria-live="polite" aria-label="Issue list">
        {SEVERITY_ORDER.map(severity => {
          const group = grouped[severity]
          if (group.length === 0) return null

          return (
            <section key={severity} className="issues-panel__group">
              <h3 className="issues-panel__group-label">
                {SEVERITY_LABELS[severity]}
                <span className="issues-panel__group-count">{group.length}</span>
              </h3>

              {group.map(issue => (
                <IssueCard key={issue.id} issue={issue} isActive={issue.page === currentPage} />
              ))}
            </section>
          )
        })}
      </div>
    </aside>
  )
})

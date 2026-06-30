import { memo, useMemo, useState } from 'react'
import { IssueCard } from '../IssueCard/IssueCard'
import { useReviewStore } from '../../store/reviewStore'
import { cn } from '../../../../lib/cn'
import type { Issue, IssueSeverity } from '../../../../api/types'
import { IssuesPanelPropsSchema, type IssuesPanelProps } from '../../schemas/componentProps'

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'major', 'minor']

const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
}

type Filter = 'all' | IssueSeverity

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
]

/**
 * Sidebar panel showing all issues grouped by severity.
 * Filter tabs let users focus on a specific severity without scrolling.
 * Uses aria-live so screen readers announce changes to the list.
 */
export const IssuesPanel = memo(function IssuesPanel(rawProps: IssuesPanelProps) {
  const { issues } = IssuesPanelPropsSchema.parse(rawProps)
  const currentPage = useReviewStore(state => state.currentPage)
  const [filter, setFilter] = useState<Filter>('all')

  // Filter tabs narrow the list only — submission gating in SubmitBar always uses the full issue set.
  // Re-bucket by severity (not just filtered) so rendering below can always iterate
  // SEVERITY_ORDER and get a fixed critical → major → minor grouping with section headers.
  const grouped = useMemo(() => {
    const source = filter === 'all' ? issues : issues.filter(i => i.severity === filter)
    return SEVERITY_ORDER.reduce<Record<IssueSeverity, Issue[]>>(
      (acc, severity) => {
        acc[severity] = source.filter(i => i.severity === severity)
        return acc
      },
      { critical: [], major: [], minor: [] }
    )
  }, [issues, filter])

  // Counts are computed from the unfiltered `issues` (not `grouped`) so filter button
  // badges always show totals — they shouldn't shrink just because a filter is active.
  const counts = useMemo(
    () =>
      SEVERITY_ORDER.reduce<Record<IssueSeverity, number>>(
        (acc, s) => {
          acc[s] = issues.filter(i => i.severity === s).length
          return acc
        },
        { critical: 0, major: 0, minor: 0 }
      ),
    [issues]
  )

  // Filter is 'all' | IssueSeverity; the cast is safe once 'all' is excluded by the ternary.
  const visibleCount = filter === 'all' ? issues.length : counts[filter as IssueSeverity]

  return (
    <aside className="issues-panel" aria-label="Issues panel">
      <div className="issues-panel__header">
        <div className="issues-panel__title-row">
          <h2 className="issues-panel__title">Issues</h2>
          <span className="issues-panel__count" aria-label={`${issues.length} issues found`}>
            {issues.length}
          </span>
        </div>

        <div className="issues-panel__filters" role="group" aria-label="Filter by severity">
          {FILTER_OPTIONS.map(({ value, label }) => {
            const count = value === 'all' ? issues.length : counts[value as IssueSeverity]
            return (
              <button
                key={value}
                type="button"
                className={cn('issues-panel__filter-btn', {
                  'issues-panel__filter-btn--active': filter === value,
                  [`issues-panel__filter-btn--${value}`]: value !== 'all',
                })}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {label}
                {count > 0 && <span className="issues-panel__filter-count">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div
        className="issues-panel__list"
        role="status"
        aria-live="polite"
        aria-label={`${visibleCount} issues shown`}
      >
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

        {visibleCount === 0 && (
          <p className="issues-panel__empty">No {filter !== 'all' ? filter : ''} issues found.</p>
        )}
      </div>
    </aside>
  )
})

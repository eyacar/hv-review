import type { Issue } from '../../../api/types'

const BLOCKING_SEVERITIES = new Set<Issue['severity']>(['critical', 'major'])

/** Critical and major issues that have not been ignored block submission. */
export function getBlockingIssues(
  issues: readonly Issue[],
  ignoredIds: ReadonlySet<string>
): Issue[] {
  return issues.filter(i => BLOCKING_SEVERITIES.has(i.severity) && !ignoredIds.has(i.id))
}

export function canSubmit(issues: readonly Issue[], ignoredIds: ReadonlySet<string>): boolean {
  return getBlockingIssues(issues, ignoredIds).length === 0
}

export function getBlockingCount(
  issues: readonly Issue[],
  ignoredIds: ReadonlySet<string>
): number {
  return getBlockingIssues(issues, ignoredIds).length
}

/**
 * Pure unit tests for the submission-gating logic.
 *
 * These tests verify the core business rule:
 *   "A review cannot be submitted while unignored critical or major issues remain."
 */
import { describe, it, expect } from 'vitest'
import type { Issue } from '../../../api/types'
import { canSubmit, getBlockingIssues, getBlockingCount } from '../lib/submissionLogic'

// ── Fixtures ──────────────────────────────────────────────────

const critical: Issue = {
  id: 'c1',
  title: 'Critical issue',
  description: '',
  severity: 'critical',
  page: 1,
}
const major: Issue = { id: 'm1', title: 'Major issue', description: '', severity: 'major', page: 2 }
const minor: Issue = { id: 'n1', title: 'Minor issue', description: '', severity: 'minor', page: 3 }

// ── Tests ─────────────────────────────────────────────────────

describe('submission gating', () => {
  it('blocks when a critical issue is present', () => {
    expect(canSubmit([critical], new Set())).toBe(false)
  })

  it('blocks when a major issue is present', () => {
    expect(canSubmit([major], new Set())).toBe(false)
  })

  it('allows submission when only minor issues remain', () => {
    expect(canSubmit([minor], new Set())).toBe(true)
  })

  it('allows submission with no issues at all', () => {
    expect(canSubmit([], new Set())).toBe(true)
  })

  it('allows submission after all blocking issues are ignored', () => {
    expect(canSubmit([critical, major, minor], new Set(['c1', 'm1']))).toBe(true)
  })

  it('still blocks when only some blocking issues are ignored', () => {
    expect(canSubmit([critical, major], new Set(['c1']))).toBe(false)
  })

  it('ignoring a minor issue has no effect on submission eligibility', () => {
    expect(canSubmit([minor], new Set(['n1']))).toBe(true)
  })

  it('returns correct blocking count for display', () => {
    const issues = [critical, major, minor]
    expect(getBlockingIssues(issues, new Set())).toHaveLength(2)
    expect(getBlockingIssues(issues, new Set(['c1']))).toHaveLength(1)
    expect(getBlockingIssues(issues, new Set(['c1', 'm1']))).toHaveLength(0)
    expect(getBlockingCount(issues, new Set())).toBe(2)
    expect(getBlockingCount(issues, new Set(['c1', 'm1']))).toBe(0)
  })
})

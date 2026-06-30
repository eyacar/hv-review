import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SubmitBar } from './SubmitBar'
import type { Issue } from '../../../../api/types'

const mockSubmit = vi.fn()

vi.mock('../../hooks/useReview', () => ({
  useSubmitReview: () => ({
    mutate: mockSubmit,
    isPending: false,
    isSuccess: false,
  }),
}))

vi.mock('../../store/reviewStore', () => ({
  useReviewStore: <T,>(selector: (state: { ignoredIssues: Set<string> }) => T) =>
    selector({ ignoredIssues: new Set() }),
}))

const criticalIssue: Issue = {
  id: 'c1',
  title: 'Missing signature',
  description: '',
  severity: 'critical',
  page: 1,
}

const minorIssue: Issue = {
  id: 'n1',
  title: 'Formatting',
  description: '',
  severity: 'minor',
  page: 2,
}

const defaultProps = {
  reviewId: 'review-1',
  reviewName: 'Annual Compliance Report.pdf',
  version: 2,
  status: 'on_review' as const,
  uploadedAt: '2025-03-20T14:30:00Z',
  userName: 'Jane Cooper',
  issues: [criticalIssue],
}

function renderSubmitBar(overrides: Partial<typeof defaultProps> = {}) {
  return render(
    <MemoryRouter>
      <SubmitBar {...defaultProps} {...overrides} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SubmitBar — submission gating', () => {
  it('blocks submit while critical issues remain', () => {
    renderSubmitBar()
    expect(screen.getByRole('button', { name: /submit review/i })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/1 issue blocking/i)
  })

  it('allows submit when only minor issues remain', () => {
    renderSubmitBar({ issues: [minorIssue] })
    expect(screen.getByRole('button', { name: /submit review/i })).toHaveAttribute(
      'aria-disabled',
      'false'
    )
  })

  it('calls submit when allowed and clicked', () => {
    renderSubmitBar({ issues: [minorIssue] })
    fireEvent.click(screen.getByRole('button', { name: /submit review/i }))
    expect(mockSubmit).toHaveBeenCalledWith('review-1')
  })
})

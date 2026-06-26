/**
 * IssueCard component tests.
 *
 * Key behaviors under test:
 * - Renders title, description, severity badge, and page number
 * - Clicking the card calls setCurrentPage AND setActiveMobileTab('document')
 *   so that on mobile the Document panel becomes visible
 * - Ignore button is shown only for minor issues
 * - Clicking Ignore calls ignoreIssue; clicking Unignore calls unignoreIssue
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IssueCard } from './IssueCard'
import type { Issue } from '../../../../api/types'

// ── Zustand mock ──────────────────────────────────────────────

const mockSetCurrentPage = vi.fn()
const mockSetActiveMobileTab = vi.fn()
const mockIgnoreIssue = vi.fn()
const mockUnignoreIssue = vi.fn()
let mockIsIgnored = vi.fn(() => false)

vi.mock('../../store/reviewStore', () => ({
  useReviewStore: () => ({
    setCurrentPage: mockSetCurrentPage,
    setActiveMobileTab: mockSetActiveMobileTab,
    ignoreIssue: mockIgnoreIssue,
    unignoreIssue: mockUnignoreIssue,
    isIgnored: mockIsIgnored,
  }),
}))

// ── Fixtures ──────────────────────────────────────────────────

const criticalIssue: Issue = {
  id: 'issue-1',
  title: 'Missing appraisal signature',
  description: 'The appraiser signature is absent on page 3.',
  severity: 'critical',
  page: 3,
}

const minorIssue: Issue = {
  id: 'issue-2',
  title: 'Formatting inconsistency',
  description: 'Font size varies across sections.',
  severity: 'minor',
  page: 5,
}

// ── Tests ─────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockIsIgnored = vi.fn(() => false)
})

describe('IssueCard — rendering', () => {
  it('shows the issue title and description', () => {
    render(<IssueCard issue={criticalIssue} isActive={false} />)
    expect(screen.getByText('Missing appraisal signature')).toBeInTheDocument()
    expect(screen.getByText('The appraiser signature is absent on page 3.')).toBeInTheDocument()
  })

  it('shows the correct page number', () => {
    render(<IssueCard issue={criticalIssue} isActive={false} />)
    expect(screen.getByText('Page 3')).toBeInTheDocument()
  })

  it('applies the active class when isActive is true', () => {
    render(<IssueCard issue={criticalIssue} isActive={true} />)
    const card = screen.getByRole('button', { name: /missing appraisal signature/i })
    expect(card).toHaveClass('issue-card--active')
  })
})

describe('IssueCard — navigation', () => {
  it('calls setCurrentPage with the issue page on click', () => {
    render(<IssueCard issue={criticalIssue} isActive={false} />)
    fireEvent.click(screen.getByRole('button', { name: /missing appraisal signature/i }))
    expect(mockSetCurrentPage).toHaveBeenCalledWith(3)
  })

  it('switches to the document tab on click (mobile tab fix)', () => {
    render(<IssueCard issue={criticalIssue} isActive={false} />)
    fireEvent.click(screen.getByRole('button', { name: /missing appraisal signature/i }))
    expect(mockSetActiveMobileTab).toHaveBeenCalledWith('document')
  })

  it('navigates on Enter key', () => {
    render(<IssueCard issue={criticalIssue} isActive={false} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /missing appraisal signature/i }), {
      key: 'Enter',
    })
    expect(mockSetCurrentPage).toHaveBeenCalledWith(3)
  })
})

describe('IssueCard — ignore behavior', () => {
  it('does not show an ignore button for critical issues', () => {
    render(<IssueCard issue={criticalIssue} isActive={false} />)
    expect(screen.queryByRole('button', { name: /ignore/i })).not.toBeInTheDocument()
  })

  it('shows an ignore button for minor issues', () => {
    render(<IssueCard issue={minorIssue} isActive={false} />)
    expect(screen.getByRole('button', { name: /ignore: formatting inconsistency/i })).toBeInTheDocument()
  })

  it('calls ignoreIssue when Ignore is clicked', () => {
    render(<IssueCard issue={minorIssue} isActive={false} />)
    fireEvent.click(screen.getByRole('button', { name: /ignore: formatting inconsistency/i }))
    expect(mockIgnoreIssue).toHaveBeenCalledWith('issue-2')
  })

  it('shows Unignore and calls unignoreIssue when issue is already ignored', () => {
    mockIsIgnored = vi.fn(() => true)
    render(<IssueCard issue={minorIssue} isActive={false} />)
    const btn = screen.getByRole('button', { name: /unignore: formatting inconsistency/i })
    fireEvent.click(btn)
    expect(mockUnignoreIssue).toHaveBeenCalledWith('issue-2')
  })
})

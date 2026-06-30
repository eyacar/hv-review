import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IssuesPanel } from './IssuesPanel'
import type { Issue } from '../../../../api/types'

vi.mock('../IssueCard/IssueCard', () => ({
  IssueCard: ({ issue }: { issue: Issue }) => <div data-testid="issue-card">{issue.title}</div>,
}))

vi.mock('../../store/reviewStore', () => ({
  useReviewStore: <T,>(selector: (state: { currentPage: number }) => T) =>
    selector({ currentPage: 1 }),
}))

const issues: Issue[] = [
  {
    id: 'c1',
    title: 'Critical one',
    description: '',
    severity: 'critical',
    page: 1,
  },
  {
    id: 'm1',
    title: 'Major one',
    description: '',
    severity: 'major',
    page: 2,
  },
  {
    id: 'n1',
    title: 'Minor one',
    description: '',
    severity: 'minor',
    page: 3,
  },
]

describe('IssuesPanel — filtering', () => {
  it('shows all issues by default', () => {
    render(<IssuesPanel issues={issues} />)
    expect(screen.getAllByTestId('issue-card')).toHaveLength(3)
  })

  it('narrows the list when a severity filter is selected', () => {
    render(<IssuesPanel issues={issues} />)
    fireEvent.click(screen.getByRole('button', { name: /critical/i }))
    expect(screen.getAllByTestId('issue-card')).toHaveLength(1)
    expect(screen.getByText('Critical one')).toBeInTheDocument()
  })

  it('shows an empty state when the filter matches nothing', () => {
    render(<IssuesPanel issues={[issues[0]]} />)
    fireEvent.click(screen.getByRole('button', { name: /minor/i }))
    expect(screen.getByText(/no minor issues found/i)).toBeInTheDocument()
  })
})

/**
 * StatusBadge tests.
 *
 * WCAG 1.4.1 requires that color is never the sole means of conveying information.
 * These tests verify that each severity level is communicated through visible text,
 * not only through color or icon.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'
import type { IssueSeverity } from '../../../../api/types'

const severities: { severity: IssueSeverity; label: string }[] = [
  { severity: 'critical', label: 'Critical' },
  { severity: 'major', label: 'Major' },
  { severity: 'minor', label: 'Minor' },
]

describe('StatusBadge — WCAG 1.4.1 text alternatives', () => {
  severities.forEach(({ severity, label }) => {
    it(`renders visible text for "${severity}" severity`, () => {
      render(<StatusBadge severity={severity} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it(`has an accessible label for "${severity}" severity`, () => {
      render(<StatusBadge severity={severity} />)
      expect(screen.getByRole('generic', { name: `${label} severity` })).toBeInTheDocument()
    })
  })
})

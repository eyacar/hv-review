import { memo } from 'react'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { StatusBadgePropsSchema, type StatusBadgeProps } from '../../schemas/componentProps'

const config: Record<
  StatusBadgeProps['severity'],
  { label: string; icon: React.ReactNode; className: string }
> = {
  critical: {
    label: 'Critical',
    icon: <AlertCircle size={12} aria-hidden="true" />,
    className: 'badge--critical',
  },
  major: {
    label: 'Major',
    icon: <AlertTriangle size={12} aria-hidden="true" />,
    className: 'badge--major',
  },
  minor: {
    label: 'Minor',
    icon: <Info size={12} aria-hidden="true" />,
    className: 'badge--minor',
  },
}

/**
 * Displays issue severity as a colored badge.
 * Color is never the only indicator — icon + text are always present (WCAG 1.4.1).
 */
export const StatusBadge = memo(function StatusBadge(rawProps: StatusBadgeProps) {
  const { severity, className } = StatusBadgePropsSchema.parse(rawProps)
  const { label, icon, className: severityClass } = config[severity]

  return (
    <span className={cn('badge', severityClass, className)} aria-label={`${label} severity`}>
      {icon}
      {label}
    </span>
  )
})

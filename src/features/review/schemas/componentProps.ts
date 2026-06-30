/**
 * Runtime prop validation for review feature components.
 * Inferred types stay in sync with Zod — same pattern as the API layer.
 */
import { z } from 'zod'
import { IssueSchema, IssueSeveritySchema, ReviewStatusSchema } from '../../../api/schemas'

export const DocumentViewerPropsSchema = z.object({
  url: z.string().min(1),
  totalPages: z.number().int().positive(),
})

export const SubmitBarPropsSchema = z.object({
  reviewId: z.string().min(1),
  reviewName: z.string().min(1),
  version: z.number().int().positive(),
  status: ReviewStatusSchema,
  uploadedAt: z.string().datetime(),
  userName: z.string().min(1),
  issues: z.array(IssueSchema),
})

export const IssuesPanelPropsSchema = z.object({
  issues: z.array(IssueSchema),
})

export const IssueCardPropsSchema = z.object({
  issue: IssueSchema,
  isActive: z.boolean(),
})

export const StatusBadgePropsSchema = z.object({
  severity: IssueSeveritySchema,
  className: z.string().optional(),
})

export type DocumentViewerProps = z.infer<typeof DocumentViewerPropsSchema>
export type SubmitBarProps = z.infer<typeof SubmitBarPropsSchema>
export type IssuesPanelProps = z.infer<typeof IssuesPanelPropsSchema>
export type IssueCardProps = z.infer<typeof IssueCardPropsSchema>
export type StatusBadgeProps = z.infer<typeof StatusBadgePropsSchema>

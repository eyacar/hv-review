/**
 * Zod schemas for all API types.
 * These are the single source of truth — TypeScript types in types.ts are inferred from here.
 * Using Zod means API responses are validated at runtime, not just at compile time.
 */
import { z } from 'zod'

export const IssueSeveritySchema = z.enum(['critical', 'major', 'minor'])

export const ReviewStatusSchema = z.enum(['created', 'processing', 'on_review', 'submitted'])

export const IssueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  severity: IssueSeveritySchema,
  page: z.number().int().positive(),
})

export const DocumentPageSchema = z.object({
  page_num: z.number().int().positive(),
  height: z.number().positive(),
  width: z.number().positive(),
})

export const ReviewDocumentSchema = z.object({
  pdf_url: z.string().min(1),
  pages: z.array(DocumentPageSchema).min(1),
})

export const ReviewUserSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
})

export const ReviewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  uploaded_at: z.string().datetime(),
  status: ReviewStatusSchema,
  version: z.number().int().positive(),
  document: ReviewDocumentSchema,
  user: ReviewUserSchema,
  issues: z.array(IssueSchema),
})

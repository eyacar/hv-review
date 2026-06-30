/**
 * All TypeScript types are inferred from Zod schemas in schemas.ts.
 * This ensures compile-time types and runtime validation stay in sync.
 */
import type { z } from 'zod'
import type {
  IssueSeveritySchema,
  ReviewStatusSchema,
  IssueSchema,
  DocumentPageSchema,
  ReviewDocumentSchema,
  ReviewUserSchema,
  ReviewSchema,
} from './schemas'

export type IssueSeverity = z.infer<typeof IssueSeveritySchema>
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>
export type Issue = z.infer<typeof IssueSchema>
export type DocumentPage = z.infer<typeof DocumentPageSchema>
export type ReviewDocument = z.infer<typeof ReviewDocumentSchema>
export type ReviewUser = z.infer<typeof ReviewUserSchema>
export type Review = z.infer<typeof ReviewSchema>

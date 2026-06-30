import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getReview, submitReview, MOCK_REVIEW_ID } from './review'

describe('getReview', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns the mock review when the ID matches', async () => {
    const promise = getReview(MOCK_REVIEW_ID)
    await vi.runAllTimersAsync()
    const review = await promise

    expect(review.id).toBe(MOCK_REVIEW_ID)
    expect(review.document.pdf_url).toContain('example_document.pdf')
    expect(review.issues.length).toBeGreaterThan(0)
  })

  it('throws when the review ID is not found', async () => {
    const promise = getReview('unknown-review-id')
    const assertion = expect(promise).rejects.toThrow(/Review not found/)
    await vi.runAllTimersAsync()
    await assertion
  })

  it('throws when the ID is empty', async () => {
    await expect(getReview('')).rejects.toThrow(/Review ID is required/)
  })
})

describe('submitReview', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves for a valid review ID', async () => {
    const promise = submitReview(MOCK_REVIEW_ID)
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBeUndefined()
  })

  it('throws when the review ID is not found', async () => {
    const promise = submitReview('unknown-review-id')
    const assertion = expect(promise).rejects.toThrow(/Review not found/)
    await vi.runAllTimersAsync()
    await assertion
  })
})

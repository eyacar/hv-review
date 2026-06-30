import { describe, it, expect } from 'vitest'
import { resolveAssetUrl } from './assets'

describe('resolveAssetUrl', () => {
  it('prefixes root-relative paths with BASE_URL', () => {
    expect(resolveAssetUrl('/example_document.pdf')).toBe(
      `${import.meta.env.BASE_URL}example_document.pdf`
    )
  })

  it('passes through absolute https URLs unchanged', () => {
    const url = 'https://cdn.example.com/doc.pdf'
    expect(resolveAssetUrl(url)).toBe(url)
  })
})

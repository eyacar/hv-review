/**
 * Resolve a static asset path against Vite's BASE_URL.
 * Absolute http(s) URLs pass through unchanged.
 */
export function resolveAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${normalized}`
}

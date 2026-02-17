/**
 * Preload image URLs so they are in the browser cache.
 * Use when you want to "load everything on first page load" or prefetch on nav hover.
 */

export function preloadImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return Promise.resolve()
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve() // don't fail the whole batch
          img.src = url
        })
    )
  ).then(() => undefined)
}

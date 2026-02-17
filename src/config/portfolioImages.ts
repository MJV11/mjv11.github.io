/**
 * Central config for which sections have carousel images and how to load them.
 *
 * To add a section:
 * 1. Create src/data/sectionImages/<sectionId>.ts that default-exports string[] (image URLs).
 * 2. Add the section id to SECTIONS_WITH_IMAGES and a loader in loaders below.
 *
 * Loading: getSectionImageUrls(section) loads that section on demand.
 * All section images are loaded on initial site load via PortfolioImagesProvider.
 */

export const SECTIONS_WITH_IMAGES = ['bikes', 'works'] as const
export type SectionWithImages = (typeof SECTIONS_WITH_IMAGES)[number]

type SectionImageLoader = () => Promise<string[]>

const loaders: Record<string, SectionImageLoader> = {
  bikes: () => import('../data/sectionImages/bikes').then((m) => m.default),
  works: () => import('../data/sectionImages/works').then((m) => m.default),
}

/**
 * Returns a promise of image URL strings for the given section.
 * Resolves to [] if the section has no images or is unknown.
 */
export async function getSectionImageUrls(sectionId: string): Promise<string[]> {
  const load = loaders[sectionId]
  if (!load) return []
  try {
    return await load()
  } catch {
    return []
  }
}

/**
 * Call this to preload all section images (e.g. on first page load or in requestIdleCallback).
 * Use with preloadImages() from utils/preloadImages to actually fetch and cache the image files.
 */
export async function getAllSectionImageUrls(): Promise<string[]> {
  const bySection = await getAllSectionImageUrlsBySection()
  return Object.values(bySection).flat()
}

/**
 * Load all section image URLs in parallel; returns a map sectionId -> urls.
 * Used by PortfolioImagesProvider to load everything on initial site load.
 */
export async function getAllSectionImageUrlsBySection(): Promise<Record<string, string[]>> {
  const results = await Promise.all(
    SECTIONS_WITH_IMAGES.map(async (id) => {
      const urls = await getSectionImageUrls(id)
      return { id, urls }
    })
  )
  return Object.fromEntries(results.map(({ id, urls }) => [id, urls]))
}

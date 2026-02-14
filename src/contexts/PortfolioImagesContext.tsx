import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { getAllSectionImageUrlsBySection } from '../config/portfolioImages'
import { preloadImages } from '../utils/preloadImages'

export interface PortfolioImagesContextValue {
  /** Section id -> image URL list. Populated once all sections have loaded. */
  imagesBySection: Record<string, string[]>
  /** True after all section URLs are loaded and all image files have been preloaded. */
  isReady: boolean
}

const PortfolioImagesContext = createContext<PortfolioImagesContextValue | null>(
  null
)

export function PortfolioImagesProvider({ children }: { children: ReactNode }) {
  const [imagesBySection, setImagesBySection] = useState<
    Record<string, string[]>
  >({})
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    getAllSectionImageUrlsBySection()
      .then((bySection) => {
        if (cancelled) return
        setImagesBySection(bySection)
        return preloadImages(Object.values(bySection).flat())
      })
      .then(() => {
        if (!cancelled) setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) setIsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PortfolioImagesContext.Provider
      value={{ imagesBySection, isReady }}
    >
      {children}
    </PortfolioImagesContext.Provider>
  )
}

export function usePortfolioImagesContext() {
  const ctx = useContext(PortfolioImagesContext)
  if (!ctx)
    throw new Error(
      'usePortfolioImagesContext must be used within PortfolioImagesProvider'
    )
  return ctx
}

/**
 * Returns images for the given section (URL-driven). No per-page loading:
 * images come from the provider's cache, which is filled on initial site load.
 */
export function usePortfolioImages(sectionId: string | null): {
  images: string[]
  isLoading: boolean
} {
  const { imagesBySection, isReady } = usePortfolioImagesContext()
  const images = sectionId ? imagesBySection[sectionId] ?? [] : []
  return { images, isLoading: !isReady }
}

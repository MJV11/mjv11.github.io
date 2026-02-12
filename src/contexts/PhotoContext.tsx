import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const bgImages = (
  Object.values(
    import.meta.glob<{ default: string }>('../assets/images/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
      eager: true,
    })
  ) as { default: string }[]
).map((m) => m.default)

interface PhotoContextValue {
  images: string[]
  currentIndex: number
  currentImage: string | null
  imageCount: number
  next: () => void
  prev: () => void
}

const PhotoContext = createContext<PhotoContextValue | null>(null)

export const PhotoProvider = ({ children }: { children: ReactNode }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % bgImages.length)
  }, [])

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + bgImages.length) % bgImages.length)
  }, [])

  const value: PhotoContextValue = {
    images: bgImages,
    currentIndex,
    currentImage: bgImages[currentIndex] ?? null,
    imageCount: bgImages.length,
    next,
    prev,
  }

  return <PhotoContext.Provider value={value}>{children}</PhotoContext.Provider>
}

export const usePhoto = () => {
  const ctx = useContext(PhotoContext)
  if (!ctx) throw new Error('usePhoto must be used within PhotoProvider')
  return ctx
}

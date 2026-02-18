import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface ColorPalette {
  tones: [string, string, string, string]
}

const DEFAULT_PALETTE: ColorPalette = {
  tones: ['#fafafa', '#f9f9f9', '#eeeeee', '#f5f5f5'],
}

interface ColorContextValue {
  palette: ColorPalette
  setPalette: (palette: ColorPalette) => void
  setTone: (index: 0 | 1 | 2 | 3, color: string) => void
  clearPalette: () => void
}

const ColorContext = createContext<ColorContextValue | null>(null)

export const ColorProvider = ({ children }: { children: ReactNode }) => {
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTE)

  const setTone = useCallback((index: 0 | 1 | 2 | 3, color: string) => {
    setPalette(prev => {
      const tones = [...prev.tones] as [string, string, string, string]
      tones[index] = color
      return { tones }
    })
  }, [])

  const clearPalette = useCallback(() => {
    setPalette(DEFAULT_PALETTE)
  }, [])

  return (
    <ColorContext.Provider value={{ palette, setPalette, setTone, clearPalette }}>
      {children}
    </ColorContext.Provider>
  )
}

export const useColor = () => {
  const ctx = useContext(ColorContext)
  if (!ctx) throw new Error('useColor must be used within ColorProvider')
  return ctx
}

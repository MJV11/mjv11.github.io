import { useState, useCallback, useEffect } from 'react'
import { works } from '../data/works'
import type { Work } from '../data/works'
import { useColor } from '../contexts/ColorContext'

export function useWorksState(isWorksPage: boolean) {
  const [worksIndex, setWorksIndex] = useState(0)
  const [selectedWork, setSelectedWork] = useState<string | null>(null)
  const { clearPalette } = useColor()

  // Reset when navigating away from the works page
  useEffect(() => {
    if (!isWorksPage) {
      setSelectedWork(null)
      setWorksIndex(0)
      clearPalette()
    }
  }, [isWorksPage, clearPalette])

  const isExpanded = isWorksPage && selectedWork !== null
  const currentWork: Work | null = isWorksPage ? works[worksIndex] ?? null : null
  const expandedWork: Work | null =
    isWorksPage && selectedWork
      ? works.find((w) => w.id === selectedWork) ?? null
      : null

  const handleIndexChange = useCallback(
    (index: number) => {
      if (isWorksPage) setWorksIndex(index)
    },
    [isWorksPage],
  )

  const handleImageClick = useCallback(() => {
    if (isWorksPage && currentWork) {
      setSelectedWork(currentWork.id)
    }
  }, [isWorksPage, currentWork])

  const handleCloseDetails = useCallback(() => {
    clearPalette()
    setSelectedWork(null)
  }, [clearPalette])

  const overlayLabel =
    isWorksPage && currentWork
      ? { title: currentWork.title, subtitle: currentWork.subtitle }
      : null

  return {
    isExpanded,
    currentWork,
    expandedWork,
    overlayLabel,
    handleIndexChange,
    handleImageClick,
    handleCloseDetails,
  }
}

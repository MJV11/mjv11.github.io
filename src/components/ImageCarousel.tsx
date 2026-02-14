import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { PiCaretRightBold, PiCaretLeftBold } from 'react-icons/pi'
import { CornerBorders } from '../utils'
import { createScene, totalDuration, TRANSITION_DURATION } from '../utils/slideTransition'

function loadImage(
  url: string,
  onLoad: (img: HTMLImageElement) => void,
  onError?: () => void
): void {
  const loader = new THREE.ImageLoader()
  loader.setCrossOrigin('Anonymous')
  loader.load(url, onLoad, undefined, onError)
}

interface ImageCarouselProps {
  images: string[]
  className?: string
  /** Optional: control size. Defaults to a large viewport so the slide effect is fully visible. */
  sizeClassName?: string
  /**
   * Scale factor for the Three.js canvas relative to the visible area.
   * Values > 1 make the canvas larger than the visible container (overflow is clipped),
   * so the image appears at a more natural / full size instead of being shrunk.
   * e.g. 2.5 means the canvas is 250 % of the visible area in each dimension.
   */
  canvasScale?: number
}

export function ImageCarousel({ images, className = '', sizeClassName = 'w-[90vw] min-w-[280px] h-[75vh] min-h-[320px]', canvasScale = 1 }: ImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null)
  const displayedIndexRef = useRef<number>(0)
  const settledImageRef = useRef<HTMLImageElement | null>(null)
  const pendingIndexRef = useRef<number | null>(null)
  const isTransitioningRef = useRef(false)
  const isReadyRef = useRef(false)
  const mountedRef = useRef(false)
  const transitionIdRef = useRef(0)
  const initLoadIdRef = useRef(0)
  const activeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const nextTransitionRafRef = useRef<number | null>(null)

  const [currentIndex, setCurrentIndex] = useState(0)

  const runNextTransitionRef = useRef<() => void>(() => { })

  const scheduleRunNext = () => {
    if (nextTransitionRafRef.current !== null) {
      window.cancelAnimationFrame(nextTransitionRafRef.current)
    }
    nextTransitionRafRef.current = window.requestAnimationFrame(() => {
      nextTransitionRafRef.current = null
      runNextTransitionRef.current()
    })
  }

  runNextTransitionRef.current = () => {
    if (!mountedRef.current || isTransitioningRef.current) return
    const currentScene = sceneRef.current
    if (!currentScene) return

    const nextIndex = pendingIndexRef.current
    if (nextIndex === null) return
    if (displayedIndexRef.current === nextIndex) {
      pendingIndexRef.current = null
      return
    }
    const nextImageUrl = images[nextIndex]
    if (!nextImageUrl) {
      pendingIndexRef.current = null
      return
    }
    pendingIndexRef.current = null
    isTransitioningRef.current = true
    transitionIdRef.current += 1
    const transitionId = transitionIdRef.current

    loadImage(nextImageUrl, (img) => {
      if (!mountedRef.current || !sceneRef.current || transitionId !== transitionIdRef.current) {
        isTransitioningRef.current = false
        return
      }

      // slideOut is already visible with the settled image on the cloth.
      // Prepare it for disassembly and set up slideIn with the new image.
      if (settledImageRef.current) {
        currentScene.slideOut.setImage(settledImageRef.current)
      }
      currentScene.slideOut.setTime(0)
      currentScene.slideIn.setTime(0)
      currentScene.slideIn.setImage(img)
      currentScene.slideIn.mesh.visible = true

      const outProxy = { t: 0 }
      const inProxy = { t: 0 }

      const tl = gsap.timeline({
        onComplete: () => {
          tl.kill()
          if (!mountedRef.current || !sceneRef.current || transitionId !== transitionIdRef.current) {
            isTransitioningRef.current = false
            return
          }

          // Transition done — swap new image onto slideOut (the settled cloth)
          currentScene.slideOut.setImage(img)
          currentScene.slideOut.setTime(0)
          currentScene.slideOut.mesh.visible = true
          currentScene.slideIn.mesh.visible = false

          settledImageRef.current = img
          displayedIndexRef.current = nextIndex
          activeTimelineRef.current = null
          isTransitioningRef.current = false
          scheduleRunNext()
        },
      })

      tl.to(
        outProxy,
        {
          t: totalDuration,
          duration: TRANSITION_DURATION,
          ease: 'none',
          onUpdate: () => currentScene.slideOut.setTime(outProxy.t),
        },
        0
      )

      tl.to(
        inProxy,
        {
          t: totalDuration,
          duration: TRANSITION_DURATION,
          ease: 'none',
          onUpdate: () => currentScene.slideIn.setTime(inProxy.t),
        },
        0
      )

      activeTimelineRef.current = tl
    }, () => {
      if (transitionId !== transitionIdRef.current) return
      isTransitioningRef.current = false
      scheduleRunNext()
    })
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container || !images.length) return

    mountedRef.current = true
    const scene = createScene(container)
    sceneRef.current = scene

    const resizeObserver = new ResizeObserver(() => {
      sceneRef.current?.resize()
    })
    resizeObserver.observe(container)

    initLoadIdRef.current += 1
    const initLoadId = initLoadIdRef.current
    const firstUrl = images[0]
    loadImage(firstUrl, (img) => {
      if (!mountedRef.current || initLoadId !== initLoadIdRef.current || !sceneRef.current) return
      // slideOut at time=0 is the settled cloth-rippling image
      scene.slideOut.setImage(img)
      scene.slideOut.setTime(0)
      scene.slideOut.mesh.visible = true
      scene.slideIn.setTime(0)
      scene.slideIn.mesh.visible = false
      settledImageRef.current = img
      displayedIndexRef.current = 0
      isReadyRef.current = true
      runNextTransitionRef.current()
    })

    return () => {
      resizeObserver.disconnect()
      mountedRef.current = false
      isReadyRef.current = false
      if (activeTimelineRef.current) {
        activeTimelineRef.current.kill()
        activeTimelineRef.current = null
      }
      pendingIndexRef.current = null
      settledImageRef.current = null
      isTransitioningRef.current = false
      if (nextTransitionRafRef.current !== null) {
        window.cancelAnimationFrame(nextTransitionRafRef.current)
        nextTransitionRafRef.current = null
      }
      transitionIdRef.current += 1
      initLoadIdRef.current += 1
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || !images.length) return

    if (!isReadyRef.current) {
      pendingIndexRef.current = currentIndex
      return
    }
    if (pendingIndexRef.current === currentIndex) return
    if (!isTransitioningRef.current && displayedIndexRef.current === currentIndex) return

    pendingIndexRef.current = currentIndex
    runNextTransitionRef.current()
  }, [currentIndex, images])

  const next = useCallback(() => {
    setCurrentIndex((i) => (images.length ? (i + 1) % images.length : 0))
  }, [images.length])

  const prev = useCallback(() => {
    setCurrentIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0))
  }, [images.length])

  if (!images.length) return null

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        {/* Visible area — clips the oversized canvas */}
        <div className={`relative overflow-hidden bg-transparent ${sizeClassName} shrink-0`}>
          <div
            ref={containerRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: `${canvasScale * 100}%`, height: `${canvasScale * 100}%` }}
          />
        </div>
        <div className="relative flex flex-row items-center justify-center gap-3 p-[14px]">
          <CornerBorders className="w-4 h-4" />
          <button onClick={prev} aria-label="Previous photo">
            <PiCaretLeftBold size={24} className="text-[#1A4561] hover:text-[#E6B389]" />
          </button>
          <span className="text-[#1A4561] font-medium text-base tabular-nums">
            {currentIndex + 1} / {images.length}
          </span>
          <button onClick={next} aria-label="Next photo">
            <PiCaretRightBold size={24} className="text-[#1A4561] hover:text-[#E6B389]" />
          </button>
        </div>
      </div>
    </div>
  )
}

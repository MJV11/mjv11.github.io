import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Tween, Easing } from '@tweenjs/tween.js'
import { PiCaretRightBold, PiCaretLeftBold, PiCaretUpBold, PiCaretDownBold } from 'react-icons/pi'
import { createScene, compositeWithLabel, totalDuration, TRANSITION_DURATION } from '../utils/geometries'
import { useColor } from '../contexts/ColorContext'
import { getAtlasCanvas } from '../utils/mosaicPatterns'

/** Duration (ms) for the "rush to completion" settle when interrupted mid-transition. */
const SETTLE_MS = 400
const CUBE_ANIM_LABELS = ['cube wave', 'scatter', 'wireframe', 'rubik', 'Two Cubed', 'Three Squared', 'Sine Rings'] as const
const SCROLL_DEBOUNCE_MS = 300

/** Mouse-tilt effect constants */
const MAX_TILT_DEG = 5   // maximum rotation in either axis
const TILT_LERP = 0.035 // interpolation speed per frame (~60 fps)

function loadRawImage(
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
  sizeClassName?: string
  canvasScale?: number
  sectionId?: string
  onIndexChange?: (index: number) => void
  onImageClick?: (index: number) => void
  /** Synchronous lookup: given a carousel index, return the label to bake onto
   *  that image, or null for no label.  Called at transition-start time so
   *  the correct label is always composited regardless of render timing. */
  getLabelForIndex?: (index: number) => { title: string; subtitle?: string } | null
  /** When true, scroll/keyboard switching and navigation UI are disabled. */
  disabled?: boolean
  /** When true, renders as a field of rotating cubes (top page mode). */
  isTopMode?: boolean
}

interface TransitionState {
  outTween: Tween<{ t: number }>
  inTween: Tween<{ t: number }>
  outProxy: { t: number }
  inProxy: { t: number }
  incomingCanvas: HTMLCanvasElement
  nextIndex: number
}

/* ── Inline SVG icons for navigation hints ────────────────────────── */

function ArrowKeysIcon({ className }: { className?: string }) {
  return (
    <svg width="40" height="27" viewBox="-0.5 -3 40 27" fill="none" className={className}>
      {/* Left key */}
      <rect x="1" y="11" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M8.5 16.5L4.5 16.5M4.5 16.5L6.5 14.5M4.5 16.5L6.5 18.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* Down key */}
      <rect x="14" y="11" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M19.5 14.5L19.5 18.5M19.5 18.5L17.5 16.5M19.5 18.5L21.5 16.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right key */}
      <rect x="27" y="11" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M30.5 16.5L34.5 16.5M34.5 16.5L32.5 14.5M34.5 16.5L32.5 18.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* Up key */}
      <rect x="14" y="-1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path d="M19.5 6L19.5 2M19.5 2L17.5 4M19.5 2L21.5 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MouseScrollIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="30" viewBox="0 0 20 30" fill="none" className={className}>
      <rect x="1" y="1" width="18" height="28" rx="9" stroke="currentColor" strokeWidth="1.2" />
      <line x1="10" y1="7" x2="10" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 20L10 23L12 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A single digit slot that mechanically rolls to the given numeric character. */
function DialDigit({ char }: { char: string }) {
  if (!/^\d$/.test(char)) {
    return (
      <span className="font-medium text-base text-black leading-none">
        {char}
      </span>
    )
  }
  const n = parseInt(char)
  const cellH = 24 // px — matches text-base (16px × 1.5) line-height

  return (
    <span
      className="relative overflow-hidden inline-block"
      style={{ height: cellH, width: '1ch', verticalAlign: 'middle' }}
    >
      <span
        className="absolute inset-x-0 top-0 flex flex-col items-center text-black font-medium text-base tabular-nums transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(${-n * cellH}px)`,
          lineHeight: `${cellH}px`,
        }}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d} style={{ height: cellH }}>{d}</span>
        ))}
      </span>
    </span>
  )
}

/** Mechanical counter dial displaying "current / total". */
function DialCounter({ current, total }: { current: number; total: number }) {
  const label = `${String(current)} / ${String(total)}`
  return (
    <span
      className="inline-flex items-center font-medium text-base tabular-nums gap-2"
      style={{ height: 24 }}
    >
      {label.split(' ').map((char, i) => (
        <DialDigit key={i} char={char} />
      ))}
    </span>
  )
}

export function ImageCarousel({
  images,
  className = '',
  sizeClassName = 'w-[90vw] min-w-[280px] h-[75vh] min-h-[320px]',
  canvasScale = 1,
  sectionId,
  onIndexChange,
  onImageClick,
  getLabelForIndex,
  disabled = false,
  isTopMode = false,
}: ImageCarouselProps) {
  const { palette } = useColor()
  const containerRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const tiltWrapRef = useRef<HTMLDivElement>(null)
  const atlasTexRef = useRef<THREE.Texture | null>(null)
  const tiltTargetRef = useRef({ x: 0, y: 0 })
  const tiltCurrentRef = useRef({ x: 0, y: 0 })
  const tiltRafRef = useRef<number | null>(null)
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null)
  const displayedIndexRef = useRef<number>(0)
  /** Pre-composited canvas currently settled in slideOut. */
  const settledCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const pendingIndexRef = useRef<number | null>(null)
  const isTransitioningRef = useRef(false)
  const isReadyRef = useRef(false)
  const mountedRef = useRef(false)
  const transitionIdRef = useRef(0)
  const initLoadIdRef = useRef(0)
  const nextTransitionRafRef = useRef<number | null>(null)
  const transitionStateRef = useRef<TransitionState | null>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Set by the sectionId effect to prevent the currentIndex/images effect from double-triggering. */
  const sectionChangeHandledRef = useRef(false)
  const getLabelRef = useRef(getLabelForIndex)
  getLabelRef.current = getLabelForIndex
  /**
   * Cache of pre-composited canvases keyed by "url\0title\0subtitle".
   * Avoids re-compositing the same image+label pair on rapid navigation.
   */
  const compositedCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map())

  const [currentIndex, setCurrentIndex] = useState(0)
  const [cubeAnimMode, setCubeAnimMode] = useState(0)
  const [randomMode, setRandomMode] = useState(true)

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

  /** Load a URL, composite the label for the given index onto it, and return a cached canvas. */
  const loadLabeled = (
    url: string,
    index: number,
    onLoad: (canvas: HTMLCanvasElement) => void,
    onError?: () => void,
  ) => {
    const label = getLabelRef.current?.(index) ?? null
    const key = `${url}\x00${label?.title ?? ''}\x00${label?.subtitle ?? ''}`
    const cached = compositedCacheRef.current.get(key)
    if (cached) { onLoad(cached); return }
    loadRawImage(url, (img) => {
      const canvas = compositeWithLabel(img, label?.title, label?.subtitle)
      compositedCacheRef.current.set(key, canvas)
      onLoad(canvas)
    }, onError)
  }

  /** Settle the given pre-composited canvas into slideOut. */
  const settleToSlideOut = (canvas: HTMLCanvasElement, nextIndex: number) => {
    const scene = sceneRef.current
    if (!scene) return
    scene.slideOut.setImage(canvas)
    scene.slideOut.setTime(0)
    scene.slideOut.mesh.visible = true
    scene.slideIn.mesh.visible = false
    settledCanvasRef.current = canvas
    displayedIndexRef.current = nextIndex
    transitionStateRef.current = null
    isTransitioningRef.current = false
  }

  const stopActiveTweens = () => {
    const ts = transitionStateRef.current
    if (!ts) return
    ts.outTween.stop()
    ts.inTween.stop()
  }

  const smoothInterrupt = () => {
    const scene = sceneRef.current
    const ts = transitionStateRef.current
    transitionIdRef.current += 1
    if (!scene || !ts) {
      isTransitioningRef.current = false
      transitionStateRef.current = null
      return
    }

    stopActiveTweens()
    const transitionId = transitionIdRef.current
    const { outProxy, inProxy, incomingCanvas } = ts

    const settleOut = new Tween(outProxy, scene.tweenGroup)
      .to({ t: totalDuration }, SETTLE_MS)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => scene.slideOut.setTime(outProxy.t))

    const settleIn = new Tween(inProxy, scene.tweenGroup)
      .to({ t: totalDuration }, SETTLE_MS)
      .easing(Easing.Quadratic.Out)
      .onUpdate(() => scene.slideIn.setTime(inProxy.t))
      .onComplete(() => {
        if (!mountedRef.current || transitionId !== transitionIdRef.current) return
        settleToSlideOut(incomingCanvas, -1)
        scheduleRunNext()
      })

    transitionStateRef.current = {
      outTween: settleOut,
      inTween: settleIn,
      outProxy,
      inProxy,
      incomingCanvas: ts.incomingCanvas,
      nextIndex: ts.nextIndex,
    }

    settleOut.start()
    settleIn.start()
  }

  runNextTransitionRef.current = () => {
    if (!mountedRef.current) return
    const currentScene = sceneRef.current
    if (!currentScene) return

    if (isTransitioningRef.current) {
      smoothInterrupt()
      if (isTransitioningRef.current) return
    }

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

    loadLabeled(nextImageUrl, nextIndex, (inCanvas) => {
      if (!mountedRef.current || !sceneRef.current || transitionId !== transitionIdRef.current) {
        // Stale: a newer transition owns isTransitioningRef — don't touch it.
        return
      }
      // Re-assert in case a stale sibling callback cleared this between loads.
      isTransitioningRef.current = true

      // slideOut already holds the correct settled canvas — just reset its time.
      currentScene.slideOut.setTime(0)
      // slideIn: incoming canvas with new label already baked in.
      currentScene.slideIn.setTime(0)
      currentScene.slideIn.setImage(inCanvas)
      currentScene.slideIn.mesh.visible = true

      const outProxy = { t: 0 }
      const inProxy = { t: 0 }

      const outTween = new Tween(outProxy, currentScene.tweenGroup)
        .to({ t: totalDuration }, TRANSITION_DURATION * 1000)
        .easing(Easing.Linear.None)
        .onUpdate(() => currentScene.slideOut.setTime(outProxy.t))

      const inTween = new Tween(inProxy, currentScene.tweenGroup)
        .to({ t: totalDuration }, TRANSITION_DURATION * 1000)
        .easing(Easing.Linear.None)
        .onUpdate(() => currentScene.slideIn.setTime(inProxy.t))
        .onComplete(() => {
          if (!mountedRef.current || !sceneRef.current || transitionId !== transitionIdRef.current) {
            // Stale — a newer transition owns isTransitioningRef.
            return
          }
          settleToSlideOut(inCanvas, nextIndex)
          scheduleRunNext()
        })

      transitionStateRef.current = { outTween, inTween, outProxy, inProxy, incomingCanvas: inCanvas, nextIndex }
      outTween.start()
      inTween.start()
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

    const atlasCanvas = getAtlasCanvas()
    const atlasTex = new THREE.Texture(atlasCanvas)
    atlasTex.flipY = false
    atlasTex.generateMipmaps = false
    atlasTex.minFilter = THREE.LinearFilter
    atlasTex.magFilter = THREE.LinearFilter
    atlasTex.needsUpdate = true
    atlasTexRef.current = atlasTex
    scene.setPatternAtlas(atlasTex)

    const resizeObserver = new ResizeObserver(() => {
      sceneRef.current?.resize()
    })
    resizeObserver.observe(container)

    initLoadIdRef.current += 1
    const initLoadId = initLoadIdRef.current
    const firstUrl = images[0]
    loadLabeled(firstUrl, 0, (canvas) => {
      if (!mountedRef.current || initLoadId !== initLoadIdRef.current || !sceneRef.current) return
      scene.slideOut.setImage(canvas)
      scene.slideOut.setTime(0)
      scene.slideOut.mesh.visible = true
      scene.slideIn.setTime(0)
      scene.slideIn.mesh.visible = false
      settledCanvasRef.current = canvas
      displayedIndexRef.current = 0
      isReadyRef.current = true
      runNextTransitionRef.current()
    })

    return () => {
      resizeObserver.disconnect()
      mountedRef.current = false
      isReadyRef.current = false
      stopActiveTweens()
      transitionStateRef.current = null
      pendingIndexRef.current = null
      settledCanvasRef.current = null
      isTransitioningRef.current = false
      if (nextTransitionRafRef.current !== null) {
        window.cancelAnimationFrame(nextTransitionRafRef.current)
        nextTransitionRafRef.current = null
      }
      transitionIdRef.current += 1
      initLoadIdRef.current += 1
      atlasTexRef.current?.dispose()
      atlasTexRef.current = null
      scene.destroy()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    // Skip if the sectionId effect already kicked off this transition.
    if (sectionChangeHandledRef.current) {
      sectionChangeHandledRef.current = false
      return
    }

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

  useEffect(() => {
    if (!isReadyRef.current || !sceneRef.current || !images.length || !sectionId) return
    // Signal that we're handling the section change so the currentIndex/images
    // effect doesn't double-trigger when setCurrentIndex fires a re-render.
    sectionChangeHandledRef.current = true
    setCurrentIndex(0)
    displayedIndexRef.current = -1
    pendingIndexRef.current = 0
    runNextTransitionRef.current()
  }, [sectionId])

  useEffect(() => {
    sceneRef.current?.setTopMode(isTopMode)
  }, [isTopMode])

  // Sync cube colors with palette
  useEffect(() => {
    sceneRef.current?.setCubeColors(
      new THREE.Color(palette.tones[0]),
      new THREE.Color(palette.tones[2]),
    )
  }, [palette])

  // Sync cube animation mode
  useEffect(() => {
    sceneRef.current?.setCubeAnimation(cubeAnimMode)
  }, [cubeAnimMode])

  // Random mode: pick a new animation every 8s (never the same twice in a row)
  useEffect(() => {
    if (!randomMode) return
    const id = setInterval(() => {
      setCubeAnimMode(prev => {
        let next: number
        do { next = Math.floor(Math.random() * CUBE_ANIM_LABELS.length) } while (next === prev && CUBE_ANIM_LABELS.length > 1)
        return next
      })
    }, 8000)
    return () => clearInterval(id)
  }, [randomMode])

  // Notify parent of index changes
  useEffect(() => {
    onIndexChange?.(currentIndex)
  }, [currentIndex, onIndexChange])

  const nextAnim = useCallback(() => {
    setCubeAnimMode(m => (m + 1) % CUBE_ANIM_LABELS.length)
  }, [])

  const prevAnim = useCallback(() => {
    setCubeAnimMode(m => (m - 1 + CUBE_ANIM_LABELS.length) % CUBE_ANIM_LABELS.length)
  }, [])

  const next = useCallback(() => {
    setCurrentIndex((i) => (images.length ? (i + 1) % images.length : 0))
  }, [images.length])

  const prev = useCallback(() => {
    setCurrentIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0))
  }, [images.length])

  /** Starts the tilt rAF loop — drives scene rotation uniforms (not CSS). */
  const startTiltLoop = useCallback(() => {
    if (tiltRafRef.current !== null) return
    const tick = () => {
      const target = tiltTargetRef.current
      const cur = tiltCurrentRef.current
      cur.x += (target.x - cur.x) * TILT_LERP
      cur.y += (target.y - cur.y) * TILT_LERP

      const scene = sceneRef.current
      if (scene) {
        const toRad = Math.PI / 180
        scene.setMouseRotation(cur.x * toRad, cur.y * toRad)
      }

      const settled =
        Math.abs(target.x - cur.x) < 0.005 &&
        Math.abs(target.y - cur.y) < 0.005
      if (settled) {
        tiltRafRef.current = null
      } else {
        tiltRafRef.current = requestAnimationFrame(tick)
      }
    }
    tiltRafRef.current = requestAnimationFrame(tick)
  }, [])

  // Mouse-tilt: track global mouse position against the viewport centre
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      tiltTargetRef.current = { x: ny * MAX_TILT_DEG, y: nx * MAX_TILT_DEG }
      startTiltLoop()
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (tiltRafRef.current !== null) {
        cancelAnimationFrame(tiltRafRef.current)
        tiltRafRef.current = null
      }
    }
  }, [startTiltLoop])

  // Reset tilt when the panel is opened (disabled = true)
  useEffect(() => {
    if (disabled) {
      tiltTargetRef.current = { x: 0, y: 0 }
      startTiltLoop()
    }
  }, [disabled, startTiltLoop])

  // Keyboard arrow handlers
  useEffect(() => {
    if (disabled) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev, disabled])

  // Mouse wheel / scroll handler (debounced)
  useEffect(() => {
    if (disabled) return
    const clip = clipRef.current
    if (!clip) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (scrollTimeoutRef.current) return
      if (e.deltaY > 0 || e.deltaX > 0) {
        next()
      } else if (e.deltaY < 0 || e.deltaX < 0) {
        prev()
      }
      scrollTimeoutRef.current = setTimeout(() => {
        scrollTimeoutRef.current = null
      }, SCROLL_DEBOUNCE_MS)
    }

    clip.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      clip.removeEventListener('wheel', handleWheel)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
        scrollTimeoutRef.current = null
      }
    }
  }, [next, prev, disabled])

  const handleCanvasClick = useCallback(() => {
    if (disabled) return
    onImageClick?.(currentIndex)
  }, [currentIndex, onImageClick, disabled])

  if (!images.length) return null

  return (
    <div className={`relative flex items-center justify-center ${className} h-full`}>
      <div ref={tiltWrapRef}>
        <div
          ref={clipRef}
          className={`relative overflow-hidden bg-transparent ${sizeClassName} shrink-0 cursor-pointer`}
          onClick={handleCanvasClick}
        >
          <div
            ref={containerRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: `${canvasScale * 100}%`, height: `${canvasScale * 100}%` }}
          />
        </div>
      </div>

      {/* Cube animation mode selector — top page only */}
      <div
        className="absolute bottom-[40%] right-[28px] z-30 w-[80px] flex flex-col items-center gap-3 transition-opacity duration-500"
        style={{ opacity: isTopMode ? 1 : 0, pointerEvents: isTopMode ? 'auto' : 'none' }}
      >
        <span className="px-2 py-1 text-[11px] font-noto-sans tracking-widest uppercase opacity-50 text-black text-center">
          Animation Pattern
        </span>
        <button onClick={prevAnim} disabled={randomMode} aria-label="Previous animation">
          <PiCaretUpBold size={18} className={randomMode ? 'text-black/10 cursor-default' : 'text-black hover:text-gray-400'} />
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <DialCounter current={cubeAnimMode + 1} total={CUBE_ANIM_LABELS.length} />
          <span className="text-[10px] font-noto-sans tracking-widest uppercase opacity-50 text-black text-center w-[100px] h-[20px]">
            {CUBE_ANIM_LABELS[cubeAnimMode]}
          </span>
        </div>
        <button onClick={nextAnim} disabled={randomMode} aria-label="Next animation">
          <PiCaretDownBold size={18} className={randomMode ? 'text-black/10 cursor-default' : 'text-black hover:text-gray-400'} />
        </button>
        <button
          onClick={() => setRandomMode(r => !r)}
          className={`mt-1 px-2 py-1 text-[8px] font-noto-sans tracking-[0.15em] uppercase border transition-all duration-300 ${randomMode
              ? 'bg-black text-white border-black '
              : 'bg-transparent text-black border-black'
            } hover:opacity-70`}
          aria-label="Toggle random mode"
        >
          random: {randomMode ? 'on' : 'off'}
        </button>
      </div>

      {/* Navigation hints + page counter — overlaid at the bottom */}
      <div
        className="absolute bottom-[28px] left-1/2 -translate-x-1/2 p-[14px] z-10 flex flex-row items-center justify-center transition-opacity duration-300"
        style={{ opacity: disabled ? 0 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
      >
        <div className="flex flex-row items-center gap-3 px-10">
          <button onClick={prev} aria-label="Previous photo">
            <PiCaretLeftBold size={24} className="text-black hover:text-gray-400" />
          </button>
          <DialCounter current={currentIndex + 1} total={images.length} />
          <button onClick={next} aria-label="Next photo">
            <PiCaretRightBold size={24} className="text-black hover:text-gray-400" />
          </button>
          <div className="absolute left-0 -translate-x-full flex flex-row items-center gap-2 text-black">
            <ArrowKeysIcon />
            <span className="text-xs font-noto-sans tracking-wide whitespace-nowrap">arrow keys</span>
          </div>
          <div className="absolute right-0 translate-x-full flex flex-row items-center gap-2 text-black">
            <MouseScrollIcon />
            <span className="text-xs font-noto-sans tracking-wide whitespace-nowrap">mouse scroll</span>
          </div>
        </div>
      </div>
    </div>
  )
}

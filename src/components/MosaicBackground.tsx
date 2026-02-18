import { useEffect, useRef } from 'react'
import { useColor, type ColorPalette } from '../contexts/ColorContext'
import { drawPatternColored, PATTERN_COUNT, mulberry32 } from '../utils/mosaicPatterns'

const CELL_SIZE = 64
const SEED = 42
const COLOR_LERP_RATE = 0.04

interface CellInfo {
  patternIndex: number
  bgTone: number
  fgTone: number
}

interface MosaicState {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  grid: CellInfo[]
  cols: number
  rows: number
  colors: Float32Array
  targets: Float32Array
  animId: number
  cancelled: boolean
  dpr: number
}

function hexToRgb01(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16 & 0xff) / 255, (n >> 8 & 0xff) / 255, (n & 0xff) / 255]
}

function buildGrid(state: MosaicState, container: HTMLElement, palette: ColorPalette) {
  const w = container.clientWidth
  const h = container.clientHeight
  state.dpr = Math.min(window.devicePixelRatio, 2)
  state.canvas.width = Math.ceil(w * state.dpr)
  state.canvas.height = Math.ceil(h * state.dpr)

  state.cols = Math.ceil(w / CELL_SIZE) + 1
  state.rows = Math.ceil(h / CELL_SIZE) + 1
  const cellCount = state.cols * state.rows

  const rand = mulberry32(SEED)
  state.grid = []
  for (let i = 0; i < cellCount; i++) {
    const bgTone = Math.floor(rand() * 4)
    let fgTone = Math.floor(rand() * 4)
    if (fgTone === bgTone) fgTone = (fgTone + 1) % 4
    state.grid.push({
      patternIndex: Math.floor(rand() * PATTERN_COUNT),
      bgTone,
      fgTone,
    })
  }

  state.colors = new Float32Array(cellCount * 6)
  state.targets = new Float32Array(cellCount * 6)

  const tones = palette.tones.map(hexToRgb01)
  for (let i = 0; i < cellCount; i++) {
    const bg = tones[state.grid[i].bgTone]
    const fg = tones[state.grid[i].fgTone]
    const base = i * 6
    state.colors[base] = bg[0]; state.colors[base + 1] = bg[1]; state.colors[base + 2] = bg[2]
    state.colors[base + 3] = fg[0]; state.colors[base + 4] = fg[1]; state.colors[base + 5] = fg[2]
  }
  state.targets.set(state.colors)

  drawMosaic(state)
}

function drawMosaic(state: MosaicState) {
  const { ctx, grid, cols, colors, dpr } = state
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const lw = Math.max(1, CELL_SIZE * 0.025)
  for (let i = 0; i < grid.length; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    const base = i * 6
    const bgStr = `rgb(${(colors[base] * 255) | 0},${(colors[base + 1] * 255) | 0},${(colors[base + 2] * 255) | 0})`
    const fgStr = `rgb(${(colors[base + 3] * 255) | 0},${(colors[base + 4] * 255) | 0},${(colors[base + 5] * 255) | 0})`
    drawPatternColored(ctx, grid[i].patternIndex, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, bgStr, fgStr, lw)
  }
}

function updateTargets(state: MosaicState, palette: ColorPalette) {
  const tones = palette.tones.map(hexToRgb01)
  for (let i = 0; i < state.grid.length; i++) {
    const bg = tones[state.grid[i].bgTone]
    const fg = tones[state.grid[i].fgTone]
    const base = i * 6
    state.targets[base] = bg[0]; state.targets[base + 1] = bg[1]; state.targets[base + 2] = bg[2]
    state.targets[base + 3] = fg[0]; state.targets[base + 4] = fg[1]; state.targets[base + 5] = fg[2]
  }
}

function startTransition(state: MosaicState) {
  cancelAnimationFrame(state.animId)
  const animate = () => {
    if (state.cancelled) return
    let maxDelta = 0
    for (let i = 0; i < state.colors.length; i++) {
      const d = state.targets[i] - state.colors[i]
      state.colors[i] += d * COLOR_LERP_RATE
      const abs = d < 0 ? -d : d
      if (abs > maxDelta) maxDelta = abs
    }
    drawMosaic(state)
    if (maxDelta < 0.001) {
      state.colors.set(state.targets)
      drawMosaic(state)
      return
    }
    state.animId = requestAnimationFrame(animate)
  }
  state.animId = requestAnimationFrame(animate)
}

export const MosaicBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { palette } = useColor()
  const stateRef = useRef<MosaicState | null>(null)
  const paletteRef = useRef(palette)
  paletteRef.current = palette

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'
    container.appendChild(canvas)
    const ctx = canvas.getContext('2d')!

    const state: MosaicState = {
      canvas,
      ctx,
      grid: [],
      cols: 0,
      rows: 0,
      colors: new Float32Array(0),
      targets: new Float32Array(0),
      animId: 0,
      cancelled: false,
      dpr: 1,
    }
    stateRef.current = state

    buildGrid(state, container, paletteRef.current)

    const onResize = () => {
      if (!state.cancelled) buildGrid(state, container, paletteRef.current)
    }
    window.addEventListener('resize', onResize)

    return () => {
      state.cancelled = true
      cancelAnimationFrame(state.animId)
      window.removeEventListener('resize', onResize)
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
      stateRef.current = null
    }
  }, [])

  useEffect(() => {
    const state = stateRef.current
    if (!state || state.grid.length === 0) return
    updateTargets(state, palette)
    startTransition(state)
  }, [palette])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: -2 }}
      aria-hidden="true"
    />
  )
}

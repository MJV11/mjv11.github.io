export const ATLAS_COLS = 5
export const ATLAS_ROWS = 4
export const ATLAS_TILE_PX = 128
export const PATTERN_COUNT = ATLAS_COLS * ATLAS_ROWS

const PI = Math.PI
const TAU = PI * 2

type PatternFn = (ctx: CanvasRenderingContext2D, s: number) => void

const patterns: PatternFn[] = [
  // 0: filled circle
  (ctx, s) => {
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.38, 0, TAU)
    ctx.fill()
  },
  // 1: circle outline
  (ctx, s) => {
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.38, 0, TAU)
    ctx.stroke()
  },
  // 2: quarter arc TL (filled)
  (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, s * 0.88, 0, PI / 2)
    ctx.closePath()
    ctx.fill()
  },
  // 3: quarter arc BR (filled)
  (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s, s)
    ctx.arc(s, s, s * 0.88, PI, PI * 1.5)
    ctx.closePath()
    ctx.fill()
  },
  // 4: quarter arc TR (filled)
  (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s, 0)
    ctx.arc(s, 0, s * 0.88, PI / 2, PI)
    ctx.closePath()
    ctx.fill()
  },
  // 5: quarter arc BL (filled)
  (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(0, s)
    ctx.arc(0, s, s * 0.88, -PI / 2, 0)
    ctx.closePath()
    ctx.fill()
  },
  // 6: half circle top (filled)
  (ctx, s) => {
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.44, PI, TAU)
    ctx.closePath()
    ctx.fill()
  },
  // 7: half circle bottom (filled)
  (ctx, s) => {
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s * 0.44, 0, PI)
    ctx.closePath()
    ctx.fill()
  },
  // 8: diagonal NE stripes
  (ctx, s) => {
    const n = 7
    const gap = s / n
    for (let i = -n; i <= n * 2; i++) {
      ctx.beginPath()
      ctx.moveTo(i * gap, s)
      ctx.lineTo(i * gap + s, 0)
      ctx.stroke()
    }
  },
  // 9: diagonal SE stripes
  (ctx, s) => {
    const n = 7
    const gap = s / n
    for (let i = -n; i <= n * 2; i++) {
      ctx.beginPath()
      ctx.moveTo(i * gap, 0)
      ctx.lineTo(i * gap - s, s)
      ctx.stroke()
    }
  },
  // 10: cross / plus
  (ctx, s) => {
    const arm = s * 0.22
    const edge = s * 0.1
    ctx.fillRect(s / 2 - arm / 2, edge, arm, s - 2 * edge)
    ctx.fillRect(edge, s / 2 - arm / 2, s - 2 * edge, arm)
  },
  // 11: diamond outline
  (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s / 2, s * 0.1)
    ctx.lineTo(s * 0.9, s / 2)
    ctx.lineTo(s / 2, s * 0.9)
    ctx.lineTo(s * 0.1, s / 2)
    ctx.closePath()
    ctx.stroke()
  },
  // 12: dots grid
  (ctx, s) => {
    const n = 4
    const gap = s / (n + 1)
    const r = s * 0.045
    for (let row = 1; row <= n; row++) {
      for (let col = 1; col <= n; col++) {
        ctx.beginPath()
        ctx.arc(col * gap, row * gap, r, 0, TAU)
        ctx.fill()
      }
    }
  },
  // 13: triangle up outline
  (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s / 2, s * 0.1)
    ctx.lineTo(s * 0.9, s * 0.9)
    ctx.lineTo(s * 0.1, s * 0.9)
    ctx.closePath()
    ctx.stroke()
  },
  // 14: triangle down outline
  (ctx, s) => {
    ctx.beginPath()
    ctx.moveTo(s / 2, s * 0.9)
    ctx.lineTo(s * 0.9, s * 0.1)
    ctx.lineTo(s * 0.1, s * 0.1)
    ctx.closePath()
    ctx.stroke()
  },
  // 15: horizontal stripes
  (ctx, s) => {
    const n = 6
    const gap = s / (n + 1)
    for (let i = 1; i <= n; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * gap)
      ctx.lineTo(s, i * gap)
      ctx.stroke()
    }
  },
  // 16: vertical stripes
  (ctx, s) => {
    const n = 6
    const gap = s / (n + 1)
    for (let i = 1; i <= n; i++) {
      ctx.beginPath()
      ctx.moveTo(i * gap, 0)
      ctx.lineTo(i * gap, s)
      ctx.stroke()
    }
  },
  // 17: checkerboard 4×4
  (ctx, s) => {
    const n = 4
    const cs = s / n
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if ((row + col) % 2 === 0) ctx.fillRect(col * cs, row * cs, cs, cs)
      }
    }
  },
  // 18: concentric squares
  (ctx, s) => {
    for (let i = 0; i < 3; i++) {
      const inset = s * (0.08 + i * 0.15)
      ctx.strokeRect(inset, inset, s - inset * 2, s - inset * 2)
    }
  },
  // 19: X shape
  (ctx, s) => {
    const m = s * 0.12
    ctx.beginPath()
    ctx.moveTo(m, m)
    ctx.lineTo(s - m, s - m)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s - m, m)
    ctx.lineTo(m, s - m)
    ctx.stroke()
  },
]

/* ─── Draw a single pattern with specified colors ──────────────── */

export function drawPatternColored(
  ctx: CanvasRenderingContext2D,
  patternIndex: number,
  x: number,
  y: number,
  size: number,
  bgColor: string,
  fgColor: string,
  lineWidth: number,
) {
  ctx.save()
  ctx.fillStyle = bgColor
  ctx.fillRect(x, y, size, size)
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.rect(0, 0, size, size)
  ctx.clip()
  ctx.fillStyle = fgColor
  ctx.strokeStyle = fgColor
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  patterns[patternIndex % PATTERN_COUNT](ctx, size)
  ctx.restore()
}

/* ─── Grayscale atlas (white patterns on black) for Three.js ───── */

let _atlas: HTMLCanvasElement | null = null

export function getAtlasCanvas(): HTMLCanvasElement {
  if (_atlas) return _atlas

  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_COLS * ATLAS_TILE_PX
  canvas.height = ATLAS_ROWS * ATLAS_TILE_PX
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const lw = ATLAS_TILE_PX * 0.03
  for (let i = 0; i < PATTERN_COUNT; i++) {
    const col = i % ATLAS_COLS
    const row = Math.floor(i / ATLAS_COLS)
    ctx.save()
    ctx.translate(col * ATLAS_TILE_PX, row * ATLAS_TILE_PX)
    ctx.beginPath()
    ctx.rect(0, 0, ATLAS_TILE_PX, ATLAS_TILE_PX)
    ctx.clip()
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    patterns[i](ctx, ATLAS_TILE_PX)
    ctx.restore()
  }

  _atlas = canvas
  return canvas
}

/* ─── Seeded PRNG (Mulberry32) ──────────────────────────────────── */

export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

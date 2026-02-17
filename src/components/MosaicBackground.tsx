import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useColor } from '../contexts/ColorContext'

/* ─── Configuration ─────────────────────────────────────────────── */

const CELL_SIZE       = 64    // visual size of one grid cell (px)
const OVERFLOW        = 1.1   // mosaic extends slightly past viewport edges
const SEED            = 42    // deterministic randomness
const COLOR_LERP_RATE = 0.04  // per-frame lerp factor (0→1); lower = slower crossfade

/* ─── Seeded PRNG (Mulberry32) ──────────────────────────────────── */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ─── Mosaic geometry builder ───────────────────────────────────── */

function buildMosaic(cols: number, rows: number) {
  const rand = mulberry32(SEED)
  const verts: number[] = []
  const toneIdx: number[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c,     y0 = r
      const x1 = c + 1, y1 = r + 1
      const mx = c + 0.5, my = r + 0.5

      const roll = rand()

      if (roll < 0.28) {
        /* ── Type C: X-split → 4 triangles ── */
        verts.push(x0,y0,0, x1,y0,0, mx,my,0)
        toneIdx.push(Math.floor(rand() * 4))

        verts.push(x1,y0,0, x1,y1,0, mx,my,0)
        toneIdx.push(Math.floor(rand() * 4))

        verts.push(x1,y1,0, x0,y1,0, mx,my,0)
        toneIdx.push(Math.floor(rand() * 4))

        verts.push(x0,y1,0, x0,y0,0, mx,my,0)
        toneIdx.push(Math.floor(rand() * 4))
      } else if (roll < 0.64) {
        /* ── Type A: diagonal TL → BR ── */
        verts.push(x0,y0,0, x1,y0,0, x1,y1,0)
        toneIdx.push(Math.floor(rand() * 4))

        verts.push(x0,y0,0, x1,y1,0, x0,y1,0)
        toneIdx.push(Math.floor(rand() * 4))
      } else {
        /* ── Type B: diagonal TR → BL ── */
        verts.push(x0,y0,0, x1,y0,0, x0,y1,0)
        toneIdx.push(Math.floor(rand() * 4))

        verts.push(x1,y0,0, x1,y1,0, x0,y1,0)
        toneIdx.push(Math.floor(rand() * 4))
      }
    }
  }

  return { positions: new Float32Array(verts), toneIndices: toneIdx }
}

/* ─── Component ─────────────────────────────────────────────────── */

export const MosaicBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { palette } = useColor()
  const paletteRef = useRef(palette)
  paletteRef.current = palette

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let animId = 0

    const w = container.clientWidth
    const h = container.clientHeight

    /* ── Grid (oversized so parallax never reveals edges) ── */
    const cols = Math.ceil((w * OVERFLOW) / CELL_SIZE) + 4
    const rows = Math.ceil((h * OVERFLOW) / CELL_SIZE) + 4
    const { positions, toneIndices } = buildMosaic(cols, rows)

    /* ── Dual vertex-color buffers (current + target for crossfade) ── */
    const totalFloats = toneIndices.length * 9 // 3 verts × rgb per tri
    const colorArr   = new Float32Array(totalFloats)
    const targetArr  = new Float32Array(totalFloats)
    let isTransitioning = false

    const writePalette = (dest: Float32Array, tones: THREE.Color[]) => {
      for (let i = 0; i < toneIndices.length; i++) {
        const t = tones[toneIndices[i]]
        const base = i * 9
        for (let v = 0; v < 3; v++) {
          dest[base + v * 3]     = t.r
          dest[base + v * 3 + 1] = t.g
          dest[base + v * 3 + 2] = t.b
        }
      }
    }

    // Initialise both buffers to the starting palette
    const initTones = paletteRef.current.tones.map(hex => new THREE.Color(hex))
    writePalette(colorArr, initTones)
    writePalette(targetArr, initTones)

    /* ── Geometry ── */
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const colorAttr = new THREE.BufferAttribute(colorArr, 3)
    geo.setAttribute('color', colorAttr)

    /* ── Material & Mesh ── */
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(-cols / 2, -rows / 2, 0)

    /* ── Scene ── */
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(paletteRef.current.tones[0])
    scene.add(mesh)

    /* ── Orthographic camera (1 unit = 1 cell) ── */
    const cellsW = w / CELL_SIZE
    const cellsH = h / CELL_SIZE
    const camera = new THREE.OrthographicCamera(
      -cellsW / 2,  cellsW / 2,
       cellsH / 2, -cellsH / 2,
      0.1, 10,
    )
    camera.position.z = 5

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    /* ── Resize ── */
    const onResize = () => {
      if (cancelled) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      const ncw = nw / CELL_SIZE
      const nch = nh / CELL_SIZE
      camera.left   = -ncw / 2
      camera.right  =  ncw / 2
      camera.top    =  nch / 2
      camera.bottom = -nch / 2
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    /* ── Palette-change tracking ── */
    let lastPalette = paletteRef.current
    const bgTarget = new THREE.Color(paletteRef.current.tones[0])
    const bgCurrent = bgTarget.clone()

    /* ── Render loop ── */
    const animate = () => {
      if (cancelled) return
      animId = requestAnimationFrame(animate)

      // Detect palette change → update targets
      if (paletteRef.current !== lastPalette) {
        lastPalette = paletteRef.current
        const newTones = paletteRef.current.tones.map(hex => new THREE.Color(hex))
        writePalette(targetArr, newTones)
        bgTarget.set(paletteRef.current.tones[0])
        isTransitioning = true
      }

      // Lerp vertex colors toward target each frame
      if (isTransitioning) {
        let maxDelta = 0
        for (let i = 0; i < totalFloats; i++) {
          const diff = targetArr[i] - colorArr[i]
          colorArr[i] += diff * COLOR_LERP_RATE
          const absDiff = diff < 0 ? -diff : diff
          if (absDiff > maxDelta) maxDelta = absDiff
        }
        colorAttr.needsUpdate = true

        // Lerp scene background
        bgCurrent.r += (bgTarget.r - bgCurrent.r) * COLOR_LERP_RATE
        bgCurrent.g += (bgTarget.g - bgCurrent.g) * COLOR_LERP_RATE
        bgCurrent.b += (bgTarget.b - bgCurrent.b) * COLOR_LERP_RATE
        ;(scene.background as THREE.Color).copy(bgCurrent)

        // Snap to target once close enough to avoid infinite micro-updates
        if (maxDelta < 0.001) {
          colorArr.set(targetArr)
          colorAttr.needsUpdate = true
          bgCurrent.copy(bgTarget)
          ;(scene.background as THREE.Color).copy(bgTarget)
          isTransitioning = false
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    /* ── Cleanup ── */
    return () => {
      cancelled = true
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: -2 }}
      aria-hidden="true"
    />
  )
}

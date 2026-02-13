import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useNav } from '../contexts/NavContext'

/* ─── Toggleable Options ─────────────────────────────────────────────── *
 *                                                                        *
 *  FONT_SIZE   – text size on canvas; purely vertical letter height      *
 *  ROW_HEIGHT  – canvas row height; must be ≥ FONT_SIZE                  *
 *                apparent vertical text size ∝ FONT_SIZE / ROW_HEIGHT    *
 *  STRIP_H     – world-space band thickness (thicker = taller bands)     *
 *  H_COMPACT   – horizontal text density multiplier                      *
 *                1.0 = natural (undistorted)                              *
 *                >1  = more compact / more repeats                       *
 *                <1  = more spread out / fewer repeats                   *
 * ────────────────────────────────────────────────────────────────────── */

const FONT_SIZE     = 120        // px  (high res on canvas = crisp text on strips)
const ROW_HEIGHT    = 125        // px  (keep ≥ FONT_SIZE to avoid clipping)
const STRIP_H       = 0.5        // world units
const H_COMPACT     = .1        // horizontal text density (1 = natural, 2 = twice as compact)

/* ─── Internal Config ────────────────────────────────────────────────── */

const ROW_COUNT     = 14
const MIN_CANVAS_W  = 8192       // minimum canvas width; actual may be larger for seamless tiling
const WORDS_PER_ROW = 30         // enough words to fill wide canvases
const FONT          = `500 ${FONT_SIZE}px 'Tusker Grotesk', Arial, sans-serif`

// Per-strip geometry
const STRIP_W       = 20         // world units wide
const STRIP_GAP     = 0.01       // gap between strips
const STRIP_SEG_X   = 128        // subdivisions for wave detail
const STRIP_SEG_Y   = 4

// Wave (flag ripple)
const WAVE_AMP_1  = 0.10 // x amplitude
const WAVE_FREQ_1 = 2.0
const WAVE_SPD_1  = .75
const WAVE_AMP_2  = 0.01 // y amplitude
const WAVE_FREQ_2 = 1.5
const WAVE_SPD_2  = 1.0
const WAVE_AMP_3  = 0.02 // z amplitude
const WAVE_FREQ_3 = 2.5
const WAVE_SPD_3  = 0.7

// Tilt (applied to the whole group)
const TILT_X = -0.7
const TILT_Y = -0.7
const TILT_Z = -1

// Scroll
const SCROLL_SPEED      = 0.0075
const SCROLL_BOOST_SENS = 0.015   // how much each px of wheel delta adds to the speed multiplier
const SCROLL_BOOST_MAX  = 12      // cap on the speed multiplier boost
const SCROLL_BOOST_DECAY = 0.92   // per-frame exponential decay (lower = snappier return)

/* ─── Colors ─────────────────────────────────────────────────────────── */

const TEXT_COLOR = '#f8f8f8'       // gray-200
const BG_COLOR   = '#ffffff'       // white

/* ─── Canvas Texture Builder ──────────────────────────────────────────── */

function buildTextCanvas(
  rows: string[],
  textColor: string,
  bgColor: string,
): HTMLCanvasElement {
  // ── 1. Measure each row's pattern width ────────────────────────
  const probe = document.createElement('canvas')
  probe.width = 1; probe.height = 1
  const pCtx = probe.getContext('2d')!
  pCtx.font = FONT

  const patterns = rows.map(r => {
    const str = r + '  '                       // trailing gap between repeats
    return { str, w: pCtx.measureText(str).width || 1 }
  })

  // ── 2. Canvas width = exact multiple of widest pattern ─────────
  //    This guarantees the texture tiles seamlessly via fract()/RepeatWrapping
  const maxPatW = Math.max(...patterns.map(p => p.w))
  const tiles   = Math.max(1, Math.ceil(MIN_CANVAS_W / maxPatW))
  const canvasW = Math.ceil(maxPatW) * tiles

  // ── 3. Draw ────────────────────────────────────────────────────
  const c = document.createElement('canvas')
  c.width  = canvasW
  c.height = ROW_HEIGHT * rows.length

  const ctx = c.getContext('2d')!
  // Opaque fill — the fragment shader discards bg-colored pixels for transparency
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, c.width, c.height)

  ctx.font         = FONT
  ctx.textBaseline = 'middle'
  ctx.fillStyle    = textColor

  for (let i = 0; i < rows.length; i++) {
    // Shift text down slightly to give tall ascenders more room
    const y = ROW_HEIGHT * i + ROW_HEIGHT * 0.55
    const { str, w: tw } = patterns[i]
    for (let x = 0; x < c.width; x += tw) {
      ctx.fillText(str, x, y)
    }
  }

  return c
}

/* ─── Shaders ─────────────────────────────────────────────────────────── */

const W1F = WAVE_FREQ_1.toFixed(1), W1S = WAVE_SPD_1.toFixed(1), W1A = WAVE_AMP_1.toFixed(2)
const W2F = WAVE_FREQ_2.toFixed(1), W2S = WAVE_SPD_2.toFixed(1), W2A = WAVE_AMP_2.toFixed(2)
const W3F = WAVE_FREQ_3.toFixed(1), W3S = WAVE_SPD_3.toFixed(1), W3A = WAVE_AMP_3.toFixed(2)

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWorldY;       // strip's Y in the group — shared wave field
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Use world-space Y so all strips ride the same invisible wave surface
    float wy = uWorldY + pos.y;

    // ── Wave phases (coherent across all strips) ───────
    float phase1 = pos.x * ${W1F} + uTime * ${W1S};
    float phase2 = wy    * ${W2F} + uTime * ${W2S};
    float phase3 = (pos.x + wy) * ${W3F} + uTime * ${W3S};

    // ── Z displacement ─────────────────────────────────
    pos.z += sin(phase1) * ${W1A};
    pos.z += sin(phase2) * ${W2A};
    pos.z += sin(phase3) * ${W3A};

    // ── Analytical normal ──────────────────────────────
    float dzdx = cos(phase1) * ${W1A} * ${W1F}
               + cos(phase3) * ${W3A} * ${W3F};
    float dzdy = cos(phase2) * ${W2A} * ${W2F}
               + cos(phase3) * ${W3A} * ${W3F};

    vec3 tangentX = vec3(1.0, 0.0, dzdx);
    vec3 tangentY = vec3(0.0, 1.0, dzdy);
    vec3 objectNormal = normalize(cross(tangentX, tangentY));
    vNormal = normalize(normalMatrix * objectNormal);

    // ── Position ───────────────────────────────────────
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uScrollSpeed;
  uniform float uScrollDir;
  uniform float uRepeatX;
  uniform float uRowOffset;
  uniform float uRowHeight;
  uniform vec3  uBgColor;          // background color (linear RGB) for transparency keying

  varying vec2 vUv;

  void main() {
    // ── UV: scroll X, map Y to this strip's row in the atlas ──
    vec2 uv = vec2(
      fract(vUv.x * uRepeatX + uTime * uScrollSpeed * uScrollDir),
      uRowOffset + vUv.y * uRowHeight
    );

    vec4 texColor = texture2D(uTexture, uv);

    // ── Discard background pixels — only keep the text ──
    float d = length(texColor.rgb - uBgColor);
    if (d < 0.03) discard;
    float alpha = smoothstep(0.03, 0.12, d);

    gl_FragColor = vec4(texColor.rgb, alpha);
  }
`

/* ─── Component ───────────────────────────────────────────────────────── */

export const TextBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentPage } = useNav()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Build row content
    const label = currentPage.toUpperCase()
    const rows: string[] = []
    for (let i = 0; i < ROW_COUNT; i++) {
      rows.push(Array(WORDS_PER_ROW).fill(label).join(' '))
    }

    // Disposable references
    let cancelled = false
    let animId    = 0
    let renderer: THREE.WebGLRenderer | null = null
    let geo:      THREE.PlaneGeometry | null = null
    let tex:      THREE.CanvasTexture | null = null
    let onResize: (() => void) | null = null
    let onWheel:  ((e: WheelEvent) => void) | null = null
    const materials: THREE.ShaderMaterial[] = []

    // Scroll-boost state
    let scrollBoost   = 0   // current speed multiplier boost (added on top of 1×)
    let customTime    = 0   // accumulated time that advances faster while scrolling

    ;(async () => {
      await document.fonts.ready
      if (cancelled || !containerRef.current) return

      const textCanvas = buildTextCanvas(rows, TEXT_COLOR, BG_COLOR)
      const w = container.clientWidth
      const h = container.clientHeight

      // ── Scene ──────────────────────────────────────
      const scene  = new THREE.Scene()
      scene.background = new THREE.Color(BG_COLOR)

      const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100)
      camera.position.set(0, 0, 4)

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)

      // ── Shared texture ─────────────────────────────
      tex = new THREE.CanvasTexture(textCanvas)
      tex.wrapS     = THREE.RepeatWrapping
      tex.wrapT     = THREE.ClampToEdgeWrapping
      tex.minFilter  = THREE.LinearFilter
      tex.magFilter  = THREE.LinearFilter
      tex.colorSpace = THREE.SRGBColorSpace

      // Aspect correction × horizontal density knob
      const texRowAspect = textCanvas.width / ROW_HEIGHT
      const stripAspect  = STRIP_W / STRIP_H
      const repeatX      = (texRowAspect / stripAspect) * H_COMPACT

      // ── Shared geometry ────────────────────────────
      geo = new THREE.PlaneGeometry(STRIP_W, STRIP_H, STRIP_SEG_X, STRIP_SEG_Y)

      // ── Background color for shader transparency keying ──
      const bgColorLinear = new THREE.Color(BG_COLOR).convertSRGBToLinear()

      // ── Group holds all strips ─────────────────────
      const group = new THREE.Group()
      const totalH = ROW_COUNT * STRIP_H + (ROW_COUNT - 1) * STRIP_GAP
      const startY = totalH / 2 - STRIP_H / 2

      for (let i = 0; i < ROW_COUNT; i++) {
        const yPos = startY - i * (STRIP_H + STRIP_GAP)

        const mat = new THREE.ShaderMaterial({
          uniforms: {
            uTime:           { value: 0 },
            uTexture:        { value: tex },
            uScrollSpeed:    { value: SCROLL_SPEED },
            uScrollDir:      { value: i % 2 === 0 ? 1.0 : -1.0 },
            uRepeatX:        { value: repeatX },
            uRowOffset:      { value: i / ROW_COUNT },
            uRowHeight:      { value: 1.0 / ROW_COUNT },
            uWorldY:         { value: yPos },
            uBgColor:        { value: bgColorLinear },
          },
          vertexShader,
          fragmentShader,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
        })
        materials.push(mat)

        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.y = yPos
        // All strips at z=0 — they share one invisible waving plane
        group.add(mesh)
      }

      // Tilt the whole group
      group.rotation.x = TILT_X
      group.rotation.y = TILT_Y
      group.rotation.z = TILT_Z
      scene.add(group)

      // ── Resize ─────────────────────────────────────
      onResize = () => {
        if (cancelled || !renderer) return
        const nw = container.clientWidth
        const nh = container.clientHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      // ── Scroll boost ──────────────────────────────
      onWheel = (e: WheelEvent) => {
        scrollBoost = Math.min(
          scrollBoost + Math.abs(e.deltaY) * SCROLL_BOOST_SENS,
          SCROLL_BOOST_MAX,
        )
      }
      window.addEventListener('wheel', onWheel, { passive: true })

      // ── Render loop ────────────────────────────────
      const clock = new THREE.Clock()
      const animate = () => {
        if (cancelled) return
        animId = requestAnimationFrame(animate)
        const dt = clock.getDelta()

        // Advance custom time at base rate × (1 + boost)
        customTime += dt * (1 + scrollBoost)
        scrollBoost *= SCROLL_BOOST_DECAY

        for (const m of materials) m.uniforms.uTime.value = customTime
        renderer!.render(scene, camera)
      }
      animate()
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(animId)
      if (onResize) window.removeEventListener('resize', onResize)
      if (onWheel) window.removeEventListener('wheel', onWheel)
      geo?.dispose()
      for (const m of materials) m.dispose()
      tex?.dispose()
      if (renderer) {
        renderer.dispose()
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
      }
    }
  }, [currentPage])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none select-none"
      style={{ zIndex: -2 }}
      aria-hidden="true"
    />
  )
}

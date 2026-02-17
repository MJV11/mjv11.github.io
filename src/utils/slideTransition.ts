import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

// Base plane size in world units before viewport scaling.
const width = 100
const height = 100

// Triangle density controls.
// Increase these multipliers for more/smaller triangles (more detail, more GPU cost).
// Decrease for fewer/larger triangles (faster, chunkier look).
const density = 2
const segX = Math.round(width * density)
const segY = Math.round(height * density)

// Timing controls for the per-triangle motion.
const minDuration = 0.8
const maxDuration = 1.2
const maxDelayX = 0.9
const maxDelayY = 0.125
const stretch = 0.11
export const totalDuration = maxDuration + maxDelayX + maxDelayY + stretch
/** Duration in seconds for the tween (user-facing transition length). */
export const TRANSITION_DURATION = 2

function randFloat(a: number, b: number) {
  return a + Math.random() * (b - a)
}
function randFloatSpread(range: number) {
  return (Math.random() - 0.5) * 2 * range
}

function computeCentroid(
  pos: Float32Array,
  i0: number,
  i1: number,
  i2: number
): THREE.Vector3 {
  const c = new THREE.Vector3()
  c.x = (pos[i0 * 3] + pos[i1 * 3] + pos[i2 * 3]) / 3
  c.y = (pos[i0 * 3 + 1] + pos[i1 * 3 + 1] + pos[i2 * 3 + 1]) / 3
  c.z = (pos[i0 * 3 + 2] + pos[i1 * 3 + 2] + pos[i2 * 3 + 2]) / 3
  return c
}

function createSlideGeometry(phase: 'in' | 'out'): THREE.BufferGeometry {
  // `segX`/`segY` determine how many triangles exist.
  // More segments => denser "ribbon/shard" field.
  const plane = new THREE.PlaneGeometry(width, height, segX, segY)
  const pos = plane.getAttribute('position')!.array as Float32Array
  const uv = plane.getAttribute('uv')!.array as Float32Array
  const index = plane.index?.array
  if (!index) throw new Error('expected indexed geometry')

  const tempPoint = new THREE.Vector3()
  function getControlPoint0(centroid: THREE.Vector3) {
    const signY = Math.sign(centroid.y)
    tempPoint.x = randFloat(0.1, 0.3) * 50
    tempPoint.y = signY * randFloat(0.1, 0.3) * 70
    tempPoint.z = randFloatSpread(20)
    return tempPoint
  }
  function getControlPoint1(centroid: THREE.Vector3) {
    const signY = Math.sign(centroid.y)
    tempPoint.x = randFloat(0.3, 0.6) * 50
    tempPoint.y = -signY * randFloat(0.3, 0.6) * 70
    tempPoint.z = randFloatSpread(20)
    return tempPoint
  }

  const faceCount = index.length / 3
  const positions: number[] = []
  const uvs: number[] = []
  const aAnimation: number[] = []
  const aStartPosition: number[] = []
  const aControl0: number[] = []
  const aControl1: number[] = []
  const aEndPosition: number[] = []

  // Reused vectors to avoid allocations while iterating faces.
  const centroid = new THREE.Vector3()
  const startPosition = new THREE.Vector3()
  const control0 = new THREE.Vector3()
  const control1 = new THREE.Vector3()
  const endPosition = new THREE.Vector3()

  for (let i = 0; i < faceCount; i++) {
    // Face indices (triangle).
    const i0 = index[i * 3]
    const i1 = index[i * 3 + 1]
    const i2 = index[i * 3 + 2]
    centroid.copy(computeCentroid(pos, i0, i1, i2))

    // Each triangle has its own duration + delay envelope.
    const duration = randFloat(minDuration, maxDuration)
    const delayX = THREE.MathUtils.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0, maxDelayX)
    const delayY =
      phase === 'in'
        ? THREE.MathUtils.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0, maxDelayY)
        : THREE.MathUtils.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0)
    const baseDelay = delayX + delayY

    startPosition.copy(centroid)
    endPosition.copy(centroid)
    if (phase === 'in') {
      control0.copy(centroid).sub(getControlPoint0(centroid))
      control1.copy(centroid).sub(getControlPoint1(centroid))
    } else {
      control0.copy(centroid).add(getControlPoint0(centroid))
      control1.copy(centroid).add(getControlPoint1(centroid))
    }

    // Per-vertex delay jitter is what creates stretched/shredded ribbons
    // instead of rigid triangles moving in lockstep.
    for (let v = 0; v < 3; v++) {
      aAnimation.push(baseDelay + Math.random() * stretch * duration, duration)
      aStartPosition.push(startPosition.x, startPosition.y, startPosition.z)
      aControl0.push(control0.x, control0.y, control0.z)
      aControl1.push(control1.x, control1.y, control1.z)
      aEndPosition.push(endPosition.x, endPosition.y, endPosition.z)
    }

    // Positions are stored relative to face centroid so each triangle can
    // be transformed independently in the shader.
    for (const idx of [i0, i1, i2]) {
      positions.push(
        pos[idx * 3] - centroid.x,
        pos[idx * 3 + 1] - centroid.y,
        pos[idx * 3 + 2] - centroid.z
      )
      uvs.push(uv[idx * 2], uv[idx * 2 + 1])
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setAttribute(
    'aAnimation',
    new THREE.Float32BufferAttribute(aAnimation, 2)
  )
  geo.setAttribute(
    'aStartPosition',
    new THREE.Float32BufferAttribute(aStartPosition, 3)
  )
  geo.setAttribute(
    'aControl0',
    new THREE.Float32BufferAttribute(aControl0, 3)
  )
  geo.setAttribute(
    'aControl1',
    new THREE.Float32BufferAttribute(aControl1, 3)
  )
  geo.setAttribute(
    'aEndPosition',
    new THREE.Float32BufferAttribute(aEndPosition, 3)
  )

  plane.dispose()
  return geo
}

const vertexShader = `
uniform float uTime;
uniform float uClothTime;

attribute vec2 aAnimation;
attribute vec3 aStartPosition;
attribute vec3 aControl0;
attribute vec3 aControl1;
attribute vec3 aEndPosition;

varying vec2 vUv;
varying vec3 vClothNormal;
varying float vClothFade;

// cubic bezier
vec3 cubicBezier(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  float mt = 1.0 - t;
  float mt2 = mt * mt;
  float mt3 = mt2 * mt;
  return mt3 * a + 3.0 * mt2 * t * b + 3.0 * mt * t2 * c + t3 * d;
}

// ease in out cubic (Penner)
float ease(float t, float b, float c, float d) {
  t = t / (d * 0.5);
  if (t < 1.0) return b + c * 0.5 * t * t * t;
  t -= 2.0;
  return b + c * 0.5 * (t * t * t + 2.0);
}

void main() {
  vUv = uv;

  float tDelay = aAnimation.x;
  float tDuration = aAnimation.y;
  float tTime = clamp(uTime - tDelay, 0.0, tDuration);
  float tProgress = ease(tTime, 0.0, 1.0, tDuration);

  vec3 posOffset = cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);

  vec3 pos = position;
  float scale = 1.0 - tProgress; // SCALE_LINE
  pos *= scale;
  pos += posOffset;

  // ── Cloth ripple ──────────────────────────────────────────
  // Diagonal phase (equal x and y): wave propagates top-right → bottom-left
  vec3 planePos = position + aStartPosition;
  float phase = planePos.x + planePos.y;
  float k = 0.1;
  float speed = 3.0;
  // Wave strength increases right (x>0) to left (x<0); plane half-width 50
  float ampScale = 1.0 - 0.5 * (planePos.x / 50.0);
  ampScale = max(ampScale, 0.35);
  float amp = 2.0 * ampScale;

  float waveArg = phase * k + uClothTime * speed;
  float clothZ = sin(waveArg) * amp;

  // Fade ripple: 1 when assembled on the cloth, 0 when fully scattered
  vClothFade = scale;
  pos.z += clothZ * vClothFade;

  // Analytical surface normal (amp varies with x so dzdx gets extra term)
  float dAmpDx = -0.02; // d(amp)/dx for ampScale linear in x
  float dzdPhase = k * cos(waveArg) * amp;
  float dzdx = dzdPhase + sin(waveArg) * dAmpDx;
  float dzdy = dzdPhase;
  vClothNormal = normalize(vec3(-dzdx, -dzdy, 1.0));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform sampler2D map;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform float uFitMode; // 0.0 = cover, 1.0 = contain
uniform float uViewAspect;
uniform float uImageAspect;

varying vec2 vUv;
varying vec3 vClothNormal;
varying float vClothFade;

// Simple hash for fabric grain
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv;
  float inBounds = 1.0;
  if (uFitMode > 0.5) {
    // Contain: letterbox/pillarbox so full image is visible
    float contentW = uImageAspect / uViewAspect;
    float contentH = uViewAspect / uImageAspect;
    float xMin = (1.0 - contentW) * 0.5;
    float yMin = (1.0 - contentH) * 0.5;
    if (uViewAspect > uImageAspect) {
      inBounds = step(xMin, vUv.x) * step(vUv.x, xMin + contentW);
      uv = vec2((vUv.x - xMin) / contentW, vUv.y);
    } else {
      inBounds = step(yMin, vUv.y) * step(vUv.y, yMin + contentH);
      uv = vec2(vUv.x, (vUv.y - yMin) / contentH);
    }
  } else {
    uv = vUv * uUvScale + uUvOffset;
  }
  vec4 texColor = texture2D(map, uv);
  texColor.a *= inBounds;

  // ── Fabric weave texture ──────────────────────────────────
  // Fine crosshatch pattern simulating warp/weft threads
  vec2 weaveCoord = vUv * 220.0;
  float threadH = smoothstep(0.3, 0.7, fract(weaveCoord.x));
  float threadV = smoothstep(0.3, 0.7, fract(weaveCoord.y));
  // Alternate which thread sits on top (woven checkerboard)
  float checker = step(0.5, fract(floor(weaveCoord.x) * 0.5 + floor(weaveCoord.y) * 0.5));
  float weave = mix(threadH, threadV, checker);

  // Subtle grain / fiber irregularity
  float grain = hash(floor(vUv * 600.0)) * 0.03;

  // Combine: slight darkening in thread troughs + grain, fades with cloth
  float fabric = mix(1.0, 0.94 + 0.06 * weave - grain, vClothFade);

  // ── Cloth lighting (normal shading only) ───────────────────
  vec3 normal = normalize(mix(vec3(0.0, 0.0, 1.0), vClothNormal, vClothFade));
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.8));
  float diffuse = max(dot(normal, lightDir), 0.0);
  float lighting = 0.78 + 0.22 * diffuse;

  gl_FragColor = vec4(texColor.rgb * lighting * fabric, texColor.a);
}
`

const vertexShaderOut = vertexShader.replace(
  'float scale = 1.0 - tProgress; // SCALE_LINE',
  'float scale = 1.0 - tProgress;'
)
const vertexShaderIn = vertexShader.replace(
  'float scale = 1.0 - tProgress; // SCALE_LINE',
  'float scale = tProgress;'
)

function createSlideMaterial(phase: 'in' | 'out'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uClothTime: { value: 0 },
      map: { value: new THREE.Texture() },
      uUvScale: { value: new THREE.Vector2(1, 1) },
      uUvOffset: { value: new THREE.Vector2(0, 0) },
      uFitMode: { value: 1 }, // 1 = contain
      uViewAspect: { value: 1 },
      uImageAspect: { value: 1 },
    },
    vertexShader: phase === 'in' ? vertexShaderIn : vertexShaderOut,
    fragmentShader,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
  })
}

interface SlideMesh {
  mesh: THREE.Mesh
  setImage(image: HTMLImageElement | HTMLCanvasElement): void
  setViewAspect(aspect: number): void
  setTime(t: number): void
  getImageAspect(): number
}

function createSlide(phase: 'in' | 'out'): SlideMesh {
  const geometry = createSlideGeometry(phase)
  const material = createSlideMaterial(phase)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  let imageAspect = width / height
  let viewAspect = width / height

  function updateUvFit() {
    const uvScale = material.uniforms.uUvScale.value as THREE.Vector2
    const uvOffset = material.uniforms.uUvOffset.value as THREE.Vector2
    // Contain mode: full image visible, letterbox/pillarbox in shader via uFitMode/uViewAspect/uImageAspect
    uvScale.set(1, 1)
    uvOffset.set(0, 0)
    ;(material.uniforms.uViewAspect as THREE.IUniform).value = viewAspect
    ;(material.uniforms.uImageAspect as THREE.IUniform).value = imageAspect
  }

  return {
    mesh,
    setImage(image: HTMLImageElement | HTMLCanvasElement) {
      // Dispose the old GPU texture and create a fresh one so that
      // images with different dimensions get a correctly-sized GPU
      // allocation (reusing the same Texture triggers glTexSubImage2D
      // which fails when the new image is a different size).
      const oldTex = material.uniforms.map.value as THREE.Texture
      oldTex.dispose()

      const newTex = new THREE.Texture(image)
      newTex.needsUpdate = true
      material.uniforms.map.value = newTex

      const w = (image as HTMLImageElement).naturalWidth || image.width || 0
      const h = (image as HTMLImageElement).naturalHeight || image.height || 0
      if (w > 0 && h > 0) imageAspect = w / h
      updateUvFit()
    },
    setViewAspect(aspect: number) {
      if (!Number.isFinite(aspect) || aspect <= 0) return
      viewAspect = aspect
      updateUvFit()
    },
    setTime(t: number) {
      material.uniforms.uTime.value = t
    },
    getImageAspect() {
      return imageAspect
    },
  }
}

/* ── Composite label text directly onto an image ───────────────── */

export function compositeWithLabel(
  image: HTMLImageElement | HTMLCanvasElement,
  title?: string | null,
  subtitle?: string | null,
): HTMLCanvasElement {
  const imgW = (image as HTMLImageElement).naturalWidth || image.width || 1
  const imgH = (image as HTMLImageElement).naturalHeight || image.height || 1

  if (!title) {
    const canvas = document.createElement('canvas')
    canvas.width = imgW
    canvas.height = imgH
    canvas.getContext('2d')!.drawImage(image, 0, 0, imgW, imgH)
    return canvas
  }

  // ── Measure label dimensions first (need a temporary canvas for measureText) ──
  const s = Math.max(imgH / 900, 0.5)
  const titlePx  = Math.round(30 * s)
  const subPx    = Math.round(22 * s)
  const padX     = Math.round(20 * s)
  const padY     = Math.round(12 * s)
  const gap      = subtitle ? Math.round(6 * s) : 0
  const depth    = Math.round(12 * s)

  const titleFont = `bold ${titlePx}px 'Noto Sans', 'Helvetica Neue', sans-serif`
  const subFont   = `${subPx}px 'Noto Sans', 'Helvetica Neue', sans-serif`

  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = titleFont
  const tw = measure.measureText(title).width
  let sw = 0
  if (subtitle) { measure.font = subFont; sw = measure.measureText(subtitle).width }

  const bw = Math.max(tw, sw) + padX * 2
  const bh = padY + titlePx + gap + (subtitle ? subPx : 0) + padY

  // Label anchored at bottom-left of image, offset outside by these margins.
  // Positive = further outside the image boundary.
  const outsideX = Math.round(imgW * 0.03)
  const outsideY = Math.round(imgH * 0.04)

  // ── Compute how far the label extends beyond the image in each direction ──
  // Block position relative to image origin (can be negative / past edge)
  const relBx = -outsideX                       // left edge of front face
  const relBy = imgH + outsideY - bh            // top edge of front face (above bottom of block)
  const relBottom = relBy + bh                   // bottom edge of front face
  const relRight  = relBx + bw + depth           // rightmost pixel (3D right face)
  const relTop    = relBy - depth                // topmost pixel (3D top face)

  // Extra padding needed beyond image bounds
  const padLeft   = Math.max(0, -relBx)
  const padTop    = Math.max(0, -relTop)
  const padRight  = Math.max(0, relRight - imgW)
  const padBottom = Math.max(0, relBottom - imgH)

  // ── Create canvas large enough for image + label overflow ──
  const canvasW = imgW + padLeft + padRight
  const canvasH = imgH + padTop + padBottom

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  // Draw the source image offset into the canvas
  ctx.drawImage(image, padLeft, padTop, imgW, imgH)

  // Translate label coordinates into canvas space
  const bx = padLeft + relBx
  const by = padTop + relBy

  // ── 3D depth: top face and right face ──

  // Right face (shadow side)
  ctx.fillStyle = 'rgba(28, 28, 28, 1)'
  ctx.beginPath()
  ctx.moveTo(bx + bw, by)
  ctx.lineTo(bx + bw + depth, by - depth)
  ctx.lineTo(bx + bw + depth, by + bh - depth)
  ctx.lineTo(bx + bw, by + bh)
  ctx.closePath()
  ctx.fill()

  // Top face (catches light)
  ctx.fillStyle = 'rgba(38, 38, 38, 1)'
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx + depth, by - depth)
  ctx.lineTo(bx + bw + depth, by - depth)
  ctx.lineTo(bx + bw, by)
  ctx.closePath()
  ctx.fill()

  // Front face
  ctx.fillStyle = 'rgba(0, 0, 0, 1)'
  ctx.fillRect(bx, by, bw, bh)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = titleFont
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(title, bx + padX, by + padY)

  if (subtitle) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.font = subFont
    ctx.fillText(subtitle, bx + padX, by + padY + titlePx + gap)
  }

  return canvas
}

export function createScene(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio === 1, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  const canvas = renderer.domElement
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  container.appendChild(canvas)

  const camera = new THREE.PerspectiveCamera(
    80,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 60)

  const scene = new THREE.Scene()

  const slideOut = createSlide('out')
  const slideIn = createSlide('in')
  slideOut.mesh.renderOrder = 0
  slideIn.mesh.renderOrder = 1
  scene.add(slideOut.mesh)
  scene.add(slideIn.mesh)

  // Pre-compile both shader programs so the first transition doesn't stutter
  // while the GPU compiles the vertex/fragment shaders mid-animation.
  renderer.compile(scene, camera)

  const clock = new THREE.Clock()
  const tweenGroup = new TWEEN.Group()
  let raf = 0
  function tick() {
    const elapsed = clock.getElapsedTime()
    ;(slideOut.mesh.material as THREE.ShaderMaterial).uniforms.uClothTime.value = elapsed
    ;(slideIn.mesh.material as THREE.ShaderMaterial).uniforms.uClothTime.value = elapsed

    tweenGroup.update()
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  tick()

  function resize() {
    const w = container.clientWidth
    const h = container.clientHeight
    if (w <= 0 || h <= 0) return

    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)

    const sizeFactor = 0.4
    const distance = Math.abs(camera.position.z - slideOut.mesh.position.z)
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance
    const viewWidth = viewHeight * camera.aspect
    const scaleX = (viewWidth / width) * sizeFactor
    const scaleY = (viewHeight / height) * sizeFactor
    slideOut.mesh.scale.set(scaleX, scaleY, 1)
    slideIn.mesh.scale.set(scaleX, scaleY, 1)

    slideOut.setViewAspect(camera.aspect)
    slideIn.setViewAspect(camera.aspect)
  }
  // Use ResizeObserver for reliable resize detection (handles DevTools open/close,
  // container layout changes, etc. that window 'resize' may miss).
  const resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(container)
  window.addEventListener('resize', resize)
  resize()

  return {
    renderer,
    scene,
    camera,
    slideOut,
    slideIn,
    tweenGroup,
    resize,
    destroy() {
      tweenGroup.removeAll()
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      window.removeEventListener('resize', resize)
      container.removeChild(renderer.domElement)
      renderer.dispose()
      slideOut.mesh.geometry.dispose()
      ;(slideOut.mesh.material as THREE.Material).dispose()
      slideIn.mesh.geometry.dispose()
      ;(slideIn.mesh.material as THREE.Material).dispose()
    },
  }
}

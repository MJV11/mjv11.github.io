import * as THREE from 'three'

// Base plane size in world units before viewport scaling.
const width = 100
const height = 60

// Triangle density controls.
// Increase these multipliers for more/smaller triangles (more detail, more GPU cost).
// Decrease for fewer/larger triangles (faster, chunkier look).
const density = 6
const segX = Math.round(width * density)
const segY = Math.round(height * density)

// Timing controls for the per-triangle motion.
const minDuration = 0.8
const maxDuration = 1.2
const maxDelayX = 0.9
const maxDelayY = 0.125
const stretch = 0.11
export const totalDuration = maxDuration + maxDelayX + maxDelayY + stretch
/** Duration in seconds for the GSAP timeline (user-facing transition length). */
export const TRANSITION_DURATION = 3

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

attribute vec2 aAnimation;
attribute vec3 aStartPosition;
attribute vec3 aControl0;
attribute vec3 aControl1;
attribute vec3 aEndPosition;

varying vec2 vUv;

// cubic bezier
vec3 cubicBezier(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  float mt = 1.0 - t;
  float mt2 = mt * mt;
  float mt3 = mt2 * mt;
  return mt3 * a + 3.0 * mt2 * t * b + 3.0 * mt * t2 * c + t3 * d;
}

// ease in out cubic (Penner) - matches THREE.BAS ShaderChunk['ease_in_out_cubic']
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
  float scale = 1.0 - tProgress; // 'out' phase: scale down as progress increases
  pos *= scale;
  pos += posOffset;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform sampler2D map;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;

varying vec2 vUv;

void main() {
  // "background-size: cover" sampling (crop from center without stretching image).
  vec2 uv = vUv * uUvScale + uUvOffset;
  gl_FragColor = texture2D(map, uv);
}
`

function createSlideMaterial(phase: 'in' | 'out'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      map: { value: new THREE.Texture() },
      uUvScale: { value: new THREE.Vector2(1, 1) },
      uUvOffset: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: phase === 'in' ? vertexShaderIn : vertexShaderOut,
    fragmentShader,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
  })
}

const vertexShaderOut = vertexShader.replace(
  'float scale = 1.0 - tProgress;',
  'float scale = 1.0 - tProgress;'
)
const vertexShaderIn = vertexShader.replace(
  'float scale = 1.0 - tProgress;',
  'float scale = tProgress;'
)

export interface SlideMesh {
  mesh: THREE.Mesh
  setImage(image: HTMLImageElement | HTMLCanvasElement): void
  setViewAspect(aspect: number): void
  setTime(t: number): void
}

export function createSlide(phase: 'in' | 'out'): SlideMesh {
  const geometry = createSlideGeometry(phase)
  const material = createSlideMaterial(phase)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  let imageAspect = width / height
  let viewAspect = width / height

  function updateUvCover() {
    const uvScale = material.uniforms.uUvScale.value as THREE.Vector2
    const uvOffset = material.uniforms.uUvOffset.value as THREE.Vector2

    if (viewAspect > imageAspect) {
      // View is wider: keep full width, crop top/bottom.
      uvScale.set(1, imageAspect / viewAspect)
    } else {
      // View is taller/narrower: keep full height, crop left/right.
      uvScale.set(viewAspect / imageAspect, 1)
    }

    uvOffset.set((1 - uvScale.x) * 0.5, (1 - uvScale.y) * 0.5)
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

      const w = image.width || 0
      const h = image.height || 0
      if (w > 0 && h > 0) imageAspect = w / h
      updateUvCover()
    },
    setViewAspect(aspect: number) {
      if (!Number.isFinite(aspect) || aspect <= 0) return
      viewAspect = aspect
      updateUvCover()
    },
    setTime(t: number) {
      material.uniforms.uTime.value = t
    },
  }
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
  // Guarantee slideIn always paints on top of slideOut so that
  // during a transition the assembling image is never occluded.
  slideOut.mesh.renderOrder = 0
  slideIn.mesh.renderOrder = 1
  scene.add(slideOut.mesh)
  scene.add(slideIn.mesh)

  let raf = 0
  function tick() {
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

    // Scale both slides so the image occupies a portion of the viewport, leaving margin
    // so the particle animation doesn't run into the canvas edges.
    const sizeFactor = 0.5 // image + animation stay within % of viewport
    const distance = Math.abs(camera.position.z - slideOut.mesh.position.z)
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance
    const viewWidth = viewHeight * camera.aspect
    const scaleX = (viewWidth / width) * sizeFactor
    const scaleY = (viewHeight / height) * sizeFactor
    slideOut.mesh.scale.set(scaleX, scaleY, 1)
    slideIn.mesh.scale.set(scaleX, scaleY, 1)

    // Update "cover" UV mapping to match viewport aspect.
    slideOut.setViewAspect(camera.aspect)
    slideIn.setViewAspect(camera.aspect)
  }
  window.addEventListener('resize', resize)
  resize()

  return {
    renderer,
    scene,
    camera,
    slideOut,
    slideIn,
    resize,
    destroy() {
      cancelAnimationFrame(raf)
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

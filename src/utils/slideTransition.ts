import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import { PATTERN_COUNT, ATLAS_COLS, ATLAS_ROWS } from './mosaicPatterns'

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

const cellW = width / segX
const cellH = height / segY

function createSlideGeometry(phase: 'in' | 'out'): THREE.InstancedBufferGeometry {
  // Base quad: unit square [-0.5, 0.5]. Cloth path scales to cell dims; cube path uses it directly.
  const basePositions = new Float32Array([
    -0.5, -0.5, 0,
     0.5, -0.5, 0,
     0.5,  0.5, 0,
    -0.5,  0.5, 0,
  ])
  const baseUvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])
  const baseCorner = new Float32Array([0, 1, 2, 3]) // which quad vertex (for jitter lookup)
  const baseIndex = new Uint16Array([0, 1, 2, 0, 2, 3])

  const geo = new THREE.InstancedBufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(basePositions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(baseUvs, 2))
  geo.setAttribute('aVertexCorner', new THREE.BufferAttribute(baseCorner, 1))
  geo.setIndex(new THREE.BufferAttribute(baseIndex, 1))

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

  const instanceCount = segX * segY
  const aAnimation = new Float32Array(instanceCount * 2)
  const aStartPosition = new Float32Array(instanceCount * 3)
  const aControl0 = new Float32Array(instanceCount * 3)
  const aControl1 = new Float32Array(instanceCount * 3)
  const aEndPosition = new Float32Array(instanceCount * 3)
  const aInstanceCell = new Float32Array(instanceCount * 2)
  const aDelayJitter = new Float32Array(instanceCount * 4)
  const aCubeIndex = new Float32Array(instanceCount)
  const aCubeFace = new Float32Array(instanceCount)
  const aCubeRandoms = new Float32Array(instanceCount * 3)
  const aPatternTile = new Float32Array(instanceCount)

  // Pre-compute one random vec3 per cube (shared by all 6 faces)
  const numCubes = Math.ceil(instanceCount / 6)
  const cubeRandomsLookup = new Float32Array(numCubes * 3)
  for (let c = 0; c < numCubes; c++) {
    cubeRandomsLookup[c * 3] = Math.random() * 2 - 1
    cubeRandomsLookup[c * 3 + 1] = Math.random() * 2 - 1
    cubeRandomsLookup[c * 3 + 2] = Math.random() * 2 - 1
  }

  const centroid = new THREE.Vector3()
  const startPosition = new THREE.Vector3()
  const control0 = new THREE.Vector3()
  const control1 = new THREE.Vector3()
  const endPosition = new THREE.Vector3()

  let idx = 0
  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      centroid.x = -width * 0.5 + (ix + 0.5) * cellW
      centroid.y = -height * 0.5 + (iy + 0.5) * cellH
      centroid.z = 0

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

      aAnimation[idx * 2] = baseDelay
      aAnimation[idx * 2 + 1] = duration
      aStartPosition[idx * 3] = startPosition.x
      aStartPosition[idx * 3 + 1] = startPosition.y
      aStartPosition[idx * 3 + 2] = startPosition.z
      aControl0[idx * 3] = control0.x
      aControl0[idx * 3 + 1] = control0.y
      aControl0[idx * 3 + 2] = control0.z
      aControl1[idx * 3] = control1.x
      aControl1[idx * 3 + 1] = control1.y
      aControl1[idx * 3 + 2] = control1.z
      aEndPosition[idx * 3] = endPosition.x
      aEndPosition[idx * 3 + 1] = endPosition.y
      aEndPosition[idx * 3 + 2] = endPosition.z
      aInstanceCell[idx * 2] = ix
      aInstanceCell[idx * 2 + 1] = iy
      // Per-vertex delay jitter (one per quad corner) for ribbon/stretch effect
      const jitterScale = stretch * duration
      aDelayJitter[idx * 4] = Math.random() * jitterScale
      aDelayJitter[idx * 4 + 1] = Math.random() * jitterScale
      aDelayJitter[idx * 4 + 2] = Math.random() * jitterScale
      aDelayJitter[idx * 4 + 3] = Math.random() * jitterScale
      const ci = Math.floor(idx / 6)
      aCubeIndex[idx] = ci
      aCubeFace[idx] = idx % 6
      aCubeRandoms[idx * 3] = cubeRandomsLookup[ci * 3]
      aCubeRandoms[idx * 3 + 1] = cubeRandomsLookup[ci * 3 + 1]
      aCubeRandoms[idx * 3 + 2] = cubeRandomsLookup[ci * 3 + 2]
      aPatternTile[idx] = Math.floor(Math.random() * PATTERN_COUNT)
      idx++
    }
  }

  geo.setAttribute('aAnimation', new THREE.InstancedBufferAttribute(aAnimation, 2))
  geo.setAttribute('aStartPosition', new THREE.InstancedBufferAttribute(aStartPosition, 3))
  geo.setAttribute('aControl0', new THREE.InstancedBufferAttribute(aControl0, 3))
  geo.setAttribute('aControl1', new THREE.InstancedBufferAttribute(aControl1, 3))
  geo.setAttribute('aEndPosition', new THREE.InstancedBufferAttribute(aEndPosition, 3))
  geo.setAttribute('aInstanceCell', new THREE.InstancedBufferAttribute(aInstanceCell, 2))
  geo.setAttribute('aDelayJitter', new THREE.InstancedBufferAttribute(aDelayJitter, 4))
  geo.setAttribute('aCubeIndex', new THREE.InstancedBufferAttribute(aCubeIndex, 1))
  geo.setAttribute('aCubeFace', new THREE.InstancedBufferAttribute(aCubeFace, 1))
  geo.setAttribute('aCubeRandoms', new THREE.InstancedBufferAttribute(aCubeRandoms, 3))
  geo.setAttribute('aPatternTile', new THREE.InstancedBufferAttribute(aPatternTile, 1))
  geo.instanceCount = instanceCount

  return geo
}

const vertexShader = `
uniform float uTime;
uniform float uClothTime;
uniform float uCubeTime;
uniform float uSegX;
uniform float uSegY;
uniform float uAboutMode;
uniform float uMouseRotX;
uniform float uMouseRotY;
uniform vec2 uPatternGridSize;

attribute vec2 aAnimation;
attribute vec3 aStartPosition;
attribute vec3 aControl0;
attribute vec3 aControl1;
attribute vec3 aEndPosition;
attribute vec2 aInstanceCell;
attribute vec4 aDelayJitter;
attribute float aVertexCorner;
attribute float aCubeIndex;
attribute float aCubeFace;
attribute vec3 aCubeRandoms;
attribute float aPatternTile;

varying vec2 vUv;
varying vec3 vClothNormal;
varying float vClothFade;
varying float vAboutMode;
varying float vCubeFace;
varying vec2 vPatternUv;

const float PI = 3.14159265359;

mat3 rotY(float a) {
  float c = cos(a); float s = sin(a);
  return mat3(c,0.0,-s, 0.0,1.0,0.0, s,0.0,c);
}
mat3 rotX(float a) {
  float c = cos(a); float s = sin(a);
  return mat3(1.0,0.0,0.0, 0.0,c,s, 0.0,-s,c);
}

vec3 rotateVec3(vec3 v, float angle, vec3 axis) {
  vec3 a = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  mat3 m = mat3(
    a.x*a.x*oc + c,      a.y*a.x*oc + a.z*s,  a.z*a.x*oc - a.y*s,
    a.x*a.y*oc - a.z*s,  a.y*a.y*oc + c,       a.z*a.y*oc + a.x*s,
    a.x*a.z*oc + a.y*s,  a.y*a.z*oc - a.x*s,   a.z*a.z*oc + c
  );
  return m * v;
}

mat3 cubeFaceRot(float face) {
  if (face < 0.5) return mat3(1.0);
  if (face < 1.5) return mat3(-1,0,0, 0,1,0, 0,0,-1);
  if (face < 2.5) return mat3(0,0,-1, 0,1,0, 1,0,0);
  if (face < 3.5) return mat3(0,0,1, 0,1,0, -1,0,0);
  if (face < 4.5) return mat3(1,0,0, 0,0,-1, 0,1,0);
  return mat3(1,0,0, 0,0,1, 0,-1,0);
}
vec3 cubeFaceOff(float face, float h) {
  if (face < 0.5) return vec3(0,0,h);
  if (face < 1.5) return vec3(0,0,-h);
  if (face < 2.5) return vec3(h,0,0);
  if (face < 3.5) return vec3(-h,0,0);
  if (face < 4.5) return vec3(0,h,0);
  return vec3(0,-h,0);
}

float mapf(float value, float inMin, float inMax, float outMin, float outMax) {
  return clamp(((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin, outMin, outMax);
}

float exponentialInOut(float t) {
  if (t <= 0.0) return 0.0;
  if (t >= 1.0) return 1.0;
  return t < 0.5
    ? 0.5 * pow(2.0, 20.0 * t - 10.0)
    : 1.0 - 0.5 * pow(2.0, 10.0 - 20.0 * t);
}

float getAnimationValue(float animVal, float randomVal) {
  float p = clamp(-mapf(randomVal, -1.0, 1.0, 0.0, 0.6) + animVal * 1.5, 0.0, 1.0);
  return exponentialInOut(p);
}

vec3 cubicBezier(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
  float t2 = t * t; float t3 = t2 * t;
  float mt = 1.0 - t; float mt2 = mt * mt; float mt3 = mt2 * mt;
  return mt3 * a + 3.0 * mt2 * t * b + 3.0 * mt * t2 * c + t3 * d;
}

float ease(float t, float b, float c, float d) {
  t = t / (d * 0.5);
  if (t < 1.0) return b + c * 0.5 * t * t * t;
  t -= 2.0;
  return b + c * 0.5 * (t * t * t + 2.0);
}

void main() {
  vCubeFace = aCubeFace;
  mat3 mouseRot = rotY(uMouseRotY) * rotX(uMouseRotX);

  vec3 pos = vec3(0.0);
  vec3 normal = vec3(0.0, 0.0, 1.0);
  vec2 texUv = vec2(0.0);
  float fade = 0.0;
  float blend = 0.0;

  float pCols = uPatternGridSize.x;
  float pRows = uPatternGridSize.y;
  float pCol = mod(aPatternTile, pCols);
  float pRow = floor(aPatternTile / pCols);
  vPatternUv = vec2(pCol / pCols, pRow / pRows) + uv / vec2(pCols, pRows);

  // ────────────────────────────────────────────
  // CLOTH MODE
  // ────────────────────────────────────────────
  vec3 clothPos = vec3(0.0);
  vec3 clothNormal = vec3(0.0, 0.0, 1.0);
  vec2 clothUv = vec2(0.0);
  float clothScale = 0.0;

  if (uAboutMode < 1.0) {
    vec3 cellPos = vec3(position.x * ${cellW.toFixed(4)}, position.y * ${cellH.toFixed(4)}, position.z);
    clothUv = (aInstanceCell + uv) / vec2(uSegX, uSegY);

    float baseDelay = aAnimation.x;
    float tDuration = aAnimation.y;
    float jitter = (1.0 - step(0.5, aVertexCorner)) * aDelayJitter.x
      + step(0.5, aVertexCorner) * (1.0 - step(1.5, aVertexCorner)) * aDelayJitter.y
      + step(1.5, aVertexCorner) * (1.0 - step(2.5, aVertexCorner)) * aDelayJitter.z
      + step(2.5, aVertexCorner) * aDelayJitter.w;
    float tDelay = baseDelay + jitter;
    float tTime = clamp(uTime - tDelay, 0.0, tDuration);
    float tProgress = ease(tTime, 0.0, 1.0, tDuration);

    vec3 posOffset = cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);
    clothPos = cellPos;
    clothScale = 1.0 - tProgress; // SCALE_LINE
    clothPos *= clothScale;
    clothPos += posOffset;

    vec3 planePos = cellPos + aStartPosition;
    float phase = planePos.x + planePos.y;
    float k = 0.1; float speed = 3.0;
    float ampScale2 = max(1.0 - 0.5 * (planePos.x / 50.0), 0.35);
    float amp = 2.0 * ampScale2;
    float waveArg = phase * k + uClothTime * speed;
    clothPos.z += sin(waveArg) * amp * clothScale;

    float dAmpDx = -0.02;
    float dzdPhase = k * cos(waveArg) * amp;
    clothNormal = normalize(vec3(-(dzdPhase + sin(waveArg) * dAmpDx), -dzdPhase, 1.0));
  }

  // ────────────────────────────────────────────
  // CUBE MODE
  // ────────────────────────────────────────────
  vec3 cubePos = vec3(0.0);
  vec3 cubeNormal = vec3(0.0, 0.0, 1.0);

  if (uAboutMode > 0.0) {
    float gridLength = 7.0;
    float centralize = (gridLength - 1.0) / 2.0;
    float cubeID = mod(aCubeIndex, gridLength * gridLength * gridLength);
    float rowID = floor(cubeID / gridLength);
    float zID = mod(rowID, gridLength) - centralize;
    rowID = floor(rowID / gridLength) - centralize;
    float colID = mod(cubeID, gridLength) - centralize;

    float cubeScale = 9.0;
    float faceSize = cubeScale * 2.0 / 3.0;
    cubePos = position * faceSize;
    cubePos = cubeFaceRot(aCubeFace) * cubePos + cubeFaceOff(aCubeFace, faceSize * 0.5);

    float intervalx = mod(colID + zID + 2.0 * centralize, 2.0 * gridLength);
    float sx = 0.5 * cos(4.0 * (uCubeTime + 0.2 * intervalx));
    float intervaly = mod(rowID + zID + 2.0 * centralize, 2.0 * gridLength);
    float sy = 0.5 * cos(4.0 * (uCubeTime + 0.2 * intervaly));
    float intervalz = mod(colID + rowID + 2.0 * centralize, 2.0 * gridLength);
    float sz = 0.5 * cos(4.0 * (uCubeTime + 0.2 * intervalz));

    cubePos.x *= 0.2 * (cubeScale + sx);
    cubePos.x += 1.2 * rowID * (cubeScale + sx);
    cubePos.y *= 0.2 * (cubeScale + sy);
    cubePos.y += 1.2 * colID * (cubeScale + sy);
    cubePos.z *= 0.2 * (cubeScale + sz);
    cubePos.z += 1.2 * zID * (cubeScale + sz);

    float rad1 = 3.0 * sin(0.1 * uCubeTime);
    float rad2 = 3.0 * sin(0.1 * (uCubeTime + 1.0));
    cubePos = rotateVec3(cubePos, rad1, vec3(1.0, 0.0, 0.0));
    cubePos = rotateVec3(cubePos, rad2, vec3(0.0, 1.0, 0.0));

    cubeNormal = rotateVec3(
      rotateVec3(cubeFaceRot(aCubeFace) * vec3(0.0, 0.0, 1.0), rad1, vec3(1.0, 0.0, 0.0)),
      rad2, vec3(0.0, 1.0, 0.0)
    );

    float totalCubes = gridLength * gridLength * gridLength;
    cubePos *= step(aCubeIndex + 0.5, totalCubes);
  }

  // ────────────────────────────────────────────
  // BLEND between modes
  // ────────────────────────────────────────────
  if (uAboutMode <= 0.0) {
    pos = clothPos;
    normal = clothNormal;
    texUv = clothUv;
    fade = clothScale;
    blend = 0.0;
  } else if (uAboutMode >= 1.0) {
    pos = cubePos;
    normal = cubeNormal;
    texUv = vec2(0.0);
    fade = 0.0;
    blend = 1.0;
  } else {
    float Tween = getAnimationValue(uAboutMode, aCubeRandoms.x);
    pos = mix(clothPos, cubePos, Tween);
    normal = mix(clothNormal, cubeNormal, Tween);
    texUv = mix(clothUv, vec2(0.0), Tween);
    fade = mix(clothScale, 0.0, Tween);
    blend = Tween;
  }

  vUv = texUv;
  vClothFade = fade;
  vAboutMode = blend;

  pos = mouseRot * pos;
  vClothNormal = mouseRot * normal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform sampler2D map;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform float uFitMode;
uniform float uViewAspect;
uniform float uImageAspect;
uniform vec3 uCubeColor;
uniform sampler2D uPatternAtlas;
uniform vec3 uCubeBgColor;

varying vec2 vUv;
varying vec3 vClothNormal;
varying float vClothFade;
varying float vAboutMode;
varying float vCubeFace;
varying vec2 vPatternUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // ── Cube solid color with face shading ──
  vec3 cubeNorm = normalize(vClothNormal);
  vec3 cubeLightDir = normalize(vec3(1.0, 1.0, 0.8));
  float cubeDiffuse = max(dot(cubeNorm, cubeLightDir), 0.0);
  float cubeLighting = 0.55 + 0.45 * cubeDiffuse;
  float pattern = texture2D(uPatternAtlas, vPatternUv).r;
  vec3 cubeBaseColor = mix(uCubeBgColor, uCubeColor, pattern);
  vec4 cubeCol = vec4(cubeBaseColor * cubeLighting, 1.0);

  if (vAboutMode > 0.999) {
    gl_FragColor = cubeCol;
    return;
  }

  // ── Cloth/texture mode ──
  vec2 uv;
  float inBounds = 1.0;
  if (uFitMode > 0.5) {
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

  vec2 weaveCoord = vUv * 220.0;
  float threadH = smoothstep(0.3, 0.7, fract(weaveCoord.x));
  float threadV = smoothstep(0.3, 0.7, fract(weaveCoord.y));
  float checker = step(0.5, fract(floor(weaveCoord.x) * 0.5 + floor(weaveCoord.y) * 0.5));
  float weave = mix(threadH, threadV, checker);
  float grain = hash(floor(vUv * 600.0)) * 0.03;
  float fabric = mix(1.0, 0.94 + 0.06 * weave - grain, vClothFade);

  vec3 normal = normalize(mix(vec3(0.0, 0.0, 1.0), vClothNormal, vClothFade));
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.8));
  float diffuse = max(dot(normal, lightDir), 0.0);
  float lighting = 0.78 + 0.22 * diffuse;

  vec4 clothCol = vec4(texColor.rgb * lighting * fabric, texColor.a);
  gl_FragColor = mix(clothCol, cubeCol, vAboutMode);
}
`

const vertexShaderOut = vertexShader.replace(
  'clothScale = 1.0 - tProgress; // SCALE_LINE',
  'clothScale = 1.0 - tProgress;'
)
const vertexShaderIn = vertexShader.replace(
  'clothScale = 1.0 - tProgress; // SCALE_LINE',
  'clothScale = tProgress;'
)

const _defaultAtlasTex = new THREE.DataTexture(
  new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat,
)
_defaultAtlasTex.needsUpdate = true

function createSlideMaterial(phase: 'in' | 'out'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uClothTime: { value: 0 },
      uCubeTime: { value: 0 },
      uSegX: { value: segX },
      uSegY: { value: segY },
      uAboutMode: { value: 0 },
      uMouseRotX: { value: 0 },
      uMouseRotY: { value: 0 },
      uCubeColor: { value: new THREE.Color(0xaaaaaa) },
      uCubeBgColor: { value: new THREE.Color(0xfafafa) },
      uPatternAtlas: { value: _defaultAtlasTex },
      uPatternGridSize: { value: new THREE.Vector2(ATLAS_COLS, ATLAS_ROWS) },
      map: { value: new THREE.Texture() },
      uUvScale: { value: new THREE.Vector2(1, 1) },
      uUvOffset: { value: new THREE.Vector2(0, 0) },
      uFitMode: { value: 1 },
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
  setAboutMode(on: boolean): void
  setMouseRotation(rx: number, ry: number): void
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
    setAboutMode(on: boolean) {
      material.depthWrite = on
      material.depthTest = on
    },
    setMouseRotation(rx: number, ry: number) {
      material.uniforms.uMouseRotX.value = rx
      material.uniforms.uMouseRotY.value = ry
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
  const clothSpeed = 1.0
  const cubeSpeed = 1.0
  function tick() {
    const elapsed = clock.getElapsedTime()
    const outMat = slideOut.mesh.material as THREE.ShaderMaterial
    const inMat = slideIn.mesh.material as THREE.ShaderMaterial
    outMat.uniforms.uClothTime.value = elapsed * clothSpeed
    inMat.uniforms.uClothTime.value = elapsed * clothSpeed
    outMat.uniforms.uCubeTime.value = elapsed * cubeSpeed
    inMat.uniforms.uCubeTime.value = elapsed * cubeSpeed

    tweenGroup.update()
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  tick()

  let aboutModeTween: TWEEN.Tween<{ v: number }> | null = null
  const aboutProxy = { v: 0 }

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

    // Cloth scale (viewport-fitted, non-uniform)
    const clothSX = (viewWidth / width) * sizeFactor
    const clothSY = (viewHeight / height) * sizeFactor
    // Cube scale (fixed, uniform)
    const cubeSU = (viewHeight / height) * sizeFactor

    // Blend between cloth and cube scale using the current tween value
    const t = aboutProxy.v
    const sx = clothSX + (cubeSU - clothSX) * t
    const sy = clothSY + (cubeSU - clothSY) * t
    const sz = 1 + (cubeSU - 1) * t
    slideOut.mesh.scale.set(sx, sy, sz)
    slideIn.mesh.scale.set(sx, sy, sz)

    slideOut.setViewAspect(camera.aspect)
    slideIn.setViewAspect(camera.aspect)
  }
  const resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(container)
  window.addEventListener('resize', resize)
  resize()

  function setAboutMode(on: boolean) {
    if (aboutModeTween) aboutModeTween.stop()

    const target = on ? 1 : 0
    aboutModeTween = new TWEEN.Tween(aboutProxy, tweenGroup)
      .to({ v: target }, 2500)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        const v = aboutProxy.v
        ;(slideOut.mesh.material as THREE.ShaderMaterial).uniforms.uAboutMode.value = v
        ;(slideIn.mesh.material as THREE.ShaderMaterial).uniforms.uAboutMode.value = v
        // Enable depth for 3D cubes when any cube is visible
        const depthOn = v > 0.01
        slideOut.setAboutMode(depthOn)
        slideIn.setAboutMode(depthOn)
        // Push slideOut fragments slightly deeper to prevent z-fighting with slideIn
        const outMat = slideOut.mesh.material as THREE.ShaderMaterial
        outMat.polygonOffset = v > 0.5
        outMat.polygonOffsetFactor = 1
        outMat.polygonOffsetUnits = 1
        // Smoothly interpolate mesh scale each frame
        resize()
      })
      .onComplete(() => { resize() })
      .start()
  }

  function setMouseRotation(rx: number, ry: number) {
    slideOut.setMouseRotation(rx, ry)
    slideIn.setMouseRotation(rx, ry)
  }

  return {
    renderer,
    scene,
    camera,
    slideOut,
    slideIn,
    tweenGroup,
    resize,
    setAboutMode,
    setMouseRotation,
    setPatternAtlas(tex: THREE.Texture) {
      const outMat = slideOut.mesh.material as THREE.ShaderMaterial
      const inMat = slideIn.mesh.material as THREE.ShaderMaterial
      outMat.uniforms.uPatternAtlas.value = tex
      inMat.uniforms.uPatternAtlas.value = tex
    },
    setCubeColors(bg: THREE.Color, fg: THREE.Color) {
      const outMat = slideOut.mesh.material as THREE.ShaderMaterial
      const inMat = slideIn.mesh.material as THREE.ShaderMaterial
      outMat.uniforms.uCubeBgColor.value.copy(bg)
      inMat.uniforms.uCubeBgColor.value.copy(bg)
      outMat.uniforms.uCubeColor.value.copy(fg)
      inMat.uniforms.uCubeColor.value.copy(fg)
    },
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

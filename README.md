# portfolio2

Personal portfolio site for Max Vink — software engineer and cyclist based in Berkeley, California. Live at [github.com/mjv11/portfolio2](https://github.com/mjv11/portfolio2).

## What it is

A single-page portfolio showcasing selected projects. The UI is built around a fullscreen Three.js image carousel with custom animated transitions. There is no URL-based routing — navigation is purely React state-driven, with three sections: the front page, **works**, and **contact**.

## Tech stack

| Layer | Libraries |
|---|---|
| Framework | React 18, TypeScript, Vite |
| 3D / WebGL | Three.js, custom GLSL shaders |
| Animation | @tweenjs/tween.js |
| Styling | Tailwind CSS |
| Icons | react-icons |

## How it works

### Image carousel (`ImageCarousel.tsx` + `geometries.ts`)

The carousel is rendered entirely in WebGL via Three.js. Each image is displayed on a plane made up of ~40 000 instanced quad tiles. When switching images, the outgoing tiles fly off-screen along randomized cubic Bézier paths while the incoming tiles fly in from the opposite side — all driven by a custom GLSL vertex shader that reads per-instance animation attributes (delay, duration, start/end/control positions) baked into `InstancedBufferGeometry` at scene creation time. The CPU side just drives a single `uTime` uniform via a tween; no per-frame JavaScript geometry updates occur.

Each image also has text labels (project title and subtitle) composited directly onto a `<canvas>` before being uploaded as a Three.js texture, so text always appears pixel-perfect at the correct position regardless of scene scaling.

Transitions are interruptible: if the user scrolls again mid-animation, the current tweens are replaced by short settle tweens that snap both planes to their final state before the next transition begins.

### Front page cube field (`geometries.ts`, top mode)

On the root/front page, the same instanced geometry is repurposed into a field of animated cubes. There are 8 named animation patterns (cube wave, scatter, wireframe, rubik, etc.) that can be cycled manually or rotated automatically every 8 seconds in random mode. The cubes react to mouse movement with a subtle parallax tilt applied via Three.js uniform rotation rather than CSS transforms.

### Mosaic background (`MosaicBackground.tsx`, `mosaicPatterns.ts`)

The full-screen background is a `<canvas>` grid of 64×64 px geometric pattern tiles — 20 different patterns (circles, arcs, stripes, checkerboards, dots, etc.) randomly assigned at a fixed seed so layout is deterministic. When the active portfolio work has a `colorContext` palette, the background smoothly lerps all tile colors toward the new palette using a per-frame `requestAnimationFrame` loop. The same pattern set is also baked into a texture atlas (5×4 grid) that is uploaded to the GPU for use inside the Three.js shader, so the cube faces display the same geometric motifs as the background.

### Color system (`ColorContext.tsx`)

A React context holds a four-tone color palette. Each work entry in `data/works.ts` defines an optional `colorContext` (four hex colors). Clicking a work causes the palette to update, which simultaneously shifts the mosaic background and the cube colors in the Three.js scene.

### Image loading (`PortfolioImagesContext.tsx`, `config/portfolioImages.ts`)

All section image URLs are resolved in parallel on initial load and the images are preloaded via `new Image()` before the loading screen is dismissed. Sections are declared in `config/portfolioImages.ts` with a dynamic `import()` loader per section, making it straightforward to add new gallery sections without changing the carousel or provider logic.

### Navigation and layout

- The `NavContext` tracks the current section (`root`, `works`, `contact`).
- On the works page, clicking a carousel image slides in a detail panel from the left (CSS transition on width), revealing the `WorkItem` component with project metadata, tags, links, and an optional site link.
- On the contact page, a similar panel slides in with contact information.
- When a side panel is open, the carousel viewport shifts right by 20% (via a `viewShift` uniform in the shader) to keep the imagery centered in the remaining space.
- The carousel supports mouse scroll (debounced), keyboard arrow keys, and button clicks for navigation.

## Project structure

```
src/
├── components/       # React UI components (Nav, ImageCarousel, WorkItem, Contact, MosaicBackground, …)
├── contexts/         # React contexts (NavContext, ColorContext, PortfolioImagesContext)
├── config/           # Section image loading config
├── data/
│   ├── works.ts      # Portfolio project definitions
│   └── sectionImages/# Per-section image URL lists
├── hooks/            # useWorksState (expanded work state for the works page)
└── utils/
    ├── geometries.ts  # Three.js scene, instanced geometry, GLSL shaders
    └── mosaicPatterns.ts  # 20 canvas pattern functions + texture atlas generation
```

## Running locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

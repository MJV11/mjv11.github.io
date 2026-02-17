import { useState, useEffect } from 'react'

const BIKE = '#000000'
const ACCENT = '#000000'

const SPIN: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: 'center',
  animation: 'spin-cw 1.2s linear infinite',
}

const CAP: React.SVGProps<SVGLineElement> = {
  strokeLinecap: 'round',
  strokeLinejoin: 'round' as never,
}

/**
 * Side-view bicycle SVG.
 *
 * Geometry (viewBox 0 0 260 170):
 *   Rear wheel centre  : (62,  115)  r = 36
 *   Front wheel centre : (192, 115)  r = 36
 *   Bottom bracket     : (112, 115)
 *   Seat-tube top      : (93,  63)
 *   Head-tube          : (158, 65) → (164, 81)
 */
function BikeSVG() {
  return (
    <svg
      viewBox="0 0 240 170"
      width={240}
      height={170}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bicycle"
    >
      {/* ── Rear wheel ─────────────────────────────── */}
      <g style={SPIN}>
        <circle cx="62" cy="115" r="36" stroke={BIKE} strokeWidth="2.5" />
        {/* 3 diameter spokes at 0°, 60°, 120° */}
        <line x1="62"   y1="79"  x2="62"   y2="151" stroke={BIKE} strokeWidth="1.5" {...CAP} />
        <line x1="93.2" y1="97"  x2="30.8" y2="133" stroke={BIKE} strokeWidth="1.5" {...CAP} />
        <line x1="93.2" y1="133" x2="30.8" y2="97"  stroke={BIKE} strokeWidth="1.5" {...CAP} />
        {/* Hub */}
        <circle cx="62" cy="115" r="5" fill={ACCENT} />
      </g>

      {/* ── Front wheel ────────────────────────────── */}
      {/*
        Front axle moved to (178,115) so the fork is exactly parallel to the
        head tube (both share direction vector (6,16)).
        Spoke ends: cx±31.2 for the 60° diagonals, cy±18 for the 60° row.
      */}
      <g style={SPIN}>
        <circle cx="178" cy="115" r="36" stroke={BIKE} strokeWidth="2.5" />
        <line x1="178"   y1="79"  x2="178"   y2="151" stroke={BIKE} strokeWidth="1.5" {...CAP} />
        <line x1="209.2" y1="97"  x2="146.8" y2="133" stroke={BIKE} strokeWidth="1.5" {...CAP} />
        <line x1="209.2" y1="133" x2="146.8" y2="97"  stroke={BIKE} strokeWidth="1.5" {...CAP} />
        <circle cx="178" cy="115" r="5" fill={ACCENT} />
      </g>

      {/* ── Frame ──────────────────────────────────── */}
      {/* Top tube — FLAT: both endpoints share y=63 */}
      <line x1="93"  y1="63"  x2="158" y2="63"  stroke={BIKE} strokeWidth="3"   {...CAP} />
      {/* Down tube — from head-tube bottom (164,79) to bottom bracket */}
      <line x1="160" y1="69"  x2="112" y2="115" stroke={BIKE} strokeWidth="3"   {...CAP} />
      {/* Seat tube */}
      <line x1="93"  y1="63"  x2="112" y2="115" stroke={BIKE} strokeWidth="3"   {...CAP} />
      {/* Chain stays */}
      <line x1="112" y1="115" x2="62"  y2="115" stroke={BIKE} strokeWidth="2.5" {...CAP} />
      {/* Seat stays */}
      <line x1="93"  y1="63"  x2="62"  y2="115" stroke={BIKE} strokeWidth="2.5" {...CAP} />
      {/* Fork — parallel to head tube: same direction (6,16), lands at (178,115) */}
      <line x1="152" y1="47"  x2="178" y2="115" stroke={BIKE} strokeWidth="2.5" {...CAP} />

      {/* ── Handlebar ──────────────────────────────── */}
      {/* Bar */}
      <line x1="136" y1="47" x2="170" y2="47" stroke={BIKE} strokeWidth="2.5" {...CAP} />

      {/* ── Seat ───────────────────────────────────── */}
      {/*
        Seat post is COLLINEAR with the seat tube.
        Seat-tube vector: (112→93, 115→63) = (−19, −52), |v| ≈ 55.4 px.
        Unit up: (−0.343, −0.939). Post length ≈ 14 px → tip at (88, 50).
      */}
      <line x1="93" y1="63" x2="88" y2="50" stroke={BIKE} strokeWidth="2.5" {...CAP} />
      {/* Saddle — horizontal at post tip */}
      <line x1="80" y1="50" x2="97" y2="50" stroke={BIKE} strokeWidth="4" {...CAP} />

      {/* ── Crank (rotates) ────────────────────────── */}
      <g style={SPIN}>
        {/* Chainring */}
        <circle cx="112" cy="115" r="11" stroke={ACCENT} strokeWidth="2" />
        {/* Crank arms */}
        <line x1="96"  y1="115" x2="128" y2="115" stroke={BIKE} strokeWidth="2.5" {...CAP} />
        {/* Pedals */}
        <line x1="96"  y1="110" x2="96"  y2="120" stroke={BIKE} strokeWidth="3" {...CAP} />
        <line x1="128" y1="110" x2="128" y2="120" stroke={BIKE} strokeWidth="3" {...CAP} />
      </g>

      {/* Bottom-bracket cap (static, renders above crank) */}
      <circle cx="112" cy="115" r="4" fill={BIKE} />
    </svg>
  )
}

interface LoadingScreenProps {
  isVisible: boolean
}

export function LoadingScreen({ isVisible }: LoadingScreenProps) {
  // Keep the DOM node alive long enough for the fade-out to complete
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    if (!isVisible) {
      const t = setTimeout(() => setMounted(false), 800)
      return () => clearTimeout(t)
    }
  }, [isVisible])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.7s ease-in-out',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <BikeSVG />
      <p className="mt-5 text-xs tracking-[0.3em] uppercase font-jost text-black/35">
        loading
      </p>
    </div>
  )
}

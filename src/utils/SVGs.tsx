/* ── Inline SVG icons for navigation hints ────────────────────────── */

export function ArrowKeysIcon({ className }: { className?: string }) {
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

export function MouseScrollIcon({ className }: { className?: string }) {
    return (
        <svg width="20" height="30" viewBox="0 0 20 30" fill="none" className={className}>
            <rect x="1" y="1" width="18" height="28" rx="9" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="7" x2="10" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M8 20L10 23L12 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

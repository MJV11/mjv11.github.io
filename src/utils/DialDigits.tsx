
/** A single digit slot that mechanically rolls to the given numeric character. */
export function DialDigit({ char }: { char: string }) {
    if (!/^\d$/.test(char)) {
        return (
            <span className="font-medium text-base text-black leading-none">
                {char}
            </span>
        )
    }
    const n = parseInt(char)
    const cellH = 24 // px — matches text-base (16px × 1.5) line-height

    return (
        <span
            className="relative overflow-hidden inline-block"
            style={{ height: cellH, width: '1ch', verticalAlign: 'middle' }}
        >
            <span
                className="absolute inset-x-0 top-0 flex flex-col items-center text-black font-medium text-base tabular-nums transition-transform duration-300 ease-out"
                style={{
                    transform: `translateY(${-n * cellH}px)`,
                    lineHeight: `${cellH}px`,
                }}
            >
                {Array.from({ length: 10 }, (_, d) => (
                    <span key={d} style={{ height: cellH }}>{d}</span>
                ))}
            </span>
        </span>
    )
}

/** Mechanical counter dial displaying "current / total". */
export function DialCounter({ current, total }: { current: number; total: number }) {
    const label = `${String(current)} / ${String(total)}`
    return (
        <span
            className="inline-flex items-center font-medium text-base tabular-nums gap-2"
            style={{ height: 24 }}
        >
            {label.split(' ').map((char, i) => (
                <DialDigit key={i} char={char} />
            ))}
        </span>
    )
}

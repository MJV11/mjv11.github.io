import type { Work } from '../data/works'
import { PiArrowSquareOut, PiCaretLeft } from 'react-icons/pi'
import { useColor } from '../contexts/ColorContext'
import { useEffect } from 'react'

interface WorkItemProps {
  work: Work | null
  onClose: () => void
}

export function WorkItem({ work, onClose }: WorkItemProps) {
  const { setPalette } = useColor()
  if (!work) return null

  useEffect(() => {
    if (work?.colorContext) {
      setPalette({ tones: work.colorContext as [string, string, string, string] })
    }
  }, [work?.colorContext, setPalette])

  return (
    <div className="flex flex-col gap-6 py-16 px-6 animate-fadeIn h-full z-10 mt-16">
      <button className="flex text-sm font-jost flex-row w-fit gap-4 items-center justify-center hover:text-white hover:bg-black duration-300 transition-colors border-2 border-black px-2 py-1" onClick={onClose}>
        <PiCaretLeft size={12} />
        <span>back to works</span>
      </button>

      {/* Title + external link */}
      <div className="flex flex-col">
        <span className={`text-[40px] font-jost leading-tight px-1 w-fit font-semibold ${work.colors.title}`} >
          {work.title}
        </span>
        <span className={`text-[24px] font-jost px-1 w-fit font-semibold lowercase ${work.colors.title}`}>
          {work.subtitle}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {[
          { key: 'type', value: work.type },
          { key: 'role', value: work.role },
          { key: 'tech', value: work.tech },
        ].map((item) => (
          <div className={`flex flex-row items-start gap-1 ${work.colors[item.key].label}`}>
            <span className="pr-2">{item.key}</span>
            <div className={`flex flex-row flex-wrap items-center gap-1 ${work.colors[item.key].label}`}>
              {item.value.map((val: string) => (
                <span className={`text-[14px] font-jost px-2 py-1 whitespace-nowrap ${work.colors[item.key].bg}`} key={val}>
                  {val}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <a className={`text-[16px] font-jost leading-relaxed border-2 px-2 py-3 text-center transition-colors duration-300 ${work.colors.site}`} href={work.site} target="_blank" rel="noopener noreferrer">
        {work.site ? <div className="flex flex-row gap-2 items-center justify-center">
          <span>visit site</span> <PiArrowSquareOut size={20} /> </div> : <span>site not available</span>}
      </a>

      {/* Description */}
      {work.description && <p className={`text-[16px] font-jost leading-relaxed border-2 px-2 py-1 ${work.colors.description}`}>
        {work.description}
      </p>}

      {/* Videos */}
      {
        work.videos && work.videos.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-black text-[14px] font-noto-sans font-semibold uppercase tracking-wider">
              Videos
            </h3>
            <div className="flex flex-col gap-2">
              {work.videos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E6B389] hover:text-black text-[14px] font-noto-sans underline underline-offset-2 transition-colors truncate"
                >
                  {url}
                </a>
              ))}
            </div>
          </div>
        )
      }
    </div >
  )
}

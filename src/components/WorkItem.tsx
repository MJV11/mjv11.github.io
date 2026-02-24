import type { Work } from '../data/works'
import { PiArrowSquareOut, PiCaretLeft } from 'react-icons/pi'
import { useColor } from '../contexts/ColorContext'
import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'

const workImages = import.meta.glob('../assets/images/works/*', { eager: true, import: 'default' }) as Record<string, string>

interface WorkItemProps {
  work: Work | null
  onClose: () => void
}

export function WorkItem({ work, onClose }: WorkItemProps) {
  const { setPalette } = useColor()
  const posthog = usePostHog()
  if (!work) return null

  useEffect(() => {
    if (work?.colorContext) {
      setPalette({ tones: work.colorContext as [string, string, string, string] })
    }
  }, [work?.colorContext, setPalette])

  return (
    <div className="flex flex-col gap-6 py-4 px-6 animate-fadeIn w-full md:w-[70%] pt-[10%] md:pt-0 z-10">
      <button className="flex text-sm font-jost flex-row w-fit gap-4 items-center justify-center bg-white hover:text-white hover:bg-black duration-300 transition-colors border-2 border-black px-2 py-1" 
      onClick={() => { posthog.capture('interaction', { button: 'back_to_works', page: 'works', work: work.title }); onClose() }}>
        <PiCaretLeft size={12} />
        <span className='whitespace-nowrap'>back to works</span>
      </button>

      {/* Title + external link */}
      <div className="flex flex-col">
        <span className={`text-[40px] font-jost leading-tight px-1 w-fit font-semibold ${work.colors.title}`} >
          {work.title}
        </span>
        <div>
          <span className={`text-[24px] font-jost px-1 font-semibold lowercase box-decoration-clone leading-snug ${work.colors.title}`}>
            {work.subtitle}
          </span>
        </div>
      </div>

      <img src={workImages[`../assets/images/works/${work.image}`]} alt='work item' className='w-full h-full object-cover md:hidden' />

      <div className="flex flex-col gap-2 pb-2">
        {[
          { key: 'type', value: work.type },
          { key: 'role', value: work.role },
          { key: 'tech', value: work.tech },
          { key: 'buzzwords', value: work.buzzwords },
        ].map((item) => (
          <div className={`font-jost flex flex-row items-start gap-1 ${work.colors[item.key].label}`}>
            <span className="text-[14px] pr-2 py-1 tracking-wider">{item.key}</span>
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

      <div className="flex flex-col gap-2 w-full md:max-w-[450px]">
        <a className={`text-[16px] font-jost leading-relaxed border-2 px-2 py-3 text-center transition-colors duration-300 ${work.colors.site}`} href={work.site} target="_blank" rel="noopener noreferrer" 
        onClick={() => posthog.capture('interaction', { button: 'visit_site', page: 'works', work: work.title })}>
          {work.site ? <div className="flex flex-row gap-2 items-center justify-center">
            <span>visit site</span> <PiArrowSquareOut size={20} /> </div> : <span>site not available</span>}
        </a>

        <a className={`${!work.source ? 'hidden' : ''} text-[16px] font-jost leading-relaxed border-2 px-2 py-3 text-center transition-colors duration-300 ${work.colors.site}`} href={work.source} target="_blank" rel="noopener noreferrer" 
        onClick={() => posthog.capture('interaction', { button: 'view_code', page: 'works', work: work.title })}>
          <div className="flex flex-row gap-2 items-center justify-center">
            <span>view code</span> <PiArrowSquareOut size={20} />
          </div>
        </a>
      </div>

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
    </div>
  )
}

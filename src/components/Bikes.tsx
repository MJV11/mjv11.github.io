import { useCyclingResults } from '../hooks/useCyclingResults'
import { CornerBorders } from '../utils'
import { PiArrowSquareOut } from 'react-icons/pi'
import { ImageCarousel } from './ImageCarousel'

const bikeImages = (
  Object.values(
    import.meta.glob<{ default: string }>('../assets/images/bikes/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true })
  ) as { default: string }[]
).map((m) => m.default).sort()

export function Bikes() {
  const { data: results, isLoading, isError } = useCyclingResults()


  return (
    <div className='fixed inset-0 flex flex-col md:flex-row md:gap-10 overflow-hidden'>
      <div className="w-1/2 p-[14px] flex flex-col min-h-0 overflow-hidden">
        <div className="relative p-[14px] mb-2 w-fit flex flex-row gap-2 shrink-0">
          <button style={{ lineHeight: '.8', textShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)' }}
            className="font-tusker whitespace-nowrap text-white text-[100px] font-medium cursor-pointer hover:text-[#f3dbc7] mt-3 flex flex-row gap-2 items-end"
            onClick={() => window.open('https://www.road-results.com/racer/238856s', '_blank')}>
            <span>race results</span>
            <PiArrowSquareOut size={30} />
          </button>
          <CornerBorders />
        </div>

        {isLoading || isError || !results ? (
          <div className="flex-1 min-h-0 animate-pulse bg-white/20 rounded-lg shadow-sm" />
        ) : (
          <div className="relative p-[14px] min-h-0 flex-1 flex flex-col overflow-hidden">
            <CornerBorders />
            <div className="flex flex-col w-full gap-2 min-h-0 flex-1 overflow-y-auto">
              {/* Data rows */}
              {results.map((r) => (
                <div
                  key={`${r.id}-${r.race_id}`}
                  className="flex flex-row items-center border-transparent last:border-b-0 hover:bg-[#f3dbc7]/80 bg-neutral-100/70 gap-2 p-2 rounded"
                >
                  <div className="w-[90px] shrink-0 text-sm">
                    {new Date(r.race_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-sm flex-1 min-w-0">
                    {r.event_name.split('|')[0]}
                  </div>
                  <div className="text-sm w-14 shrink-0">
                    {r.place}
                  </div>
                  <div className="text-sm flex-1 min-w-0 truncate max-w-[260px]">
                    {r.team}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center w-1/2 h-screen">
        <ImageCarousel images={bikeImages} sizeClassName="w-[90vw] h-[90vh]" />
      </div>
    </div>
  )
}

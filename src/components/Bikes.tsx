import { useCyclingResults } from '../hooks/useCyclingResults'
import { PiArrowSquareOut } from 'react-icons/pi'

export function Bikes() {
  const { data: results, isLoading, isError } = useCyclingResults()

  return (
    <div className='flex flex-col flex-1 justify-center items-center'>
      <div
        className='flex flex-col gap-10 w-[800px] text-[32px] font-noto-sans font-bold text-[#1A4561]'
        style={{ letterSpacing: '0.05em' }}
      >
        <div className='flex flex-col gap-4'>
          <button
            style={{ lineHeight: '.8', textShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)' }}
            className="font-tusker whitespace-nowrap text-[100px] font-medium cursor-pointer text-[#E6B389] hover:border-b-2 hover:border-[#E6B389] w-fit flex flex-row gap-2 items-end"
            onClick={() => window.open('https://www.road-results.com/racer/238856s', '_blank')}
          >
            <span>race results</span>
            <PiArrowSquareOut size={30} />
          </button>

          {isLoading || isError || !results ? (
            <div className="animate-pulse bg-white/20 rounded-lg h-[200px]" />
          ) : (
            <div className="flex flex-col w-full gap-2">
              {results.map((r) => (
                <div
                  key={`${r.id}-${r.race_id}`}
                  className="flex flex-row items-center border-transparent last:border-b-0 hover:bg-[#E6B389]/80 bg-neutral-100/70 gap-2 p-2 rounded text-sm font-normal"
                >
                  <div className="w-[90px] shrink-0">
                    {new Date(r.race_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    {r.event_name.split('|')[0]}
                  </div>
                  <div className="w-14 shrink-0">
                    {r.place}
                  </div>
                  <div className="flex-1 min-w-0 truncate max-w-[260px]">
                    {r.team}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

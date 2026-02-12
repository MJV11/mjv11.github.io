import { PiCaretRightBold, PiCaretLeftBold } from 'react-icons/pi'
import { CornerBorders } from '../utils'
import { usePhoto } from '../contexts/PhotoContext'

export const PhotoSwitcher = () => {
  const { next, prev, currentIndex, imageCount } = usePhoto()

  return (
    <div className='relative flex flex-row items-center justify-end gap-4 transition-all duration-300 p-[14px] z-10'>
      <CornerBorders className='w-4 h-4' />
      <button onClick={prev} aria-label='Previous photo'>
        <PiCaretLeftBold size={30} className='text-white hover:text-[#f3dbc7]' />
      </button>
      <span className='text-white font-medium text-[20px]'>{currentIndex + 1} / {imageCount}</span>
      <button onClick={next} aria-label='Next photo'>
        <PiCaretRightBold size={30} className='text-white hover:text-[#f3dbc7]' />
      </button>
    </div>
  )
}
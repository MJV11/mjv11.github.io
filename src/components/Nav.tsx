import { CornerBorders } from '../utils'
import { useNav } from '../contexts/NavContext'
import { NAV_PAGES } from '../contexts/NavContext'

export const Nav = () => {
  const { currentPage, setCurrentPage } = useNav()

  return (
    <div className='relative flex flex-row items-center justify-end p-[14px]'>
      <CornerBorders className='w-4 h-4' />
      <div className='flex flex-row items-center justify-end gap-4 px-5'>
        {NAV_PAGES.map((item) => (
          <button
            key={item}
            onClick={() => setCurrentPage(item)}
            className={`whitespace-nowrap text-[20px] font-medium cursor-pointer hover:text-[#E6B389]
                relative transition-all duration-300 after:content-[''] after:absolute after:w-full 
                after:scale-x-0 after:h-[2px] after:-bottom-1 after:left-0 after:bg-[#E6B389] 
                after:origin-bottom-right after:transition-transform after:duration-300 
                hover:after:scale-x-100 hover:after:origin-bottom-left
                ${currentPage === item ? 'text-[#E6B389]' : 'text-black'}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
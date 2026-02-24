import { useNav, NAV_PAGES } from '../contexts/NavContext'
import { usePostHog } from '@posthog/react'

export const Nav = () => {
    const { currentPage, setCurrentPage } = useNav()
    const posthog = usePostHog()

    const handleNavClick = (item: string) => {
        posthog.capture('nav_click', { to: item, from: currentPage })
        setCurrentPage(item)
    }

    return (
        <div className='flex flex-row items-center justify-end w-screen gap-4 px-5'>
            {NAV_PAGES.map((item) => (
                <button
                    key={item}
                    onClick={() => handleNavClick(item)}
                    className={`whitespace-nowrap text-[30px] font-medium font-jost cursor-pointer hover:text-gray-500
                    relative transition-all duration-300 after:content-[''] after:absolute after:w-full 
                    after:scale-x-0 after:h-[2px] after:-bottom-[1px] after:left-0 after:bg-black
                    after:origin-bottom-right after:transition-transform after:duration-300 
                    hover:after:scale-x-100 hover:after:origin-bottom-left text-black
                    ${currentPage === item ? 'after:scale-x-100 after:origin-bottom-left' : ''}`}
                >
                    <span className={`whitespace-nowrap text-[30px] font-medium font-jost cursor-pointer hover:text-gray-500
                        relative transition-all duration-300 after:content-[''] after:absolute after:w-full 
                        after:scale-x-0 after:h-[2px] after:-bottom-[2px] after:left-0 hover:after:bg-gray-500 
                        after:origin-bottom-right after:transition-transform after:duration-300 
                        hover:after:scale-x-100 hover:after:origin-bottom-left text-black z-10
                    `}>
                        {item}
                    </span>
                </button>
            ))}
        </div>
    )
}
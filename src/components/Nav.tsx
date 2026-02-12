import { CornerBorders } from '../utils'

export const Nav = () => {
  return (
    <div className='relative flex flex-row items-center justify-end p-[14px]'>
      <CornerBorders className='w-4 h-4' />
      <div className='flex flex-row items-center justify-end gap-4 px-5'>
        {[
            {title: 'home', href: '#'},
            {title: 'works', href: '#'},
            {title: 'race results', href: '#'},
            {title: 'contact', href: '#'},
            {title: 'about', href: '#'},
        ].map((item, index) => (
            <button key={index} onClick={() => window.location.href = item.href} 
            className={`text-white whitespace-nowrap text-[20px] font-medium cursor-pointer hover:text-[#f3dbc7]

                relative transition-all duration-300 after:content-[''] after:absolute after:w-full 
                after:scale-x-0 after:h-[2px] after:-bottom-1 after:left-0 after:bg-[#f3dbc7] 
                after:origin-bottom-right after:transition-transform after:duration-300 
                hover:after:scale-x-100 hover:after:origin-bottom-left`}>
                {item.title}
            </button>
        ))}
      </div>
    </div>
  )
}
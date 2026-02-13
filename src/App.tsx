import { Bikes, Nav, AboutPage } from './components'
import { PhotoSwitcher } from './components/PhotoSwitcher'
import { PhotoBackground } from './components/PhotoBackground'
import { TextBackground } from './components/TextBackground'
import { useNav } from './contexts/NavContext'

function App() {
  const { currentPage } = useNav()

  return (
    <div className='relative min-h-screen w-screen overflow-hidden'>
      <PhotoBackground />
      <TextBackground />
      <div className='p-[14px] z-10 absolute top-0 left-1/2 -translate-x-1/2'>
        <Nav />
      </div>

      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'bikes' && (
        <Bikes />
      )}
    </div>
  )
}

export default App

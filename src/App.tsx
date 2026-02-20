import { Nav, Contact, ImageCarousel, WorkItem, MosaicBackground, LoadingScreen, AboutInfo } from './components'
import { useNav } from './contexts/NavContext'
import { usePortfolioImagesContext } from './contexts/PortfolioImagesContext'
import { SECTIONS_WITH_IMAGES } from './config/portfolioImages'
import { useWorksState } from './hooks/useWorksState'
import { PiArrowSquareOutBold } from 'react-icons/pi'

function App() {
  const { currentPage } = useNav()
  const { imagesBySection, isReady } = usePortfolioImagesContext()
  const hasCarouselSection = (SECTIONS_WITH_IMAGES as readonly string[]).includes(currentPage)
  const isFrontPage = currentPage === 'root'
  const showCarousel = hasCarouselSection || isFrontPage
  const isWorksPage = currentPage === 'works'
  const isContactPage = currentPage === 'contact'
  const isMobile = window.innerWidth < 768

  const carouselImages =
    (hasCarouselSection ? imagesBySection[currentPage] : imagesBySection[SECTIONS_WITH_IMAGES[0]]) ?? []

  const {
    isExpanded,
    expandedWork,
    getLabelForIndex,
    handleIndexChange,
    handleImageClick,
    handleCloseDetails,
  } = useWorksState(isWorksPage)

  return (
    <div className='fixed inset-0 flex flex-col overflow-hidden'>
      <LoadingScreen isVisible={!isReady} />
      <MosaicBackground />
      <div className='relative md:absolute top-0 right-0 p-[14px] z-20 flex justify-center pointer-events-none'>
        <div className='pointer-events-auto'>
          <Nav />
        </div>
      </div>
        <div className={`z-30 relative md:absolute md:top-0 md:left-0 p-[14px] z-20 font-jost text-[24px] font-medium text-black flex flex-col ${isFrontPage ? '' : 'hidden md:flex'}`}>
          <span className='md:max-w-[500px]'>Hello, I'm Max Vink. I'm a software engineer and cyclist based in Berkeley, California.</span>
          <AboutInfo />
        </div>
      
      <a href='https://github.com/mjv11/portfolio2' target='_blank' rel='noopener noreferrer' 
      className={`absolute bottom-0 left-0 m-[14px] px-3 border-2 border-black z-20 flex items-center gap-1.5 text-black hover:bg-black hover:text-white transition-colors ${isMobile && isContactPage ? 'hidden md:flex' : 'flex'}`}>
        <span className='font-noto-sans text-[20px] font-medium'>src</span>
        <PiArrowSquareOutBold size={16} className='mt-[2px]'/>
      </a>

      <main className='flex-1 min-h-0 overflow-y-auto z-10'>
        {isReady && carouselImages.length > 0 && (
          <div
            className='absolute top-0 left-0 md:relative w-full shrink-0 overflow-y-scroll md:overflow-y-hidden'
            style={{
              height: showCarousel ? '100vh' : 0,
              visibility: showCarousel ? 'visible' : 'hidden',
              pointerEvents: showCarousel ? 'auto' : 'none',
            }}
          >
            <div className="absolute inset-0 flex flex-col md:flex-row transition-all duration-500 ease-in-out scroll-content overflow-y-auto">
              {/* Works detail panel — slides in from the left */}
              <div
                className={`shrink-0 overflow-y-none transition-all duration-500 ease-in-out z-10 ${isExpanded ? 'w-full md:w-[40%]' : 'w-0'}`}
                style={{
                  opacity: isExpanded ? 1 : 0,
                  pointerEvents: isExpanded ? 'auto' : 'none',
                }}
              >
                <WorkItem work={expandedWork} onClose={handleCloseDetails} />
              </div>

              {/* Contact panel — slides in from the left on contact page */}
              <div
                className={`shrink-0 overflow-y-auto transition-all duration-500 ease-in-out z-10 ${isContactPage ? 'w-full md:w-[40%]' : 'w-0'}`}
                style={{
                  opacity: isContactPage ? 1 : 0,
                  pointerEvents: isContactPage ? 'auto' : 'none',
                }}
              >
                <Contact />
              </div>
              </div>

              {/* Single persistent carousel */}
              <div className="absolute top-0 left-0">
                <ImageCarousel
                  images={carouselImages}
                  sizeClassName='w-screen h-screen'
                  canvasScale={1.8}
                  sectionId={hasCarouselSection ? currentPage : undefined}
                  onIndexChange={handleIndexChange}
                  onImageClick={handleImageClick}
                  getLabelForIndex={getLabelForIndex}
                  disabled={isExpanded || isFrontPage}
                  isTopMode={isFrontPage}
                  viewShift={(isExpanded || isContactPage) && !isMobile ? -0.2 : 0}
                />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

import { Nav, Contact, ImageCarousel, WorkItem, MosaicBackground, LoadingScreen, AboutInfo } from './components'
import { useNav } from './contexts/NavContext'
import { usePortfolioImagesContext } from './contexts/PortfolioImagesContext'
import { SECTIONS_WITH_IMAGES } from './config/portfolioImages'
import { useWorksState } from './hooks/useWorksState'
import { PiArrowSquareOutBold } from 'react-icons/pi'
import { usePostHog } from '@posthog/react'

function App() {
  const { currentPage } = useNav()
  const posthog = usePostHog()
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
      <div className='relative md:absolute top-0 right-0 p-[14px] z-20 flex justify-center'>
        <Nav />
      </div>

      <a href='https://github.com/mjv11/portfolio2' target='_blank' rel='noopener noreferrer'
        onClick={() => posthog.capture('interaction', { button: 'source_code', page: currentPage })}
        className={`absolute bottom-0 left-0 m-[14px] px-3 border-2 border-black z-20 flex items-center gap-1.5 text-black hover:bg-black hover:text-white transition-colors ${isMobile && (isContactPage || isExpanded) ? 'hidden md:flex' : 'flex'}`}>
        <span className='font-noto-sans text-[20px]'>src</span>
        <PiArrowSquareOutBold size={16} className='mt-[2px]' />
      </a>

      <main className='flex-1 min-h-0 overflow-y-auto z-10'>
        {isReady && carouselImages.length > 0 && (
          <div
            className='absolute inset-0 h-full w-full shrink-0'
            style={{
              height: showCarousel ? '100vh' : 0,
              visibility: showCarousel ? 'visible' : 'hidden',
              pointerEvents: showCarousel ? 'auto' : 'none',
            }}
          >
            {/* Single persistent carousel */}
            <div className={`absolute top-0 left-0 transition-all duration-300 ${(isExpanded || isContactPage) && isMobile ? 'opacity-0' : 'opacity-100'}`}>
              <ImageCarousel
                images={carouselImages}
                sizeClassName={`w-screen h-[100dvh]`}
                canvasScale={1.8}
                sectionId={hasCarouselSection ? currentPage : undefined}
                onIndexChange={handleIndexChange}
                onImageClick={handleImageClick}
                getLabelForIndex={getLabelForIndex}
                disabled={isExpanded || isFrontPage}
                isTopMode={isFrontPage}
                viewShift={(isExpanded || isContactPage) && !isMobile ? -0.15 : 0}
              />
            </div>
            <div className="absolute flex flex-col transition-all duration-500 ease-in-out my-16 md:my-0">
              <div className={`z-40 relative p-[14px] font-jost text-[24px] font-medium text-black flex flex-col ${isFrontPage ? '' : 'hidden md:flex'}`}>
                <span className='md:max-w-[500px]'>Hello, I'm Max Vink. I'm a software engineer and cyclist based in Berkeley, California.</span>
                <AboutInfo />
              </div>
              {/* Works detail panel — slides in from the left */}
              <div
                className={`shrink-0 overflow-y-auto transition-all duration-500 ease-in-out z-10 ${isExpanded ? 'w-full h-[calc(100dvh-4rem)] md:h-screen' : 'w-0 h-0'}`}
                style={{
                  opacity: isExpanded ? 1 : 0,
                  pointerEvents: isExpanded ? 'auto' : 'none',
                }}
              >
                <WorkItem work={expandedWork} onClose={handleCloseDetails} />
              </div>

              {/* Contact panel — slides in from the left on contact page */}
              <div
                className={`shrink-0 overflow-y-auto transition-all duration-500 ease-in-out z-10 ${isContactPage ? 'w-full md:w-[40%] h-[calc(100dvh-4rem)] md:h-screen' : 'w-0 h-0'}`}
                style={{
                  opacity: isContactPage ? 1 : 0,
                  pointerEvents: isContactPage ? 'auto' : 'none',
                }}
              >
                <Contact />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App

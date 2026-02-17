import { Bikes, Nav, AboutPage, ImageCarousel, WorkItem, MosaicBackground } from './components'
import { useNav } from './contexts/NavContext'
import { usePortfolioImagesContext } from './contexts/PortfolioImagesContext'
import { SECTIONS_WITH_IMAGES } from './config/portfolioImages'
import { useWorksState } from './hooks/useWorksState'

function App() {
  const { currentPage } = useNav()
  const { imagesBySection, isReady } = usePortfolioImagesContext()
  const hasCarouselSection = (SECTIONS_WITH_IMAGES as readonly string[]).includes(currentPage)
  const isWorksPage = currentPage === 'works'

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
      <MosaicBackground />
      <div className='shrink-0 p-[14px] z-10 flex justify-center'>
        <Nav />
      </div>
      {!isReady && (
        <div className='relative w-full h-[90vh] shrink-0 flex items-center justify-center text-white/70'>
          Loading images…
        </div>
      )}
      <main className='scroll-content flex-1 min-h-0 overflow-y-auto z-10'>
        {isReady && carouselImages.length > 0 && (
          <div
            className='relative w-full shrink-0 overflow-hidden'
            style={{
              height: hasCarouselSection ? '90vh' : 0,
              visibility: hasCarouselSection ? 'visible' : 'hidden',
              pointerEvents: hasCarouselSection ? 'auto' : 'none',
            }}
          >
            <div className="absolute inset-0 flex flex-col md:flex-row transition-all duration-500 ease-in-out">
              {/* Works detail panel — slides in from the left */}
              <div
                className="shrink-0 overflow-y-none transition-all duration-500 ease-in-out z-10"
                style={{
                  width: isExpanded ? '40%' : '0%',
                  opacity: isExpanded ? 1 : 0,
                  pointerEvents: isExpanded ? 'auto' : 'none',
                }}
              >
                <WorkItem work={expandedWork} onClose={handleCloseDetails} />
              </div>

              {/* Single persistent carousel */}
              <div
                className="shrink-0 flex items-center justify-center transition-all duration-500 ease-in-out"
                style={{ width: isExpanded ? '60%' : '100%' }}
              >
                <ImageCarousel
                  images={carouselImages}
                  sizeClassName="w-[100vw] h-[80vh]"
                  canvasScale={1.8}
                  sectionId={hasCarouselSection ? currentPage : undefined}
                  onIndexChange={handleIndexChange}
                  onImageClick={handleImageClick}
                  getLabelForIndex={getLabelForIndex}
                  disabled={isExpanded}
                />
              </div>
            </div>
          </div>
        )}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'bikes' && <Bikes />}
      </main>
    </div>
  )
}

export default App

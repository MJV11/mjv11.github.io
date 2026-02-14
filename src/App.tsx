import { Bikes, Nav, AboutPage, ImageCarousel } from './components'
import { TextBackground } from './components/TextBackground'
import { useNav } from './contexts/NavContext'
import { usePortfolioImagesContext } from './contexts/PortfolioImagesContext'
import { SECTIONS_WITH_IMAGES } from './config/portfolioImages'

function App() {
  const { currentPage } = useNav()
  const { imagesBySection, isReady } = usePortfolioImagesContext()
  const hasCarouselSection = (SECTIONS_WITH_IMAGES as readonly string[]).includes(currentPage)
  // Keep carousel mounted with non-empty images so we never pay Three.js init when switching to bikes.
  // When this page has a carousel, use its images; otherwise use first section's to keep scene alive.
  const carouselImages =
    (hasCarouselSection ? imagesBySection[currentPage] : imagesBySection[SECTIONS_WITH_IMAGES[0]]) ?? []

  return (
    <div className='fixed inset-0 flex flex-col overflow-hidden'>
      <TextBackground />
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
            <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
              <ImageCarousel
                images={carouselImages}
                sizeClassName='w-[100vw] h-[80vh]'
                canvasScale={1.8}
              />
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

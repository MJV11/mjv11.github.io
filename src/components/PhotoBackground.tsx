import { usePhoto } from '../contexts/PhotoContext'

export const PhotoBackground = () => {
  const { currentImage } = usePhoto()

  if (!currentImage) return null

  return (
    <div
      className='absolute top-0 left-0 w-full h-full brightness-[.8] z-[-1]'
      style={{
        backgroundImage: `url(${currentImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    />
  )
}

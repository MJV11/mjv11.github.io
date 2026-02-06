import PixelRiver from './components/PixelRiver'

function App() {
  return (
    <div className="relative w-full min-h-screen">
      <PixelRiver />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          Welcome
        </h1>
        <p className="text-2xl text-gray-600">
          Your content goes here
        </p>
      </div>
    </div>
  )
}

export default App

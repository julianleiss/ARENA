// ARENA V1.0 - Map Page
import MapView from '@/app/components/MapView'

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <a href="/" className="text-gray-600 hover:text-gray-900 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ARENA</h1>
            <p className="text-xs text-gray-500">Scene Viewer - Núñez, Buenos Aires</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            v0.101
          </span>
        </div>
      </header>
      <div className="flex-1 relative">
        <MapView />
      </div>
    </div>
  )
}
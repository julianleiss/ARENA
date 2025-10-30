'use client'

// ARENA - Map Page (v0.101 - Google Maps with Deck.gl)
import MapView from '@/app/components/MapView'

export default function MapPage() {
  // Log API key status for debugging
  console.log('🗺️ Map Page - API Key Status:', {
    hasKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    keyPrefix: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...'
  })

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">ARENA</h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
              v0.101
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/proposals"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
          >
            Proposals
          </a>
        </div>
      </div>

      {/* Google Maps with Deck.gl */}
      <MapView />
    </div>
  )
}

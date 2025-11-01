'use client'

// ARENA - Map Page (Homepage)
import { useState } from 'react'
import MapView from '@/app/components/MapView'
import SandboxModal from '@/app/components/SandboxModal'
import PublishProposalForm from '@/app/components/PublishProposalForm'
import { nanoid } from 'nanoid'

interface SelectedArea {
  type: 'building' | 'point' | 'polygon'
  geometry: any
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export default function MapPage() {
  const [mapMode, setMapMode] = useState<'navigate' | 'create'>('navigate')
  const [selectionMode, setSelectionMode] = useState<'building' | 'point' | 'polygon'>('building')

  // Sandbox modal state
  const [isSandboxOpen, setIsSandboxOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null)
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null)

  // Publish form state
  const [isPublishFormOpen, setIsPublishFormOpen] = useState(false)

  // Handle area selection from map
  const handleAreaSelected = (area: SelectedArea) => {
    console.log('📍 Area selected:', area)
    setSelectedArea(area)

    // Generate temporary proposal ID
    const proposalId = nanoid()
    setCurrentProposalId(proposalId)

    // Open sandbox modal
    setIsSandboxOpen(true)
    setMapMode('navigate') // Reset to navigate mode
  }

  // Handle publish button click from sandbox
  const handlePublishClick = () => {
    setIsPublishFormOpen(true)
  }

  // Handle publish submission
  const handlePublish = async (data: {
    title: string
    description: string
    visibility: 'public' | 'private'
    tags: string[]
  }) => {
    console.log('🚀 Publishing proposal:', data)

    // TODO: Save to database via API
    // For now, just close modals and show success

    setIsPublishFormOpen(false)
    setIsSandboxOpen(false)
    setSelectedArea(null)
    setCurrentProposalId(null)

    // Show success toast
    alert('¡Propuesta publicada con éxito!')
  }

  // Handle sandbox close
  const handleSandboxClose = () => {
    setIsSandboxOpen(false)
    setSelectedArea(null)
    setCurrentProposalId(null)
  }

  // Log API key status for debugging
  console.log('🗺️ Map Page - API Key Status:', {
    hasKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    keyPrefix: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...'
  })

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-md sticky">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">ARENA</h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
              v0.3
            </span>
          </div>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg transition-colors"
            >
              <span>🗺️</span>
              <span>Map</span>
            </a>
            <a
              href="/proposals"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>📋</span>
              <span>Proposals</span>
            </a>
          </nav>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-4">
          {/* Navigate/Create Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMapMode('navigate')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                mapMode === 'navigate'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Navigate
              </span>
            </button>
            <button
              onClick={() => setMapMode('create')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                mapMode === 'create'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create
              </span>
            </button>
          </div>

          {/* Selection Mode (only in Create mode) */}
          {mapMode === 'create' && (
            <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-xl p-1">
              <button
                onClick={() => setSelectionMode('building')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectionMode === 'building'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-700 hover:bg-indigo-100'
                }`}
                title="Select buildings"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </button>
              <button
                onClick={() => setSelectionMode('point')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectionMode === 'point'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-700 hover:bg-indigo-100'
                }`}
                title="Place a point"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setSelectionMode('polygon')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectionMode === 'polygon'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-700 hover:bg-indigo-100'
                }`}
                title="Draw a polygon"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip (only in Create mode) */}
      {mapMode === 'create' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium animate-pulse">
          {selectionMode === 'building' && '👆 Click a building to create proposal'}
          {selectionMode === 'point' && '📍 Click anywhere on the map'}
          {selectionMode === 'polygon' && '✏️ Click to draw an area'}
        </div>
      )}

      {/* Google Maps with Deck.gl */}
      <MapView
        externalMapMode={mapMode}
        externalSelectionMode={selectionMode}
        onMapModeChange={setMapMode}
        onSelectionModeChange={setSelectionMode}
        onAreaSelected={handleAreaSelected}
      />

      {/* Sandbox Modal */}
      {isSandboxOpen && currentProposalId && (
        <SandboxModal
          isOpen={isSandboxOpen}
          selectedArea={selectedArea}
          proposalId={currentProposalId}
          onPublish={handlePublishClick}
          onClose={handleSandboxClose}
        />
      )}

      {/* Publish Form Overlay */}
      <PublishProposalForm
        isOpen={isPublishFormOpen}
        onPublish={handlePublish}
        onCancel={() => setIsPublishFormOpen(false)}
      />
    </div>
  )
}

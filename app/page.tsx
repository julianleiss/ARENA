'use client'

// ARENA - Map Page (Homepage)
import { useState } from 'react'
import Header from '@/app/components/Header'
import MapView from '@/app/components/MapView'
import SandboxModal from '@/app/components/SandboxModal'
import PublishProposalForm from '@/app/components/PublishProposalForm'
import { ProposalsPanel } from '@/app/components/ProposalsPanel'
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

  // Proposals panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hoveredProposal, setHoveredProposal] = useState<string | null>(null)

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
      {/* Unified Header */}
      <Header
        onOpenProposals={() => setIsPanelOpen(true)}
        createMode={mapMode === 'create'}
        onToggleCreate={() => setMapMode(mapMode === 'create' ? 'navigate' : 'create')}
        selectedGeometry={selectionMode}
        onSelectGeometry={setSelectionMode}
      />

      {/* Tooltip (only in Create mode) */}
      {mapMode === 'create' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium animate-pulse">
          {selectionMode === 'building' && '👆 Haz clic en un edificio para crear propuesta'}
          {selectionMode === 'point' && '📍 Haz clic en cualquier lugar del mapa'}
          {selectionMode === 'polygon' && '✏️ Haz clic para dibujar un área'}
        </div>
      )}

      {/* Google Maps with Deck.gl - with header spacing */}
      <div className="pt-20 h-full">
        <MapView
          externalMapMode={mapMode}
          externalSelectionMode={selectionMode}
          onMapModeChange={setMapMode}
          onSelectionModeChange={setSelectionMode}
          onAreaSelected={handleAreaSelected}
        />
      </div>

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

      {/* Proposals Panel */}
      <ProposalsPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onProposalClick={(id) => {
          console.log('📍 Proposal clicked:', id)
          // Optionally: center map on proposal location
        }}
        onProposalHover={setHoveredProposal}
      />
    </div>
  )
}

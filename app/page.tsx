'use client'

// ARENA - Map Page (Homepage)
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/app/components/Header'
import MapView from '@/app/components/MapView'
import SandboxOverlay from '@/app/components/SandboxOverlay'
import ProposalFormModal, { ProposalFormData } from '@/app/components/ProposalFormModal'
import { ProposalsPanel } from '@/app/components/ProposalsPanel'
import { nanoid } from 'nanoid'

interface SelectedArea {
  type: 'building' | 'point' | 'polygon'
  geometry: any
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

export default function MapPage() {
  const router = useRouter()
  const [mapMode, setMapMode] = useState<'navigate' | 'create'>('navigate')
  const [selectionMode, setSelectionMode] = useState<'building' | 'point' | 'polygon'>('building')

  // Sandbox placement state
  const [placedGeometry, setPlacedGeometry] = useState<SelectedArea | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Proposals panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hoveredProposal, setHoveredProposal] = useState<string | null>(null)

  // Handle area selection from map (when in create mode)
  const handleAreaSelected = (area: SelectedArea) => {
    console.log('📍 Area selected:', area)
    setPlacedGeometry(area)
  }

  // Handle finalize placement → open form
  const handleFinalizePlacement = () => {
    if (!placedGeometry) return
    setIsFormOpen(true)
  }

  // Handle cancel placement
  const handleCancelPlacement = () => {
    setMapMode('navigate')
    setPlacedGeometry(null)
  }

  // Handle proposal submission
  const handleProposalSubmit = async (formData: ProposalFormData) => {
    console.log('🚀 Creating proposal:', formData)

    // Generate temporary user ID (until auth is implemented)
    const tempUserId = `temp-${nanoid()}`

    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId: tempUserId,
          title: formData.title,
          summary: formData.description.substring(0, 200), // First 200 chars as summary
          body: formData.description,
          geom: formData.geometry,
          layer: 'micro', // Default layer
          status: 'public', // Public by default
          tags: formData.tags,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create proposal')
      }

      const newProposal = await response.json()
      console.log('✅ Proposal created:', newProposal)

      // Reset states
      setIsFormOpen(false)
      setPlacedGeometry(null)
      setMapMode('navigate')

      // Show success message
      alert(`¡Propuesta "${formData.title}" creada con éxito!`)

      // Optional: Navigate to proposal detail
      // router.push(`/proposals/${newProposal.id}`)
    } catch (error) {
      console.error('Error creating proposal:', error)
      throw error // Re-throw to let form handle error display
    }
  }

  // Handle form cancel
  const handleFormCancel = () => {
    setIsFormOpen(false)
    // Keep placement so user can edit/finalize again
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

      {/* Sandbox Overlay (only in Create mode) */}
      {mapMode === 'create' && (
        <SandboxOverlay
          geometryType={selectionMode}
          hasPlacement={!!placedGeometry}
          onFinalize={handleFinalizePlacement}
          onCancel={handleCancelPlacement}
        />
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

      {/* Proposal Form Modal */}
      {placedGeometry && (
        <ProposalFormModal
          isOpen={isFormOpen}
          geometryType={placedGeometry.type}
          geometryData={placedGeometry.geometry}
          onSubmit={handleProposalSubmit}
          onCancel={handleFormCancel}
        />
      )}

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

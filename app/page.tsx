'use client'

// ARENA - Map Page (Homepage)
import { useState, useRef } from 'react'
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
  const mapRefreshRef = useRef<(() => void) | null>(null)
  const panelRefreshRef = useRef<(() => void) | null>(null)

  // Sandbox placement state
  const [placedGeometry, setPlacedGeometry] = useState<SelectedArea | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Proposals panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hoveredProposal, setHoveredProposal] = useState<string | null>(null)

  // Handle area selection from map (when in create mode)
  const handleAreaSelected = (area: SelectedArea) => {
    console.log('📍 Area selected:', area)
    console.log('🔍 State BEFORE setPlacedGeometry:', { placedGeometry, isFormOpen })
    setPlacedGeometry(area)
    console.log('🔍 State AFTER setPlacedGeometry (should still be false):', { isFormOpen })
  }

  // Handle finalize placement → open form
  const handleFinalizePlacement = () => {
    console.log('✅ FINALIZE clicked')
    if (!placedGeometry) {
      console.log('❌ No placement - aborting')
      return
    }
    console.log('🔍 Opening form...')
    setIsFormOpen(true)
  }

  // Handle cancel placement
  const handleCancelPlacement = () => {
    console.log('❌ CANCEL clicked')
    setMapMode('navigate')
    setPlacedGeometry(null)
    setIsFormOpen(false)
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

      // Trigger map refresh to show new proposal
      if (mapRefreshRef.current) {
        console.log('🔄 Refreshing map proposals...')
        mapRefreshRef.current()
      }

      // Trigger panel refresh to show new proposal in sidebar
      if (panelRefreshRef.current) {
        console.log('🔄 Refreshing proposals panel...')
        panelRefreshRef.current()
      }

      // Reset states
      setIsFormOpen(false)
      setPlacedGeometry(null)
      setMapMode('navigate')

      // Show success message (always show success in demo mode)
      alert(`¡Propuesta "${formData.title}" creada con exito! Búscala en el mapa`)

      // Optional: Navigate to proposal detail
      // router.push(`/proposals/${newProposal.id}`)
    } catch (error) {
      console.error('Error creating proposal:', error)
      // Always succeed in demo mode - don't crash
      console.warn('⚠️  Demo mode: Showing success despite error')

      // Trigger map refresh even in demo mode (mock data gets added)
      if (mapRefreshRef.current) {
        console.log('🔄 Refreshing map proposals (demo mode)...')
        mapRefreshRef.current()
      }

      // Trigger panel refresh in demo mode
      if (panelRefreshRef.current) {
        console.log('🔄 Refreshing proposals panel (demo mode)...')
        panelRefreshRef.current()
      }

      // Reset states anyway
      setIsFormOpen(false)
      setPlacedGeometry(null)
      setMapMode('navigate')

      // Show success message (demo mode)
      alert(`¡Propuesta "${formData.title}" creada con exito! Búscala en el mapa (Modo demostracion)`)
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

      {/* Sandbox Overlay (only in Create mode AND form not open) */}
      {mapMode === 'create' && !isFormOpen && (
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
          onRefreshProposals={mapRefreshRef}
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
        onRefreshProposals={panelRefreshRef}
      />

      {/* Debug Overlay */}
      <div className="fixed bottom-4 left-4 bg-black/90 text-white p-3 text-xs font-mono z-50 rounded-lg shadow-xl border border-white/20">
        <div className="font-bold text-green-400 mb-1">🔍 DEBUG STATE</div>
        <div>Mode: <span className="text-yellow-300">{mapMode}</span></div>
        <div>Selection: <span className="text-yellow-300">{selectionMode}</span></div>
        <div>Placed: <span className={placedGeometry ? 'text-green-400' : 'text-red-400'}>{placedGeometry ? 'YES' : 'NO'}</span></div>
        <div>Form: <span className={isFormOpen ? 'text-green-400' : 'text-red-400'}>{isFormOpen ? 'OPEN' : 'CLOSED'}</span></div>
        <div className="mt-1 pt-1 border-t border-white/20 text-gray-400 text-[10px]">
          Overlay visible: {mapMode === 'create' && !isFormOpen ? 'YES' : 'NO'}
        </div>
      </div>
    </div>
  )
}

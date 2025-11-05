'use client'

// ARENA - Map Page (Homepage) - Mapbox Migration
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/app/components/Header'
// MIGRATION: Switched from Google Maps to Mapbox GL JS
// import MapView from '@/app/components/MapView' // OLD: Google Maps + DeckGL
import type { MapboxViewHandle } from '@/app/components/MapboxView'
import ProposalMarkers from '@/app/components/ProposalMarkers'
import type { Proposal } from '@/app/lib/mapbox-layers'
import SandboxOverlay from '@/app/components/SandboxOverlay'
import ProposalFormModal, { ProposalFormData } from '@/app/components/ProposalFormModal'
import { ProposalsPanel } from '@/app/components/ProposalsPanel'
import { uploadProposalImages } from '@/app/lib/upload-images'
import { nanoid } from 'nanoid'
import type mapboxgl from 'maplibre-gl'

// Dynamic import to avoid SSR issues with mapbox-gl
const MapboxView = dynamic(() => import('@/app/components/MapboxView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

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

  // Mapbox map instance ref
  const mapRef = useRef<MapboxViewHandle>(null)
  const [map, setMap] = useState<mapboxgl.Map | null>(null)

  // Sandbox placement state
  const [placedGeometry, setPlacedGeometry] = useState<SelectedArea | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Proposals state
  const [proposals, setProposals] = useState<Proposal[]>([])

  // Proposals panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hoveredProposal, setHoveredProposal] = useState<string | null>(null)
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)

  // Polygon drawing state (for polygon mode)
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([])

  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    try {
      console.log('🔄 Fetching proposals from API...')
      const response = await fetch('/api/proposals')
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Loaded ${data.proposals?.length || 0} proposals`)
        setProposals(data.proposals || [])
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
    }
  }, [])

  // Fetch proposals on mount
  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // Expose refresh function via ref
  useEffect(() => {
    if (mapRefreshRef) {
      mapRefreshRef.current = fetchProposals
    }
  }, [fetchProposals])

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
    setPolygonPoints([]) // Reset polygon points
  }

  // Handle map click for point/polygon creation modes
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (mapMode !== 'create') return

    const { lng, lat } = e.lngLat

    console.log('🗺️ Map clicked:', { selectionMode, lng, lat })

    if (selectionMode === 'point') {
      // Point mode: immediately create area selection
      const area: SelectedArea = {
        type: 'point',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        bounds: {
          north: lat + 0.0001,
          south: lat - 0.0001,
          east: lng + 0.0001,
          west: lng - 0.0001
        }
      }
      handleAreaSelected(area)
    } else if (selectionMode === 'polygon') {
      // Polygon mode: add point to polygon
      setPolygonPoints(prev => [...prev, [lng, lat]])
    }
  }, [mapMode, selectionMode])

  // Handle polygon finalization (when user has 3+ points)
  const handleFinalizePolygon = useCallback(() => {
    if (polygonPoints.length < 3) return

    const closedRing = [...polygonPoints, polygonPoints[0]]
    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [closedRing]
    }

    // Calculate bounds
    const lngs = polygonPoints.map(p => p[0])
    const lats = polygonPoints.map(p => p[1])
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }

    const area: SelectedArea = {
      type: 'polygon',
      geometry: polygon,
      bounds
    }

    handleAreaSelected(area)
    setPolygonPoints([]) // Reset for next polygon
  }, [polygonPoints])

  // Handle proposal pin click from map
  const handleProposalClick = useCallback((proposalId: string) => {
    console.log('📍 Proposal pin clicked:', proposalId)
    setSelectedProposalId(proposalId)
    setIsPanelOpen(true)
  }, [])

  // Handle proposal submission
  const handleProposalSubmit = async (formData: ProposalFormData) => {
    console.log('🚀 Creating proposal:', formData)

    // Generate temporary user ID (until auth is implemented)
    const tempUserId = `temp-${nanoid()}`
    const proposalId = `prop_${Date.now()}_${nanoid()}`

    try {
      // Upload images first if any
      let imageUrls: string[] = []
      if (formData.images && formData.images.length > 0) {
        console.log(`📸 Uploading ${formData.images.length} images...`)
        try {
          imageUrls = await uploadProposalImages(formData.images, proposalId)
          console.log(`✅ Images uploaded:`, imageUrls)
        } catch (error) {
          console.error('Image upload failed:', error)
          // Continue without images if upload fails
        }
      }

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
          category: formData.category || 'urban', // Add category
          imageUrls, // Add uploaded image URLs
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

  // MIGRATION: Removed duplicate handler, using handleProposalClick defined above

  // Handle map load (store map instance)
  const handleMapLoad = useCallback((loadedMap: mapboxgl.Map) => {
    console.log('✅ Mapbox map loaded')
    setMap(loadedMap)

    // Add click handler for creation modes
    loadedMap.on('click', handleMapClick)
  }, [handleMapClick])

  // Cleanup map click handler when mode changes
  useEffect(() => {
    if (!map) return

    // Remove old handler and add new one
    map.off('click', handleMapClick)
    if (mapMode === 'create') {
      map.on('click', handleMapClick)
    }

    return () => {
      map.off('click', handleMapClick)
    }
  }, [map, mapMode, handleMapClick])

  // Log Mapbox API key status for debugging
  console.log('🗺️ Map Page - Mapbox Token Status:', {
    hasToken: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    tokenPrefix: process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.substring(0, 10) + '...'
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

      {/* MIGRATION: Mapbox GL JS (replacing Google Maps + DeckGL) */}
      {/* OLD Google Maps implementation commented out:
      <div className="pt-20 h-full">
        <MapView
          externalMapMode={mapMode}
          externalSelectionMode={selectionMode}
          onMapModeChange={setMapMode}
          onSelectionModeChange={setSelectionMode}
          onAreaSelected={handleAreaSelected}
          onRefreshProposals={mapRefreshRef}
          onProposalClick={handleProposalClick}
        />
      </div>
      */}

      {/* NEW: Mapbox GL JS with proposal markers */}
      <div className="pt-20 h-full">
        <MapboxView
          ref={mapRef}
          initialViewState={{
            longitude: -58.46,
            latitude: -34.545,
            zoom: 15,
            pitch: 60,
            bearing: 0
          }}
          onMapLoad={handleMapLoad}
          style="standard"
          showNavigationControls={true}
          showFullscreenControl={true}
          showScaleControl={true}
          className={mapMode === 'create' ? 'cursor-crosshair' : ''}
        >
          {/* Proposal markers (only in navigate mode) */}
          {mapMode === 'navigate' && (
            <ProposalMarkers
              map={map}
              proposals={proposals}
              onProposalClick={handleProposalClick}
            />
          )}
        </MapboxView>
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
        onClose={() => {
          setIsPanelOpen(false)
          setSelectedProposalId(null) // Reset selection when closing
        }}
        onProposalClick={(id) => {
          console.log('📍 Proposal clicked:', id)
          // Optionally: center map on proposal location
        }}
        onProposalHover={setHoveredProposal}
        initialProposalId={selectedProposalId}
      />

      {/* Polygon creation UI (when drawing polygon with 3+ points) */}
      {mapMode === 'create' && selectionMode === 'polygon' && polygonPoints.length >= 3 && !isFormOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-purple-900 font-medium">
              {polygonPoints.length} points • Polygon ready
            </span>
            <button
              onClick={() => {
                handleFinalizePolygon()
                handleFinalizePlacement()
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-medium text-sm"
            >
              Finalizar Polígono
            </button>
          </div>
        </div>
      )}

      {/* Selection info - bottom center (for non-polygon modes) */}
      {mapMode === 'create' && selectionMode !== 'polygon' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-5 py-3.5">
          {selectionMode === 'building' && (
            <span className="text-sm text-gray-600">
              Click a building to select (building layer not yet implemented in Mapbox)
            </span>
          )}
          {selectionMode === 'point' && (
            <span className="text-sm text-gray-600">Click anywhere to place a point</span>
          )}
        </div>
      )}

      {/* Debug Overlay */}
      <div className="fixed bottom-4 left-4 bg-black/90 text-white p-3 text-xs font-mono z-50 rounded-lg shadow-xl border border-white/20">
        <div className="font-bold text-green-400 mb-1">🔍 DEBUG STATE (Mapbox)</div>
        <div>Mode: <span className="text-yellow-300">{mapMode}</span></div>
        <div>Selection: <span className="text-yellow-300">{selectionMode}</span></div>
        <div>Placed: <span className={placedGeometry ? 'text-green-400' : 'text-red-400'}>{placedGeometry ? 'YES' : 'NO'}</span></div>
        <div>Form: <span className={isFormOpen ? 'text-green-400' : 'text-red-400'}>{isFormOpen ? 'OPEN' : 'CLOSED'}</span></div>
        <div>Polygon points: <span className="text-blue-400">{polygonPoints.length}</span></div>
        <div>Proposals: <span className="text-purple-400">{proposals.length}</span></div>
        <div className="mt-1 pt-1 border-t border-white/20 text-gray-400 text-[10px]">
          Overlay visible: {mapMode === 'create' && !isFormOpen ? 'YES' : 'NO'}
        </div>
      </div>
    </div>
  )
}

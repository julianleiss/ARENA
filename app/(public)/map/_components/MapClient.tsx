// ARENA - Map Client Component (Iteration 5)
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Map, type MapRef } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { MapViewState } from '@deck.gl/core'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { PublishedProposal } from '../_actions/getPublishedProposals'
import { createProposalPinsLayer } from './ProposalPins'
import { createPreviewLayers } from './PreviewLayer'
import ProposalSidePanel from './ProposalSidePanel'

type MapClientProps = {
  proposals: PublishedProposal[]
}

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -58.46,
  latitude: -34.545,
  zoom: 13,
  pitch: 45,
  bearing: 0,
}

export default function MapClient({ proposals }: MapClientProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE)
  const [hoveredProposalId, setHoveredProposalId] = useState<string | null>(
    null
  )
  const [focusedProposalId, setFocusedProposalId] = useState<string | null>(
    null
  )
  const [previewData, setPreviewData] = useState<{
    geom: GeoJSON.FeatureCollection | null
    mask: GeoJSON.Polygon | null
  }>({ geom: null, mask: null })

  // Throttle hover updates (75ms)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleHover = useCallback((id: string | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredProposalId(id)
    }, 75)
  }, [])

  // Preload preview on hover
  useEffect(() => {
    if (hoveredProposalId) {
      const proposal = proposals.find((p) => p.id === hoveredProposalId)
      if (proposal) {
        setPreviewData({
          geom: proposal.geomLOD0,
          mask: proposal.mask,
        })
      }
    } else {
      setPreviewData({ geom: null, mask: null })
    }
  }, [hoveredProposalId, proposals])

  // Handle pin click - flyTo + focus
  const handlePinClick = useCallback(
    (id: string, position: [number, number]) => {
      setFocusedProposalId(id)

      // Fly to proposal location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [position[0], position[1]],
          zoom: 16,
          pitch: 60,
          duration: 1500,
        })
      }
    },
    []
  )

  // Close side panel
  const handleCloseSidePanel = useCallback(() => {
    setFocusedProposalId(null)
  }, [])

  // Transform proposals to pin format
  const proposalPins = useMemo(
    () =>
      proposals.map((p) => ({
        id: p.id,
        title: p.title,
        position: p.centroid,
      })),
    [proposals]
  )

  // Get focused proposal title
  const focusedProposal = useMemo(() => {
    if (!focusedProposalId) return null
    return proposals.find((p) => p.id === focusedProposalId)
  }, [focusedProposalId, proposals])

  // Memoize layers for performance
  const pinsLayer = useMemo(() => {
    return createProposalPinsLayer({
      proposals: proposalPins,
      hoveredId: hoveredProposalId,
      focusedId: focusedProposalId,
      onHover: handleHover,
      onClick: handlePinClick,
    })
  }, [proposalPins, hoveredProposalId, focusedProposalId, handleHover, handlePinClick])

  const previewLayers = useMemo(() => {
    return createPreviewLayers({
      geom: previewData.geom,
      mask: previewData.mask,
      featureThreshold: 500,
    })
  }, [previewData])

  const layers = useMemo(() => {
    return [...previewLayers, pinsLayer]
  }, [previewLayers, pinsLayer])

  return (
    <>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as MapViewState)}
        controller={true}
        layers={layers}
        style={{ position: 'relative' }}
      >
        <Map
          ref={mapRef}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>

      {/* Side Panel */}
      <ProposalSidePanel
        proposalId={focusedProposalId}
        proposalTitle={focusedProposal?.title || null}
        onClose={handleCloseSidePanel}
      />
    </>
  )
}

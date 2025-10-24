// ARENA - Proposal Pins Layer (Iteration 5)
'use client'

import { ScatterplotLayer } from '@deck.gl/layers'

export type ProposalPin = {
  id: string
  title: string
  position: [number, number]
}

type ProposalPinsProps = {
  proposals: ProposalPin[]
  hoveredId: string | null
  focusedId: string | null
  onHover: (id: string | null) => void
  onClick: (id: string, position: [number, number]) => void
}

export function createProposalPinsLayer({
  proposals,
  hoveredId,
  focusedId,
  onHover,
  onClick,
}: ProposalPinsProps) {
  return new ScatterplotLayer({
    id: 'proposal-pins',
    data: proposals,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 1,
    radiusMinPixels: 8,
    radiusMaxPixels: 20,
    lineWidthMinPixels: 2,
    getPosition: (d: ProposalPin) => d.position,
    getRadius: (d: ProposalPin) => {
      if (d.id === focusedId) return 20
      if (d.id === hoveredId) return 16
      return 12
    },
    getFillColor: (d: ProposalPin) => {
      if (d.id === focusedId) return [99, 102, 241, 255] // Indigo-600
      if (d.id === hoveredId) return [129, 140, 248, 255] // Indigo-400
      return [79, 70, 229, 255] // Indigo-700
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 2,
    onHover: (info) => {
      if (info.object) {
        onHover((info.object as ProposalPin).id)
      } else {
        onHover(null)
      }
    },
    onClick: (info) => {
      if (info.object) {
        const pin = info.object as ProposalPin
        onClick(pin.id, pin.position)
      }
    },
    updateTriggers: {
      getRadius: [hoveredId, focusedId],
      getFillColor: [hoveredId, focusedId],
    },
  })
}

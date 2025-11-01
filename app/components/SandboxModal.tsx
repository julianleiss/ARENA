'use client'

// ARENA - Sandbox Modal Overlay
// Full-screen modal for 3D sandbox editor

import { useEffect } from 'react'
import SandboxClient from '@/app/(creator)/sandbox/[id]/_components/SandboxClient'

interface SelectedArea {
  type: 'building' | 'point' | 'polygon'
  geometry: any // GeoJSON geometry
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

interface SandboxModalProps {
  isOpen: boolean
  selectedArea: SelectedArea | null
  proposalId: string
  onPublish: () => void
  onClose: () => void
}

export default function SandboxModal({
  isOpen,
  selectedArea,
  proposalId,
  onPublish,
  onClose,
}: SandboxModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const hasUnsaved = false // TODO: Get from sandbox state
        if (hasUnsaved) {
          if (confirm('¿Tienes cambios sin guardar. ¿Seguro que quieres cerrar?')) {
            onClose()
          }
        } else {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !selectedArea) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="absolute inset-0 bg-gray-900">
        {/* Close Button */}
        <button
          onClick={() => {
            const hasUnsaved = false // TODO: Get from sandbox state
            if (hasUnsaved) {
              if (confirm('¿Tienes cambios sin guardar. ¿Seguro que quieres cerrar?')) {
                onClose()
              }
            } else {
              onClose()
            }
          }}
          className="absolute top-4 right-4 z-[10000] w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
          title="Cerrar (Esc)"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Sandbox Editor */}
        <SandboxClient
          proposalId={proposalId}
          proposalTitle="Nueva Propuesta"
          selectedArea={selectedArea}
          onPublish={onPublish}
          onCancel={onClose}
          isModal={true}
        />
      </div>
    </div>
  )
}

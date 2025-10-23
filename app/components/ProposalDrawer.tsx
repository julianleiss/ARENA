'use client'

// ARENA V1.0 - Proposal Drawer Component
// Side drawer for creating and viewing proposals from the map

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DetectedFeature } from '@/src/lib/feature-detection'

interface DrawerProps {
  isOpen: boolean
  mode: 'create' | 'view'
  onClose: () => void
  coordinates?: { lng: number; lat: number }
  proposalId?: string
  onProposalCreated?: (proposal: any) => void
  selectedFeatures?: DetectedFeature[]
  drawnPolygon?: GeoJSON.Polygon | null
  pointRadius?: number
}

interface ProposalData {
  id: string
  title: string
  summary: string | null
  body: string | null
  status: string
  layer: string
  tags: string[]
  // images: string[] // Temporarily disabled - column doesn't exist in DB
  createdAt: string
  author: {
    name: string | null
  }
  _count: {
    votes: number
    comments: number
  }
}

export default function ProposalDrawer({
  isOpen,
  mode,
  onClose,
  coordinates,
  proposalId,
  onProposalCreated,
  selectedFeatures = [],
  drawnPolygon = null,
  pointRadius,
}: DrawerProps) {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    tags: '',
  })
  // const [images, setImages] = useState<string[]>([]) // Temporarily disabled
  const [loading, setLoading] = useState(false)
  const [proposalData, setProposalData] = useState<ProposalData | null>(null)

  // Fetch proposal data when in view mode
  useEffect(() => {
    if (mode === 'view' && proposalId && isOpen) {
      fetchProposal()
    }
  }, [mode, proposalId, isOpen])

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ title: '', summary: '', tags: '' })
      // setImages([]) // Temporarily disabled
      setProposalData(null)
    }
  }, [isOpen])

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/proposals/${proposalId}`)
      if (response.ok) {
        const data = await response.json()
        setProposalData(data)
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  // Temporarily disabled - images column doesn't exist in DB
  /*
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Limit to 3 images
    const fileArray = Array.from(files).slice(0, 3 - images.length)

    fileArray.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }
  */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coordinates) return

    setLoading(true)

    try {
      // Use expert user from seed data
      const authorId = '550e8400-e29b-41d4-a716-446655440002'

      const payload = {
        authorId,
        title: formData.title,
        summary: formData.summary || null,
        body: formData.summary || null,
        geom: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
        },
        layer: 'micro',
        status: 'public',
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        // OSM Feature Data (multiple features or polygon)
        ...(selectedFeatures.length > 0 && {
          features: selectedFeatures.map(f => ({
            type: f.type,
            osmId: f.osmId,
            name: f.name,
            properties: f.properties,
          })),
        }),
        ...(drawnPolygon && {
          polygon: drawnPolygon,
        }),
        // Temporarily disabled - images column doesn't exist in DB
        // ...(images.length > 0 && { images: images }),
      }

      console.log('Creating proposal with payload:', payload)

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newProposal = await response.json()
        console.log('Proposal created successfully:', newProposal)
        onProposalCreated?.(newProposal)
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error response:', response.status, errorData)
        alert(`Error al crear la propuesta: ${errorData.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert(`Error al crear la propuesta: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-30' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Nueva Propuesta' : 'Detalle de Propuesta'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {mode === 'create' && coordinates && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Selected Features/Polygon Display */}
                {selectedFeatures.length > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-green-900 mb-2">
                      ✓ {selectedFeatures.length} feature{selectedFeatures.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFeatures.map((feature, idx) => (
                        <div key={feature.id} className="text-xs bg-white rounded px-2 py-1">
                          <span className="font-semibold text-green-800">
                            {idx + 1}. {feature.name || `${feature.type}`}
                          </span>
                          <span className="text-green-600 ml-2">({feature.type})</span>
                        </div>
                      ))}
                    </div>
                    {coordinates && (
                      <p className="text-xs text-green-600 font-mono mt-2">
                        Center: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : drawnPolygon ? (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-purple-900 mb-1">
                      ⬡ Polygon area selected
                    </p>
                    <p className="text-xs text-purple-700">
                      {drawnPolygon.coordinates[0].length} points
                    </p>
                    {coordinates && (
                      <p className="text-xs text-purple-600 font-mono mt-2">
                        Center: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                ) : coordinates ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      📍 Point selected {pointRadius && `• ${pointRadius}m radius`}
                    </p>
                    <p className="text-sm text-blue-800 font-mono">
                      {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </p>
                    {pointRadius && (
                      <p className="text-xs text-blue-700 mt-1">
                        Area: ~{Math.round(Math.PI * pointRadius * pointRadius).toLocaleString()}m²
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Título *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Nuevo espacio verde en la esquina"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label
                    htmlFor="summary"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="summary"
                    rows={4}
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Describe tu propuesta..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Etiquetas
                  </label>
                  <input
                    type="text"
                    id="tags"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="espacio-verde, movilidad (separadas por comas)"
                  />
                </div>

                {/* Image Upload - Temporarily disabled (column doesn't exist in DB) */}
                {/*
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes (máximo 3)
                  </label>
                  {images.length < 3 && (
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Click para subir imagen
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Image Previews *\/}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                */}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.title}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                  >
                    {loading ? 'Creando...' : 'Crear Propuesta'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {mode === 'view' && (
              <div className="p-6 space-y-6">
                {loading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                )}

                {proposalData && (
                  <>
                    {/* Title */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {proposalData.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Por {proposalData.author.name || 'Anónimo'} •{' '}
                        {new Date(proposalData.createdAt).toLocaleDateString(
                          'es-AR'
                        )}
                      </p>
                    </div>

                    {/* Summary */}
                    {proposalData.summary && (
                      <div>
                        <p className="text-gray-700">{proposalData.summary}</p>
                      </div>
                    )}

                    {/* Images - Temporarily disabled (column doesn't exist in DB) */}
                    {/*
                    {proposalData.images && proposalData.images.length > 0 && (
                      <div className="space-y-2">
                        {proposalData.images.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`${proposalData.title} - ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    */}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>💬</span>
                        <span>{proposalData._count.comments} comentarios</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🗳️</span>
                        <span>{proposalData._count.votes} votos</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {proposalData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {proposalData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600">Estado</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {proposalData.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Escala</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {proposalData.layer}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Full View Link */}
                    <Link
                      href={`/proposals/${proposalData.id}`}
                      className="block w-full text-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      Ver Propuesta Completa →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

// ARENA - Proposal Form Modal
// Form for creating a new proposal after placement

import { useState } from 'react'

interface ProposalFormModalProps {
  isOpen: boolean
  geometryType: 'building' | 'point' | 'polygon'
  geometryData: any
  onSubmit: (data: ProposalFormData) => Promise<void>
  onCancel: () => void
}

export interface ProposalFormData {
  title: string
  description: string
  tags: string[]
  geometryType: 'building' | 'point' | 'polygon'
  geometry: any
}

const AVAILABLE_TAGS = [
  'Espacio Verde',
  'Movilidad',
  'Accesibilidad',
  'Seguridad',
  'Cultura',
  'Deporte',
  'Educación',
  'Comercio',
]

export default function ProposalFormModal({
  isOpen,
  geometryType,
  geometryData,
  onSubmit,
  onCancel,
}: ProposalFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('El título es obligatorio')
      return
    }
    if (!description.trim()) {
      setError('La descripción es obligatoria')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        tags: selectedTags,
        geometryType,
        geometry: geometryData,
      })
      // Reset form
      setTitle('')
      setDescription('')
      setSelectedTags([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la propuesta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const geometryLabel = {
    building: 'Edificio',
    point: 'Punto',
    polygon: 'Área',
  }[geometryType]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nueva Propuesta</h2>
            <p className="text-sm text-gray-600 mt-1">
              Tipo: <span className="font-medium text-indigo-600">{geometryLabel}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/50 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Plaza comunitaria con juegos inclusivos"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 caracteres</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu propuesta: qué cambios propones, por qué son necesarios, qué beneficios traerían..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={6}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 caracteres</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tags (opcional)</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} seleccionado{selectedTags.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Geometry Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa de ubicación</h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <div className="font-medium text-gray-900">Ubicación en el mapa</div>
                <div className="text-xs">
                  {geometryData?.coordinates
                    ? `Lat: ${geometryData.coordinates[1]?.toFixed(6)}, Lng: ${geometryData.coordinates[0]?.toFixed(6)}`
                    : 'Datos de geometría seleccionados'}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Propuesta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

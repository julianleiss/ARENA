'use client'

import { useState } from 'react'

export interface ProposalFormData {
  title: string
  description: string
  tags: string[]
  geometryType: 'building' | 'point' | 'polygon'
  geometry: any
}

interface ProposalFormModalProps {
  isOpen: boolean
  geometryType: 'building' | 'point' | 'polygon'
  geometryData: any
  onSubmit: (data: ProposalFormData) => Promise<void>
  onCancel: () => void
}

const AVAILABLE_TAGS = [
  'Espacio Verde',
  'Movilidad',
  'Accesibilidad',
  'Seguridad',
  'Cultura',
  'Deporte',
  'Educacion',
  'Comercio',
]

const GEOMETRY_LABELS = {
  building: 'Edificio',
  point: 'Punto',
  polygon: 'Area',
}

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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('El titulo es requerido')
      return
    }
    if (title.length > 100) {
      setError('El titulo no puede exceder 100 caracteres')
      return
    }
    if (!description.trim()) {
      setError('La descripcion es requerida')
      return
    }
    if (description.length > 500) {
      setError('La descripcion no puede exceder 500 caracteres')
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

      // Reset form on success
      setTitle('')
      setDescription('')
      setSelectedTags([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la propuesta')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Nueva Propuesta</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Geometry Type Badge */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {GEOMETRY_LABELS[geometryType]}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Titulo *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Corredor Verde Av. del Libertador"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {title.length}/100 caracteres
            </div>
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Descripcion *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu propuesta..."
              maxLength={500}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {description.length}/500 caracteres
            </div>
          </div>

          {/* Tags Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Etiquetas (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {selectedTags.length} etiqueta{selectedTags.length !== 1 ? 's' : ''} seleccionada{selectedTags.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        </form>
      </div>
    </div>
  )
}

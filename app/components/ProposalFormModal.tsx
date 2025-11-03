'use client'

import { useState } from 'react'
import { PROPOSAL_CATEGORIES, MAX_IMAGES_PER_PROPOSAL, ALLOWED_IMAGE_TYPES } from '@/app/lib/constants'

type ProposalCategory = 'urban' | 'transport' | 'green' | 'social' | 'housing' | 'infrastructure'

export interface ProposalFormData {
  title: string
  description: string
  category: ProposalCategory
  tags: string[]
  images: File[]
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
  polygon: 'Área',
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
  const [category, setCategory] = useState<ProposalCategory>('urban')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file count
    if (images.length + files.length > MAX_IMAGES_PER_PROPOSAL) {
      setError(`Máximo ${MAX_IMAGES_PER_PROPOSAL} imágenes permitidas`)
      return
    }

    // Validate each file
    for (const file of files) {
      // Check file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
        setError(`Formato no permitido: ${file.name}. Usa JPG, PNG o WebP`)
        return
      }

      // Check file size
      if (file.size > MAX_IMAGES_PER_PROPOSAL * 1024 * 1024) {
        setError(`Imagen muy grande: ${file.name}. Máximo 5MB`)
        return
      }
    }

    setImages(prev => [...prev, ...files])
    setError(null)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('El título es requerido')
      return
    }
    if (title.length > 100) {
      setError('El título no puede exceder 100 caracteres')
      return
    }
    if (!description.trim()) {
      setError('La descripción es requerida')
      return
    }
    if (description.length > 500) {
      setError('La descripción no puede exceder 500 caracteres')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        tags: selectedTags,
        images,
        geometryType,
        geometry: geometryData,
      })

      // Reset form on success
      setTitle('')
      setDescription('')
      setCategory('urban')
      setSelectedTags([])
      setImages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la propuesta')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
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
              Título <span className="text-red-500">*</span>
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
              Descripción <span className="text-red-500">*</span>
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

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Categoría <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROPOSAL_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    category === cat.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={category === cat.value}
                    onChange={(e) => setCategory(e.target.value as ProposalCategory)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Imágenes (opcional)
            </label>
            <div className="space-y-3">
              {/* Image previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isSubmitting}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              {images.length < MAX_IMAGES_PER_PROPOSAL && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Subir imágenes</span> o arrastrar aquí
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WebP - Máx. 5MB ({images.length}/{MAX_IMAGES_PER_PROPOSAL})
                    </p>
                  </div>
                  <input
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </label>
              )}
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

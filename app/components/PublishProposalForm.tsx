'use client'

// ARENA - Publish Proposal Form Overlay
// Form to publish a proposal from the sandbox

import { useState } from 'react'
import { PROPOSAL_CATEGORIES, MAX_IMAGE_SIZE, MAX_IMAGES_PER_PROPOSAL, ALLOWED_IMAGE_TYPES } from '@/app/lib/constants'
import type { ProposalCategory } from '@/app/lib/constants'

interface PublishProposalFormProps {
  isOpen: boolean
  onPublish: (data: {
    title: string
    description: string
    category: ProposalCategory
    visibility: 'public' | 'private'
    tags: string[]
    images: File[]
  }) => Promise<void>
  onCancel: () => void
}

export default function PublishProposalForm({
  isOpen,
  onPublish,
  onCancel,
}: PublishProposalFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ProposalCategory>('urban')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate file types
    const validFiles = files.filter(file => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
        alert(`${file.name}: Tipo de archivo no permitido. Solo JPG, PNG y WebP.`)
        return false
      }
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`${file.name}: Archivo muy grande. Máximo 5MB.`)
        return false
      }
      return true
    })

    // Check total count
    if (images.length + validFiles.length > MAX_IMAGES_PER_PROPOSAL) {
      alert(`Máximo ${MAX_IMAGES_PER_PROPOSAL} imágenes por propuesta`)
      return
    }

    setImages(prev => [...prev, ...validFiles])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setIsSubmitting(true)
    try {
      await onPublish({
        title: title.trim(),
        description: description.trim(),
        category,
        visibility,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        images,
      })
    } catch (error) {
      console.error('Error publishing proposal:', error)
      alert('Error al publicar la propuesta')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[10001] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Publicar Propuesta</h2>
          <p className="text-sm text-gray-600 mt-1">
            Completa la información para compartir tu diseño con la comunidad
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              maxLength={100}
              placeholder="Ej: Parque Comunitario en Av. Libertador"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
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
              maxLength={500}
              rows={5}
              placeholder="Describe tu propuesta: objetivos, beneficios, características principales..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 caracteres</p>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Categoría <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROPOSAL_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    category === cat.value
                      ? `border-${cat.color}-500 bg-${cat.color}-50`
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
                  />
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  />
                </label>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visibilidad
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={(e) => setVisibility(e.target.value as 'public')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Pública</p>
                  <p className="text-sm text-gray-600">Todos pueden ver y votar tu propuesta</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={(e) => setVisibility(e.target.value as 'private')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Privada</p>
                  <p className="text-sm text-gray-600">Solo tú puedes ver esta propuesta</p>
                </div>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Etiquetas (opcional)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="parque, verde, comunidad, accesibilidad (separadas por comas)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Separa las etiquetas con comas</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publicando...
                </span>
              ) : (
                '🚀 Publicar Propuesta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

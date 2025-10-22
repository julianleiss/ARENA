'use client'

// ARENA V1.0 - New Proposal Form

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProposalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    body: '',
    layer: 'micro',
    tags: '',
    status: 'draft',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use the expert user from seed data
      const authorId = '550e8400-e29b-41d4-a716-446655440002'

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          authorId,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/proposals/${data.id}`)
      } else {
        alert('Error al crear la propuesta')
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert('Error al crear la propuesta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/proposals" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Propuesta</h1>
              <p className="text-sm text-gray-500">Crea una intervención urbana para tu ciudad</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Corredor Verde Av. del Libertador"
            />
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
              Resumen
            </label>
            <input
              type="text"
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Resumen corto de la propuesta"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción completa
            </label>
            <textarea
              id="body"
              rows={8}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe tu propuesta en detalle..."
            />
          </div>

          <div>
            <label htmlFor="layer" className="block text-sm font-medium text-gray-700 mb-2">
              Escala
            </label>
            <select
              id="layer"
              value={formData.layer}
              onChange={(e) => setFormData({ ...formData, layer: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="micro">🏘️ Micro (Calle, manzana)</option>
              <option value="meso">🏙️ Meso (Barrio, distrito)</option>
              <option value="macro">🌆 Macro (Ciudad, región)</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Etiquetas
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="movilidad, espacio-publico, verde (separadas por comas)"
            />
            <p className="text-xs text-gray-500 mt-1">Separa las etiquetas con comas</p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Estado inicial
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="draft">Borrador (solo tú lo ves)</option>
              <option value="public">Público (visible para todos)</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Creando...' : 'Crear Propuesta'}
            </button>
            <Link
              href="/proposals"
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </Link>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Consejos</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Usa un título claro y descriptivo</li>
            <li>• Explica el problema que resuelves y tu solución</li>
            <li>• Agrega etiquetas para facilitar la búsqueda</li>
            <li>• Guarda como borrador si aún no está completa</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
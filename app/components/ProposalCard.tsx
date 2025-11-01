'use client'

// ARENA V1.0 - Proposal Card Component
// Display proposal preview in list

import Link from 'next/link'
import { useState } from 'react'

interface Proposal {
  id: string
  title: string
  summary: string | null
  status: string
  layer: string
  tags: string[]
  createdAt: string
  author: {
    name: string | null
  }
  _count: {
    votes: number
    comments: number
  }
  versions?: { id: string }[]
}

export default function ProposalCard({ proposal }: { proposal: Proposal }) {
  const [isHovered, setIsHovered] = useState(false)
  const hasSandbox = proposal.versions && proposal.versions.length > 0

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    review: 'bg-yellow-100 text-yellow-800',
    public: 'bg-green-100 text-green-800',
    published: 'bg-green-100 text-green-800',
    voting: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-600',
    archived: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    review: 'En Revisión',
    public: 'Pública',
    published: 'Publicada',
    voting: 'En Votación',
    closed: 'Cerrada',
    archived: 'Archivada',
  }

  const layerIcons = {
    micro: '🏘️',
    meso: '🏙️',
    macro: '🌆',
  }

  return (
    <div
      className="relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Badge (Top Left) */}
      <div className="absolute top-4 left-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[proposal.status as keyof typeof statusColors]}`}>
          {statusLabels[proposal.status] || proposal.status}
        </span>
      </div>

      {/* 3D Design Badge (Top Right) - Only show if sandbox exists */}
      {hasSandbox && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg animate-pulse">
            🎨 Diseño 3D
          </span>
        </div>
      )}

      {/* Main Content */}
      <Link href={`/proposals/${proposal.id}`}>
        <div className="pt-8">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{layerIcons[proposal.layer as keyof typeof layerIcons]}</span>
              <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
            </div>
          </div>

        {proposal.summary && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {proposal.summary}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>👤 {proposal.author.name || 'Anónimo'}</span>
            <span>💬 {proposal._count.comments}</span>
            <span>🗳️ {proposal._count.votes}</span>
          </div>
          <span>{new Date(proposal.createdAt).toLocaleDateString('es-AR')}</span>
        </div>

        {proposal.tags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {proposal.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        </div>
      </Link>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-xl">
          <div className="flex gap-3">
            <Link
              href={`/sandbox/${proposal.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:scale-105"
              onClick={(e) => e.stopPropagation()}
            >
              <span>🎨</span>
              <span>Editar 3D</span>
            </Link>
            <Link
              href={`/proposals/${proposal.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg border-2 border-white hover:bg-gray-100 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <span>👁️</span>
              <span>Ver Detalles</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
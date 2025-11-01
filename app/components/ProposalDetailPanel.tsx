'use client'

import { useState, useEffect } from 'react'
import { ReadOnlySandbox } from './ReadOnlySandbox'
import { CommentsList } from './CommentsList'
import { VoteButton } from './VoteButton'
import { timeAgo } from '@/app/lib/utils/timeAgo'

interface ProposalDetailPanelProps {
  proposalId: string
  onBack: () => void
  onClose: () => void
}

interface ProposalDetail {
  id: string
  title: string
  summary: string | null
  body: string | null
  status: string
  layer: string
  tags: string[]
  createdAt: string
  author: {
    name: string | null
  } | null
  _count: {
    votes: number
    comments: number
  }
  versions?: { id: string }[]
}

export function ProposalDetailPanel({
  proposalId,
  onBack,
  onClose
}: ProposalDetailPanelProps) {
  const [proposal, setProposal] = useState<ProposalDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProposal()
  }, [proposalId])

  const fetchProposal = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}`)
      if (res.ok) {
        const data = await res.json()
        setProposal(data)
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed left-0 top-16 bottom-0 w-[600px] bg-white shadow-2xl z-40 flex items-center justify-center animate-slide-in-left">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="fixed left-0 top-16 bottom-0 w-[600px] bg-white shadow-2xl z-40 flex items-center justify-center animate-slide-in-left">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Propuesta no encontrada</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const hasSandbox = proposal.versions && proposal.versions.length > 0

  return (
    <div className="fixed left-0 top-16 bottom-0 w-[600px] bg-white shadow-2xl z-40 flex flex-col overflow-hidden animate-slide-in-left">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </button>
        <div className="flex items-center gap-3">
          <VoteButton proposalId={proposalId} initialCount={proposal._count?.votes || 0} />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* 3D View */}
        {hasSandbox && (
          <div className="h-64 bg-gray-100 border-b border-gray-200">
            <ReadOnlySandbox proposalId={proposalId} />
          </div>
        )}

        {/* Details */}
        <div className="p-6 space-y-6">
          {/* Title and metadata */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                {proposal.status}
              </span>
              {hasSandbox && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                  🎨 Diseño 3D
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {proposal.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Por {proposal.author?.name || 'Usuario'}</span>
              <span>•</span>
              <span>{timeAgo(new Date(proposal.createdAt))}</span>
            </div>
          </div>

          {/* Description */}
          {(proposal.body || proposal.summary) && (
            <div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {proposal.body || proposal.summary}
              </p>
            </div>
          )}

          {/* Tags */}
          {proposal.tags && proposal.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {proposal.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span>❤️</span>
              <span>{proposal._count?.votes || 0} votos</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💬</span>
              <span>{proposal._count?.comments || 0} comentarios</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span className="capitalize">{proposal.layer}</span>
            </div>
          </div>

          {/* Comments */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>💬</span>
              <span>Comentarios ({proposal._count?.comments || 0})</span>
            </h3>
            <CommentsList proposalId={proposalId} />
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

// ARENA V1.0 - Proposal Detail Page

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Proposal {
  id: string
  title: string
  summary: string | null
  body: string | null
  status: string
  layer: string
  tags: string[]
  geom: any
  osmType: string | null
  osmId: string | null
  featureName: string | null
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
    role: string
  }
  _count: {
    votes: number
    comments: number
  }
}

interface Comment {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteCount, setVoteCount] = useState(0)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Use expert user from seed data
  const currentUserId = '550e8400-e29b-41d4-a716-446655440002'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchProposal()
      fetchComments()
    }
  }, [params.id])

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/proposals/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProposal(data)
        setVoteCount(data._count.votes)
      } else {
        console.error('Failed to fetch proposal')
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/proposals/${params.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleVote = async () => {
    try {
      if (hasVoted) {
        // Remove vote
        const response = await fetch(`/api/proposals/${params.id}/votes?userId=${currentUserId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          const data = await response.json()
          setHasVoted(false)
          setVoteCount(data.voteCount)
        }
      } else {
        // Add vote
        const response = await fetch(`/api/proposals/${params.id}/votes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, origin: 'web' }),
        })
        if (response.ok) {
          const data = await response.json()
          setHasVoted(true)
          setVoteCount(data.voteCount)
        }
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('Error al registrar el voto')
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`/api/proposals/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          content: commentText,
        }),
      })

      if (response.ok) {
        setCommentText('')
        fetchComments()
      } else {
        alert('Error al publicar el comentario')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Error al publicar el comentario')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta propuesta?')) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/proposals/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/proposals')
      } else {
        alert('Error al eliminar la propuesta')
      }
    } catch (error) {
      console.error('Error deleting proposal:', error)
      alert('Error al eliminar la propuesta')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Propuesta no encontrada</h2>
          <Link href="/proposals" className="text-indigo-600 hover:text-indigo-700">
            ← Volver a propuestas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/proposals" className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={`/map?proposal=${proposal.id}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
              >
                Ver en Mapa
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.title}</h1>
                {proposal.summary && (
                  <p className="text-lg text-gray-600">{proposal.summary}</p>
                )}
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  proposal.status === 'public'
                    ? 'bg-green-100 text-green-800'
                    : proposal.status === 'draft'
                    ? 'bg-gray-100 text-gray-800'
                    : proposal.status === 'voting'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {proposal.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {proposal.author.name || proposal.author.email}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {mounted ? new Date(proposal.createdAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : '...'}
              </span>
            </div>
          </div>

          {/* Body */}
          {proposal.body && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.body}</p>
            </div>
          )}

          {/* Tags */}
          {proposal.tags.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Etiquetas</h2>
              <div className="flex flex-wrap gap-2">
                {proposal.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="p-6 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Información adicional</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Escala</dt>
                <dd className="mt-1 text-gray-900 capitalize">{proposal.layer}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Tipo de geometría</dt>
                <dd className="mt-1 text-gray-900">{proposal.geom?.type || 'No definido'}</dd>
              </div>
              {proposal.featureName && (
                <div>
                  <dt className="font-medium text-gray-500">Característica OSM</dt>
                  <dd className="mt-1 text-gray-900">{proposal.featureName}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-gray-500">Votos</dt>
                <dd className="mt-1 text-gray-900">{proposal._count.votes}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Comentarios</dt>
                <dd className="mt-1 text-gray-900">{proposal._count.comments}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Voting Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">¿Apoyás esta propuesta?</h2>
              <p className="text-sm text-gray-500 mt-1">
                {voteCount} persona{voteCount !== 1 ? 's' : ''} ya votó
                {voteCount !== 1 ? 'n' : ''}
              </p>
            </div>
            <button
              onClick={handleVote}
              className={`px-6 py-3 font-medium rounded-lg transition shadow-md ${
                hasVoted
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }`}
            >
              {hasVoted ? '✓ Votado' : '👍 Votar'}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Comentarios ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe tu comentario..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? 'Publicando...' : 'Publicar comentario'}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-sm">
                        {comment.author.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {comment.author.name || comment.author.email}
                        </span>
                        <span className="text-xs text-gray-500">
                          {mounted ? new Date(comment.createdAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : '...'}
                        </span>
                        {comment.author.role === 'expert' && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            Experto
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No hay comentarios todavía. ¡Sé el primero en comentar!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

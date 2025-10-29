'use client'

// ARENA V1.0 - Comments Component
// Display comment list and submission form for proposals

import { useState, useEffect } from 'react'

interface Author {
  id: string
  name: string | null
  email: string
  role: string
}

interface Comment {
  id: string
  proposalId: string
  authorId: string
  body: string
  createdAt: string
  author: Author
}

interface CommentsProps {
  proposalId: string
  currentUserId?: string
}

function sanitizeText(text: string): string {
  // Basic XSS sanitation: escape HTML entities
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function Comments({ proposalId, currentUserId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true)
        const response = await fetch(`/api/proposals/${proposalId}/comments`)

        if (!response.ok) {
          throw new Error('Failed to fetch comments')
        }

        const data = await response.json()
        setComments(data.comments || [])
      } catch (err) {
        console.error('Error fetching comments:', err)
        setError('No se pudieron cargar los comentarios')
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [proposalId])

  // Handle comment submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!currentUserId) {
      setError('Debes iniciar sesión para comentar')
      return
    }

    if (!newComment.trim() || newComment.length > 2000) {
      setError('El comentario debe tener entre 1 y 2000 caracteres')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorId: currentUserId,
          body: newComment.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to post comment')
      }

      const newCommentData = await response.json()

      // Add new comment to the top of the list
      setComments([newCommentData, ...comments])
      setNewComment('')
    } catch (err) {
      console.error('Error posting comment:', err)
      setError('No se pudo enviar el comentario')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Discusión</h3>
        <p className="text-gray-500">Cargando comentarios...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Discusión ({comments.length})
      </h3>

      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe tu comentario..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            maxLength={2000}
            disabled={submitting}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {newComment.length}/2000 caracteres
            </span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </form>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Debes iniciar sesión para participar en la discusión
          </p>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No hay comentarios aún. ¡Sé el primero en comentar!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {comment.author.name || 'Anónimo'}
                  </span>
                  {comment.author.role === 'expert' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                      Experto
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p
                className="text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: sanitizeText(comment.body)
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { timeAgo } from '@/app/lib/utils/timeAgo'

interface Comment {
  id: string
  body: string
  createdAt: string
  author: {
    name: string | null
  } | null
}

interface CommentsListProps {
  proposalId: string
}

export function CommentsList({ proposalId }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingComments, setFetchingComments] = useState(true)

  useEffect(() => {
    fetchComments()
  }, [proposalId])

  // Load author name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('userName') || ''
    setAuthorName(savedName)
  }, [])

  const fetchComments = async () => {
    setFetchingComments(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setFetchingComments(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !authorName.trim()) return

    setLoading(true)
    try {
      // Save name to localStorage
      localStorage.setItem('userName', authorName)

      const res = await fetch(`/api/proposals/${proposalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newComment.trim(),
          authorName: authorName.trim()
        })
      })

      if (res.ok) {
        const comment = await res.json()
        setComments([comment, ...comments])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          placeholder="Tu nombre"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <textarea
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim() || !authorName.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium
                   hover:bg-indigo-700 transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Comentar'}
        </button>
      </form>

      {/* Comments list */}
      <div className="space-y-3">
        {fetchingComments ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">
            Aún no hay comentarios. ¡Sé el primero!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {comment.author?.name || 'Usuario Anónimo'}
                </span>
                <span className="text-xs text-gray-500">
                  • {timeAgo(new Date(comment.createdAt))}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{comment.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ARENA - Comments Component (Iteration 6)
'use client'

import { useState } from 'react'
import { createComment, type Comment } from '../_actions/comments'

type CommentsProps = {
  proposalId: string
  initialComments: Comment[]
}

// Basic XSS sanitation - escape HTML characters
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Format date to relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default function Comments({ proposalId, initialComments }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!body.trim()) {
      setError('Comment cannot be empty')
      return
    }

    setLoading(true)
    setError(null)

    // Use default author for now (in real app, get from session)
    const authorId = 'default-author-id'

    const result = await createComment({
      proposalId,
      authorId,
      body: body.trim(),
    })

    if (result.success) {
      setBody('')
      // Optimistically add comment to list
      // In production, we'd refetch from server or use the returned data
      window.location.reload() // Simple refresh for now
    } else {
      setError(result.error || 'Failed to post comment')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add a comment
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts on this proposal..."
            rows={4}
            maxLength={2000}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {body.length}/2000 characters
            </p>
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 text-sm font-medium">
                        {comment.author?.name?.charAt(0).toUpperCase() ||
                         comment.author?.email?.charAt(0).toUpperCase() ||
                         '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {comment.author?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(comment.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <p
                  className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: escapeHtml(comment.body)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ARENA - Publish Bar Component with Modal
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { publishSandbox } from '../[id]/_actions/publish'

type PublishBarProps = {
  sandboxId: string
  sandboxStatus: string
  instanceCount: number
}

export default function PublishBar({
  sandboxId,
  sandboxStatus,
  instanceCount,
}: PublishBarProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in both title and description')
      return
    }

    if (title.length < 3 || title.length > 200) {
      alert('Title must be between 3 and 200 characters')
      return
    }

    if (description.length < 10 || description.length > 2000) {
      alert('Description must be between 10 and 2000 characters')
      return
    }

    setLoading(true)

    // Use a default author ID for now (in real app, get from session)
    const authorId = 'default-author-id'

    const result = await publishSandbox({
      sandboxId,
      title,
      description,
      authorId,
    })

    setLoading(false)

    if (result.ok) {
      alert(
        `Proposal published successfully!\n${result.data.featureCount} instances exported.`
      )
      setShowModal(false)
      router.push(`/proposals/${result.data.proposalId}`)
    } else {
      alert(result.error || 'Failed to publish proposal')
    }
  }

  const isPublished = sandboxStatus === 'published'

  return (
    <>
      {/* Publish Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Ready to publish?
              </h3>
              <p className="text-xs text-gray-600">
                {instanceCount} instance{instanceCount !== 1 ? 's' : ''} in
                sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPublished && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Already Published
              </span>
            )}
            <button
              onClick={() => setShowModal(true)}
              disabled={isPublished || instanceCount === 0}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                isPublished || instanceCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              Publish as Proposal
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Publish Proposal
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., New Green Corridor on Av. Libertador"
                  maxLength={200}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your proposal: what changes are you proposing and why?"
                  rows={6}
                  maxLength={2000}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/2000 characters
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Publishing will export {instanceCount}{' '}
                  instance{instanceCount !== 1 ? 's' : ''} and create a new
                  proposal visible to all users.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={loading || !title.trim() || !description.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : 'Publish Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ARENA - Publish Bar Component with Modal
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { publishSandbox } from '../[id]/_actions/publish'
import { uploadProposalImages } from '@/app/lib/upload-images'
import PublishProposalForm from '@/app/components/PublishProposalForm'
import type { ProposalCategory } from '@/app/lib/constants'

type PublishBarProps = {
  sandboxId: string
  sandboxStatus: string
  instanceCount: number
  disabled?: boolean
}

export default function PublishBar({
  sandboxId,
  sandboxStatus,
  instanceCount,
  disabled = false,
}: PublishBarProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const handlePublish = async (data: {
    title: string
    description: string
    category: ProposalCategory
    visibility: 'public' | 'private'
    tags: string[]
    images: File[]
  }) => {
    try {
      // Use a default author ID for now (in real app, get from session)
      const authorId = 'default-author-id'

      // Upload images first (if any)
      let imageUrls: string[] = []
      if (data.images.length > 0) {
        console.log('Uploading images...')
        imageUrls = await uploadProposalImages(data.images, sandboxId)
        console.log('Images uploaded:', imageUrls)
      }

      // Publish sandbox with all data
      const result = await publishSandbox({
        sandboxId,
        title: data.title,
        body: data.description,
        category: data.category,
        tags: data.tags,
        imageUrls,
        authorId,
      })

      if (result.success && result.data) {
        alert(
          `¡Propuesta publicada con éxito!\n${result.data.featureCount} elementos exportados.`
        )
        setShowModal(false)
        router.push(`/proposals/${result.data.proposalId}`)
      } else {
        throw new Error(result.error || 'Failed to publish proposal')
      }
    } catch (error) {
      console.error('Error publishing:', error)
      throw error
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
                {disabled ? 'Sign in to publish' : 'Ready to publish?'}
              </h3>
              <p className="text-xs text-gray-600">
                {instanceCount} instance{instanceCount !== 1 ? 's' : ''} in
                sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {disabled && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                🔒 Auth required
              </span>
            )}
            {isPublished && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                Already Published
              </span>
            )}
            <button
              onClick={() => !disabled && setShowModal(true)}
              disabled={disabled || isPublished || instanceCount === 0}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                disabled || isPublished || instanceCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              Publish as Proposal
            </button>
          </div>
        </div>
      </div>

      {/* Publish Form Modal */}
      <PublishProposalForm
        isOpen={showModal}
        onPublish={handlePublish}
        onCancel={() => setShowModal(false)}
      />
    </>
  )
}

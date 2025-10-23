// ARENA - Proposal Detail Page (Server Component)
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/app/lib/supabase-client'

export const dynamic = 'force-dynamic'

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch proposal by ID via Supabase REST API
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('id, title, description, status, author_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !proposal) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link
          href="/proposals"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Proposals
        </Link>

        {/* Proposal Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {proposal.title}
              </h1>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  proposal.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {proposal.status}
              </span>
            </div>
            <p className="text-gray-600">
              By <span className="font-medium">{proposal.author_id}</span>
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {proposal.description}
            </p>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Created</p>
              <p className="text-gray-900">
                {new Date(proposal.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="text-gray-900">
                {new Date(proposal.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

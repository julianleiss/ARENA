// ARENA - Proposal Detail Page (Iteration 6)
import { notFound } from 'next/navigation'
import { getProposalById } from './_actions/getProposal'
import { getCommentsByProposal } from './_actions/comments'
import ProposalMap from './_components/ProposalMap'
import Comments from './_components/Comments'

export const dynamic = 'force-dynamic'

type ProposalPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params

  // Fetch proposal and comments
  const [proposal, comments] = await Promise.all([
    getProposalById(id),
    getCommentsByProposal(id),
  ])

  if (!proposal) {
    notFound()
  }

  const hasPreview = proposal.preview && proposal.preview.geom && proposal.preview.mask

  return (
    <div className="relative w-full h-screen flex">
      {/* Map - Left Side */}
      <div className="flex-1 relative">
        {hasPreview ? (
          <ProposalMap
            geom={proposal.preview.geom}
            mask={proposal.preview.mask}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No preview available</p>
            </div>
          </div>
        )}

        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3.5 shadow-sm">
          <div className="flex items-center gap-4">
            <a
              href="/map"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
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
            </a>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                ARENA
              </h1>
              <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                i6-proposal-detail
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel - Right Side */}
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Proposal Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                proposal.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {proposal.status}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {proposal.title}
            </h2>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-xs font-medium">
                  {proposal.author.name?.charAt(0).toUpperCase() ||
                   proposal.author.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <span>
                {proposal.author.name || 'Anonymous'}
              </span>
              <span className="text-gray-400">•</span>
              <span>
                {new Date(proposal.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {proposal.description}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Discussion
            </h3>
            <Comments
              proposalId={proposal.id}
              initialComments={comments}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

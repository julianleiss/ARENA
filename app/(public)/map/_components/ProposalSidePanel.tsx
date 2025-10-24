// ARENA - Proposal Side Panel (Iteration 5)
'use client'

type ProposalSidePanelProps = {
  proposalId: string | null
  proposalTitle: string | null
  onClose: () => void
}

export default function ProposalSidePanel({
  proposalId,
  proposalTitle,
  onClose,
}: ProposalSidePanelProps) {
  if (!proposalId) return null

  return (
    <div className="absolute top-20 right-6 z-30 w-80 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Proposal</h3>
        <button
          onClick={onClose}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-2">
            {proposalTitle || 'Untitled Proposal'}
          </h4>
          <p className="text-xs text-gray-600">
            Click below to view full proposal details
          </p>
        </div>

        <a
          href={`/proposals/${proposalId}`}
          className="block w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
        >
          View Proposal
        </a>
      </div>
    </div>
  )
}

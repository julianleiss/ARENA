// ARENA V1.0 - Proposal Card Component
// Display proposal preview in list

import Link from 'next/link'

interface Proposal {
  id: string
  title: string
  summary: string | null
  status: string
  layer: string
  tags: string[]
  createdAt: string
  author: {
    name: string | null
  }
  _count: {
    votes: number
    comments: number
  }
}

export default function ProposalCard({ proposal }: { proposal: Proposal }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    review: 'bg-yellow-100 text-yellow-800',
    public: 'bg-green-100 text-green-800',
    voting: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-600',
    archived: 'bg-red-100 text-red-800',
  }

  const layerIcons = {
    micro: '🏘️',
    meso: '🏙️',
    macro: '🌆',
  }

  return (
    <Link href={`/proposals/${proposal.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{layerIcons[proposal.layer as keyof typeof layerIcons]}</span>
            <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[proposal.status as keyof typeof statusColors]}`}>
            {proposal.status}
          </span>
        </div>

        {proposal.summary && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {proposal.summary}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>👤 {proposal.author.name || 'Anónimo'}</span>
            <span>💬 {proposal._count.comments}</span>
            <span>🗳️ {proposal._count.votes}</span>
          </div>
          <span>{new Date(proposal.createdAt).toLocaleDateString('es-AR')}</span>
        </div>

        {proposal.tags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {proposal.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
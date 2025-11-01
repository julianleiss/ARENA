'use client'

import { useState, useEffect } from 'react'
import ProposalCard from './ProposalCard'
import { ProposalDetailPanel } from './ProposalDetailPanel'

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
  versions?: { id: string }[]
}

interface ProposalsPanelProps {
  isOpen: boolean
  onClose: () => void
  onProposalClick?: (proposalId: string) => void
  onProposalHover?: (proposalId: string | null) => void
}

export function ProposalsPanel({
  isOpen,
  onClose,
  onProposalClick,
  onProposalHover
}: ProposalsPanelProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchProposals()
    }
  }, [isOpen])

  const fetchProposals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/proposals?status=public')
      const data = await res.json()
      // API returns { proposals: [], count: 0 } format
      setProposals(data.proposals || [])
    } catch (error) {
      console.error('Error fetching proposals:', error)
      setProposals([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProposals = proposals.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  if (selectedProposal) {
    return (
      <ProposalDetailPanel
        proposalId={selectedProposal}
        onBack={() => setSelectedProposal(null)}
        onClose={onClose}
      />
    )
  }

  return (
    <div
      className="fixed left-0 top-20 bottom-0 w-[400px] bg-white shadow-2xl z-40
                 flex flex-col animate-slide-in-left overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Propuestas</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar propuestas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100 bg-gray-50">
        {filteredProposals.length} propuesta{filteredProposals.length !== 1 ? 's' : ''} en esta área
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 mb-2">No se encontraron propuestas</p>
            <p className="text-sm text-gray-400">Intenta con otra búsqueda</p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                onClick={() => {
                  setSelectedProposal(proposal.id)
                  onProposalClick?.(proposal.id)
                }}
                onMouseEnter={() => onProposalHover?.(proposal.id)}
                onMouseLeave={() => onProposalHover?.(null)}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <ProposalCard proposal={proposal} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

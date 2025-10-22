'use client'

// ARENA V1.0 - Proposals List Page

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProposalCard from '@/app/components/ProposalCard'

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

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchProposals() {
      try {
        const url = filter === 'all' 
          ? '/api/proposals'
          : `/api/proposals?status=${filter}`
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setProposals(data.proposals || [])
        }
      } catch (error) {
        console.error('Error fetching proposals:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProposals()
  }, [filter])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Propuestas Urbanas</h1>
                <p className="text-sm text-gray-500">Explora y crea intervenciones para tu ciudad</p>
              </div>
            </div>
            <Link href="/proposals/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              + Nueva Propuesta
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6">
          {['all', 'public', 'draft', 'voting', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando propuestas...</p>
          </div>
        )}

        {!loading && proposals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}

        {!loading && proposals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No hay propuestas disponibles</p>
            <Link href="/proposals/new" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Crea la primera propuesta →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
// ARENA - Proposals List Page (Server Component)
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import CreateProposalForm from './_components/CreateProposalForm'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export default async function ProposalsPage() {
  // Fetch last 20 proposals
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposals</h1>
          <p className="text-gray-600">
            Browse and create community proposals
          </p>
        </div>

        {/* Create Form (only in development) */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-8">
            <CreateProposalForm />
          </div>
        )}

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No proposals yet. Create one to get started!</p>
            </div>
          ) : (
            proposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-indigo-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {proposal.title}
                  </h2>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      proposal.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-3 line-clamp-2">
                  {proposal.description.length > 200
                    ? `${proposal.description.substring(0, 200)}...`
                    : proposal.description}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(proposal.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

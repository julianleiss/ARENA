// ARENA - Proposal Detail Page (Server Component)
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/app/lib/db'

export const dynamic = 'force-dynamic'

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch proposal by ID via Prisma
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
      versions: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!proposal) {
    notFound()
  }

  const hasSandbox = proposal.versions && proposal.versions.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
              Home
            </Link>
            <span className="text-gray-400">›</span>
            <Link href="/proposals" className="text-gray-500 hover:text-gray-700 transition-colors">
              Proposals
            </Link>
            <span className="text-gray-400">›</span>
            <span className="text-gray-900 font-medium truncate max-w-md">{proposal.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Title & Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
            <span
              className={`px-4 py-1.5 text-sm font-medium rounded-full ${
                proposal.status === 'published' || proposal.status === 'public'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}
            >
              {proposal.status}
            </span>
          </div>

          {/* Author & Date */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{proposal.author.name || 'Anonymous'}</span>
            </div>
            <span>•</span>
            <span>{new Date(proposal.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Primary CTA: Design in 3D Sandbox */}
            <Link
              href={`/sandbox/${proposal.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span>🎨</span>
              <span>Design in 3D Sandbox</span>
            </Link>

            {/* View on Map */}
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-indigo-600 hover:text-indigo-600 transition-all"
            >
              <span>🗺️</span>
              <span>View on Map</span>
            </Link>

            {/* Vote Button */}
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-green-600 hover:text-green-600 transition-all"
            >
              <span>👍</span>
              <span>Vote ({proposal._count.votes})</span>
            </button>
          </div>
        </div>

        {/* Description */}
        {(proposal.body || proposal.summary) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {proposal.body || proposal.summary}
            </p>
          </div>
        )}

        {/* Stats & Engagement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                💬
              </div>
              <div>
                <p className="text-sm text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-gray-900">{proposal._count.comments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                🗳️
              </div>
              <div>
                <p className="text-sm text-gray-600">Votes</p>
                <p className="text-2xl font-bold text-gray-900">{proposal._count.votes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                {hasSandbox ? '✓' : '○'}
              </div>
              <div>
                <p className="text-sm text-gray-600">3D Design</p>
                <p className="text-lg font-bold text-gray-900">
                  {hasSandbox ? 'Available' : 'Not Started'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

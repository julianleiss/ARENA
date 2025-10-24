// ARENA - Map Page (Iteration 5 - Proposal Pins + Hover Preview)
import { getPublishedProposals } from './_actions/getPublishedProposals'
import MapClient from './_components/MapClient'
import SandboxTest from './_components/SandboxTest'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  // Fetch published proposals (no bbox filter for now - show all)
  const proposals = await getPublishedProposals()

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <a
            href="/"
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
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
              i5-map-pins-hover
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 mr-2">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
          </div>
          <a
            href="/proposals"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
          >
            Proposals
          </a>
        </div>
      </div>

      {/* Map with Proposal Pins */}
      <MapClient proposals={proposals} />

      {/* Sandbox Test Component */}
      <SandboxTest />
    </div>
  )
}

// ARENA - 3D Sandbox Editor (Proposal Viewer/Editor)
import { notFound } from 'next/navigation'
import SandboxClient from './_components/SandboxClient'

export const dynamic = 'force-dynamic'

async function getProposal(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/proposals/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch proposal ${id}:`, response.status)
      return null
    }

    const proposal = await response.json()
    console.log('📋 Fetched proposal:', { id: proposal.id, title: proposal.title, hasGeom: !!proposal.geom })
    return proposal
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return null
  }
}

export default async function SandboxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  console.log('🎨 Sandbox Page - Loading proposal:', id)

  const proposal = await getProposal(id)

  if (!proposal) {
    console.error('❌ Proposal not found:', id)
    notFound()
  }

  // Extract coordinates from geom
  let centerLng = -58.46 // Default: Buenos Aires Núñez
  let centerLat = -34.545

  if (proposal.geom) {
    if (proposal.geom.type === 'Point') {
      [centerLng, centerLat] = proposal.geom.coordinates
    } else if (proposal.geom.type === 'Polygon') {
      // Calculate centroid
      const coords = proposal.geom.coordinates[0]
      centerLng = coords.reduce((sum: number, p: number[]) => sum + p[0], 0) / coords.length
      centerLat = coords.reduce((sum: number, p: number[]) => sum + p[1], 0) / coords.length
    }
  }

  console.log('📍 Sandbox center:', { lng: centerLng, lat: centerLat })

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 z-50">
        <div className="flex items-center gap-4 flex-1">
          <a
            href="/map"
            className="text-gray-400 hover:text-gray-200 transition-colors"
            title="Back to Map"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">3D Sandbox</h1>
            <span className="text-sm text-gray-400">•</span>
            <h2 className="text-sm text-gray-300">{proposal.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            proposal.status === 'public' || proposal.status === 'published'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {proposal.status}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Prefab Palette */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Prefab Library</h3>
            <p className="text-xs text-gray-500">Coming soon...</p>
          </div>
        </aside>

        {/* Center - 3D Canvas */}
        <main className="flex-1 relative">
          <SandboxClient
            proposalId={proposal.id}
            proposalTitle={proposal.title}
            proposalGeom={proposal.geom}
            centerLng={centerLng}
            centerLat={centerLat}
          />
        </main>

        {/* Right Sidebar - Inspector */}
        <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Inspector</h3>
            <div className="space-y-3 text-xs text-gray-400">
              <div>
                <span className="text-gray-500">Proposal ID:</span>
                <div className="mt-1 text-gray-300 font-mono text-xs break-all">{proposal.id}</div>
              </div>
              <div>
                <span className="text-gray-500">Center:</span>
                <div className="mt-1 text-gray-300 font-mono">
                  {centerLng.toFixed(6)}, {centerLat.toFixed(6)}
                </div>
              </div>
              {proposal.geom && (
                <div>
                  <span className="text-gray-500">Geometry Type:</span>
                  <div className="mt-1 text-gray-300">{proposal.geom.type}</div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ARENA - 3D Sandbox Editor (Proposal Viewer/Editor)
import { notFound } from 'next/navigation'
import SandboxClient from './_components/SandboxClient'
import SandboxWrapper from './_components/SandboxWrapper'

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

  // Use mock data if proposal not found (for testing)
  const mockProposal = {
    id: id,
    title: 'Mock Proposal - 3D Sandbox Test',
    status: 'draft',
    geom: {
      type: 'Point',
      coordinates: [-58.46, -34.545], // Buenos Aires Núñez
    },
  }

  const displayProposal = proposal || mockProposal
  const isMock = !proposal

  if (isMock) {
    console.warn('⚠️ Using mock proposal data for testing - database not connected')
  }

  // Extract coordinates from geom
  let centerLng = -58.46 // Default: Buenos Aires Núñez
  let centerLat = -34.545

  if (displayProposal.geom) {
    if (displayProposal.geom.type === 'Point') {
      [centerLng, centerLat] = displayProposal.geom.coordinates
    } else if (displayProposal.geom.type === 'Polygon') {
      // Calculate centroid
      const coords = displayProposal.geom.coordinates[0]
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
            <h2 className="text-sm text-gray-300">{displayProposal.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isMock && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              MOCK DATA
            </span>
          )}
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            displayProposal.status === 'public' || displayProposal.status === 'published'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {displayProposal.status}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <SandboxWrapper
        proposalId={displayProposal.id}
        proposalTitle={displayProposal.title}
        proposalGeom={displayProposal.geom}
        centerLng={centerLng}
        centerLat={centerLat}
        isMock={isMock}
        displayProposal={displayProposal}
      />
    </div>
  )
}

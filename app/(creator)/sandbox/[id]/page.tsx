// ARENA - Sandbox Detail Page (Creator View with 2.5D Prefabs)
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/app/lib/supabase-client'
import SandboxClient from './_components/SandboxClient'

export const dynamic = 'force-dynamic'

export default async function SandboxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch sandbox by ID
  const { data: sandbox, error } = await supabase
    .from('sandboxes')
    .select('id, geometry, status, created_at')
    .eq('id', id)
    .single()

  if (error || !sandbox) {
    notFound()
  }

  // Fetch instances for this sandbox
  const { data: instances } = await supabase
    .from('instances')
    .select('id, sandbox_id, asset_id, geom, params, transform, state')
    .eq('sandbox_id', id)
    .order('id', { ascending: true })

  // Fetch all assets
  const { data: assets } = await supabase
    .from('assets')
    .select('id, name, kind, model_url, default_params')
    .order('name', { ascending: true })

  // Calculate polygon info
  const coordinates = (sandbox.geometry as any).coordinates[0]
  const pointCount = coordinates.length - 1

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Map Area (Left - Full Width) */}
      <div className="flex-1 relative">
        {/* Back Button */}
        <Link
          href="/map"
          className="absolute top-6 left-6 z-40 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Map
        </Link>

        {/* Sandbox Badge */}
        <div className="absolute top-6 right-6 z-40 px-4 py-2 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sandbox:</span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                sandbox.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {sandbox.status}
            </span>
          </div>
        </div>

        {/* Client Component with Prefab System */}
        <SandboxClient
          sandboxId={id}
          sandboxGeometry={sandbox.geometry}
          initialInstances={instances || []}
          initialAssets={assets || []}
        />
      </div>
    </div>
  )
}

// ARENA - Sandbox Detail Page (Creator View)
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/app/lib/supabase-client'

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

  // Calculate polygon info
  const coordinates = (sandbox.geometry as any).coordinates[0]
  const pointCount = coordinates.length - 1 // Last point duplicates first

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Map Area (Left - 70%) */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-lg shadow-lg flex items-center justify-center border-4 border-dashed border-indigo-300">
              <svg className="w-32 h-32 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">
              MapLibre GL map will render here
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Showing polygon boundary with dimmed exterior
            </p>
          </div>
        </div>

        {/* Back Button */}
        <Link
          href="/map"
          className="absolute top-6 left-6 z-10 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Map
        </Link>
      </div>

      {/* Side Panel (Right - 30%) */}
      <div className="w-[400px] bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sandbox Area
          </h1>
          <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              sandbox.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {sandbox.status}
          </span>
        </div>

        {/* Polygon Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Area Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Polygon Points:</span>
              <span className="font-medium text-gray-900">{pointCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Geometry Type:</span>
              <span className="font-medium text-gray-900">Polygon</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900 capitalize">
                {sandbox.status}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Metadata
          </h2>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Sandbox ID</p>
              <p className="font-mono text-xs text-gray-900 bg-gray-100 p-2 rounded">
                {sandbox.id}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Created</p>
              <p className="text-gray-900">
                {new Date(sandbox.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
          >
            Publish Sandbox (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}

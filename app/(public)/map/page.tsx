// ARENA - Map Page (Iteration 2 - Sandbox Lite Test)
import SandboxTest from './_components/SandboxTest'

export default function MapPage() {
  return (
    <div className="relative w-full h-screen">
      {/* Placeholder Map */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-lg shadow-2xl flex items-center justify-center">
            <svg className="w-32 h-32 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-indigo-900 mb-2">
            Map Placeholder
          </h2>
          <p className="text-indigo-700">
            MapLibre GL + Draw integration coming soon
          </p>
          <p className="text-sm text-indigo-600 mt-2">
            Use test button to create sandbox →
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">ARENA</h1>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
              i2-sandbox-lite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/proposals"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
          >
            Proposals
          </a>
        </div>
      </div>

      {/* Sandbox Test Component */}
      <SandboxTest />
    </div>
  )
}

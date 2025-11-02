'use client'

// ARENA - Standalone 3D Sandbox Editor Preview
// Direct URL: /editor
// Purpose: Demo/presentation page for Monday - Shows 3D building placement

import { useState } from 'react'

// Mock geometry data for Buenos Aires
const MOCK_GEOMETRY = {
  type: 'Point' as const,
  coordinates: [-58.3816, -34.6037], // Buenos Aires center
}

const MOCK_PROPOSAL = {
  id: 'demo-preview',
  title: 'Demo: Corredor Verde Av. del Libertador',
  geom: MOCK_GEOMETRY,
  center: {
    lng: -58.3816,
    lat: -34.6037,
  },
}

const MOCK_PLACED_OBJECTS = [
  {
    id: 'building-1',
    assetId: 'building',
    position: [-58.3816, -34.6037, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    properties: {
      height: 50,
      color: '#4A90E2',
      name: 'Edificio Demo',
    },
  },
  {
    id: 'tree-1',
    assetId: 'tree',
    position: [-58.3816 + 0.0005, -34.6037 + 0.0005, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    properties: {
      height: 15,
      color: '#2ECC71',
      name: 'Arbol 1',
    },
  },
  {
    id: 'bench-1',
    assetId: 'cube',
    position: [-58.3816 - 0.0003, -34.6037 + 0.0002, 0],
    rotation: [0, 0, 0],
    scale: [0.5, 0.3, 0.2],
    properties: {
      color: '#8B4513',
      name: 'Banco',
    },
  },
]

export default function SandboxEditorPage() {
  const [view3D, setView3D] = useState(true)
  const [showInfo, setShowInfo] = useState(true)

  // Dynamically import ReadOnlySandbox to avoid SSR issues
  const [ReadOnlySandbox, setReadOnlySandbox] = useState<any>(null)

  // Load ReadOnlySandbox component on mount
  useState(() => {
    import('@/app/components/ReadOnlySandbox')
      .then((mod) => setReadOnlySandbox(() => mod.default))
      .catch((err) => console.error('Failed to load ReadOnlySandbox:', err))
  })

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ARENA</h1>
              <p className="text-xs text-gray-300">3D Sandbox Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 2D/3D Toggle */}
            <button
              onClick={() => setView3D(!view3D)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all border border-white/20 text-sm font-medium"
            >
              {view3D ? '3D' : '2D'} View
            </button>

            {/* Info Toggle */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-sm font-medium"
            >
              {showInfo ? 'Hide' : 'Show'} Info
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute top-24 left-6 z-40 bg-black/80 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl max-w-md border border-white/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Vista Previa del Editor 3D</h2>
              <p className="text-sm text-gray-300">Presentacion - Demo Interactivo</p>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                1
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Visualizacion 3D:</strong> Objetos colocados en el espacio urbano real
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                2
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Interaccion:</strong> Rota la camara arrastrando, zoom con scroll
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center flex-shrink-0 font-semibold text-xs">
                3
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Objetos:</strong> {MOCK_PLACED_OBJECTS.length} elementos colocados en la escena
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-xs text-gray-400">
              <div className="font-semibold text-white mb-1">Ubicacion:</div>
              <div>Buenos Aires, Argentina</div>
              <div className="font-mono text-[10px] text-gray-500 mt-1">
                {MOCK_GEOMETRY.coordinates[1].toFixed(4)}, {MOCK_GEOMETRY.coordinates[0].toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Sandbox Canvas */}
      <div className="absolute inset-0 pt-20">
        {ReadOnlySandbox ? (
          <ReadOnlySandbox
            proposalId={MOCK_PROPOSAL.id}
            center={MOCK_PROPOSAL.center}
            geom={MOCK_PROPOSAL.geom}
            placedObjects={MOCK_PLACED_OBJECTS}
            is3D={view3D}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">Cargando editor 3D...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/20">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-gray-300">Demo Mode</span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="text-gray-300">
            <span className="text-white font-semibold">{MOCK_PLACED_OBJECTS.length}</span> objetos
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="text-gray-300">
            Vista: <span className="text-white font-semibold">{view3D ? '3D' : '2D'}</span>
          </div>
        </div>
      </div>

      {/* Instructions Overlay (dismissible) */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 z-30 bg-black/60 backdrop-blur-sm text-white p-4 rounded-xl max-w-xs border border-white/20">
        <h3 className="font-bold text-sm mb-2">Controles:</h3>
        <div className="space-y-2 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">Click + Drag</kbd>
            <span>Rotar camara</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">Scroll</kbd>
            <span>Zoom in/out</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono">Shift + Drag</kbd>
            <span>Mover camara</span>
          </div>
        </div>
      </div>
    </div>
  )
}

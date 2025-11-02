'use client'

// ARENA - Sandbox Placement Overlay
// Shows instructions and controls for object placement

interface SandboxOverlayProps {
  geometryType: 'building' | 'point' | 'polygon'
  hasPlacement: boolean
  onFinalize: () => void
  onCancel: () => void
}

const GEOMETRY_LABELS = {
  building: 'Edificio',
  point: 'Punto',
  polygon: 'Area',
}

const GEOMETRY_ICONS = {
  building: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  point: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  polygon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  ),
}

const GEOMETRY_INSTRUCTIONS = {
  building: 'Haz clic en un edificio en el mapa',
  point: 'Haz clic en cualquier punto del mapa',
  polygon: 'Haz clic para dibujar el area (doble clic para finalizar)',
}

export default function SandboxOverlay({
  geometryType,
  hasPlacement,
  onFinalize,
  onCancel,
}: SandboxOverlayProps) {
  return (
    <>
      {/* Instructions Banner */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{GEOMETRY_ICONS[geometryType]}</div>
          <div>
            <div className="font-semibold">{GEOMETRY_LABELS[geometryType]}</div>
            <div className="text-sm text-indigo-100">{GEOMETRY_INSTRUCTIONS[geometryType]}</div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-white rounded-xl shadow-2xl p-4 flex items-center gap-4">
        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar
        </button>

        {/* Status Indicator */}
        <div className="px-4 py-2 bg-gray-50 rounded-lg text-sm">
          {hasPlacement ? (
            <span className="text-green-600 font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Ubicacion seleccionada
            </span>
          ) : (
            <span className="text-gray-500">Esperando seleccion...</span>
          )}
        </div>

        {/* Finalize Button */}
        <button
          onClick={onFinalize}
          disabled={!hasPlacement}
          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
            hasPlacement
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Finalizar
        </button>
      </div>
    </>
  )
}

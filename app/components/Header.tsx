'use client'

// ARENA - Unified Header Component
// Single 80px header with conditional geometry selector

interface HeaderProps {
  // Proposals panel
  onOpenProposals: () => void

  // Create mode
  createMode: boolean
  onToggleCreate: () => void

  // Geometry selection
  selectedGeometry: 'building' | 'point' | 'polygon'
  onSelectGeometry: (type: 'building' | 'point' | 'polygon') => void
}

export default function Header({
  onOpenProposals,
  createMode,
  onToggleCreate,
  selectedGeometry,
  onSelectGeometry,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-white shadow-md z-50 px-6">
      <div className="h-full max-w-[1920px] mx-auto flex items-center justify-between">
        {/* LEFT SECTION: Logo + Propuestas */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="ARENA"
              className="h-6"
              style={{ height: '24px' }}
            />
          </div>

          {/* Propuestas Button */}
          <button
            onClick={onOpenProposals}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            PROPUESTAS
          </button>
        </div>

        {/* CENTER SECTION: Geometry Selector (conditional) */}
        {createMode && (
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl p-1.5">
            {/* Building Button */}
            <button
              onClick={() => onSelectGeometry('building')}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                selectedGeometry === 'building'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-indigo-700 hover:bg-indigo-100'
              }`}
              title="Seleccionar edificio"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              EDIFICIO
            </button>

            {/* Point Button */}
            <button
              onClick={() => onSelectGeometry('point')}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                selectedGeometry === 'point'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-indigo-700 hover:bg-indigo-100'
              }`}
              title="Colocar punto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              PUNTO
            </button>

            {/* Polygon Button */}
            <button
              onClick={() => onSelectGeometry('polygon')}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                selectedGeometry === 'polygon'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-indigo-700 hover:bg-indigo-100'
              }`}
              title="Dibujar área"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              ÁREA
            </button>
          </div>
        )}

        {/* RIGHT SECTION: Crear + Usuario */}
        <div className="flex items-center gap-4">
          {/* Crear Button */}
          <button
            onClick={onToggleCreate}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              createMode
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={createMode ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'}
              />
            </svg>
            {createMode ? 'CANCELAR' : 'CREAR'}
          </button>

          {/* Usuario Dropdown */}
          <div className="relative">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              USUARIO
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Dropdown menu - placeholder for future implementation */}
          </div>
        </div>
      </div>
    </header>
  )
}

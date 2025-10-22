'use client'

// ARENA V1.0 - Feature Selector Component
// Allows users to select a detected OSM feature or use exact click point

import { DetectedFeature, getFeatureIcon } from '@/src/lib/feature-detection'

interface FeatureSelectorProps {
  features: DetectedFeature[]
  clickPoint: { lng: number; lat: number }
  onSelect: (feature: DetectedFeature | null) => void
  onClose: () => void
}

export default function FeatureSelector({
  features,
  clickPoint,
  onSelect,
  onClose,
}: FeatureSelectorProps) {
  const handleSelectFeature = (feature: DetectedFeature) => {
    console.log('🎯 Feature selected:', feature)
    onSelect(feature)
  }

  const handleSelectExactPoint = () => {
    console.log('📍 Exact point selected:', clickPoint)
    onSelect(null)
  }

  return (
    <>
      {/* Backdrop with fade-in animation */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel with slide-up animation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="max-w-2xl mx-auto mb-6 px-4">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {features.length > 0 ? 'Seleccionar elemento' : 'Ubicación'}
                </h3>
                <p className="text-sm text-indigo-100 mt-0.5">
                  {features.length > 0
                    ? `${features.length} elemento${features.length !== 1 ? 's' : ''} detectado${features.length !== 1 ? 's' : ''}`
                    : 'No se encontraron elementos en esta ubicación'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-indigo-500 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {features.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {features.map((feature, index) => (
                    <button
                      key={feature.id}
                      onClick={() => handleSelectFeature(feature)}
                      className="w-full px-6 py-4 hover:bg-indigo-50 transition-colors text-left group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-indigo-200 transition-colors">
                          {getFeatureIcon(feature.type)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                                {feature.name || 'Sin nombre'}
                              </h4>
                              {feature.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {feature.description}
                                </p>
                              )}
                            </div>
                            <span className="flex-shrink-0 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                              {feature.type}
                            </span>
                          </div>

                          {/* OSM ID */}
                          {feature.osmId && (
                            <p className="text-xs text-gray-500 mt-2 font-mono">
                              OSM: {feature.osmId}
                            </p>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    No se encontraron elementos
                  </h4>
                  <p className="text-sm text-gray-600">
                    Puedes crear una propuesta en el punto exacto que seleccionaste
                  </p>
                </div>
              )}

              {/* Exact Point Option */}
              <div className="border-t-2 border-gray-200">
                <button
                  onClick={handleSelectExactPoint}
                  className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-indigo-100 transition-colors">
                      📍
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        Usar punto exacto
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Lat: {clickPoint.lat.toFixed(6)}, Lng: {clickPoint.lng.toFixed(6)}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  )
}

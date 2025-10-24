// ARENA - Inspector Component
'use client'

import { useState, useEffect } from 'react'

type Instance = {
  id: string
  sandboxId: string
  assetId: string
  geom: any
  params: Record<string, any>
  transform: Record<string, any>
  state: string
}

type Asset = {
  id: string
  name: string
  kind: string
  modelUrl: string | null
  defaultParams: Record<string, any>
}

type InspectorProps = {
  selectedInstance: Instance | null
  asset: Asset | null
  onUpdate: (params: Record<string, any>, transform: Record<string, any>) => void
  onDelete: () => void
  onClose: () => void
}

export default function Inspector({
  selectedInstance,
  asset,
  onUpdate,
  onDelete,
  onClose,
}: InspectorProps) {
  const [floors, setFloors] = useState(1)
  const [height, setHeight] = useState(3)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Initialize values when instance changes
  useEffect(() => {
    if (selectedInstance) {
      setFloors(selectedInstance.params.floors || asset?.defaultParams?.floors || 1)
      setHeight(selectedInstance.params.height || asset?.defaultParams?.height || 3)
      setScale(
        typeof selectedInstance.transform.scale === 'number'
          ? selectedInstance.transform.scale
          : 1
      )
      setRotation(
        typeof selectedInstance.transform.rotation === 'number'
          ? selectedInstance.transform.rotation
          : 0
      )
    }
  }, [selectedInstance, asset])

  if (!selectedInstance || !asset) {
    return null
  }

  const handleUpdate = () => {
    const params: Record<string, any> = {}
    const transform: Record<string, any> = {}

    if (asset.kind === 'building') {
      params.floors = floors
      params.height = floors * 3
    } else {
      params.height = height
    }

    if (scale !== 1) {
      transform.scale = scale
    }
    if (rotation !== 0) {
      transform.rotation = rotation
    }

    onUpdate(params, transform)
  }

  return (
    <div className="absolute top-24 right-6 z-30 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Inspector</h3>
        <button
          onClick={onClose}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Asset Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 mb-1">Selected Asset</div>
        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
        <div className="text-xs text-gray-500 capitalize">{asset.kind}</div>
      </div>

      {/* Parameters */}
      <div className="space-y-4 mb-4">
        {/* Floors (for buildings) */}
        {asset.kind === 'building' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Floors: {floors}
            </label>
            <input
              type="range"
              min="1"
              max="30"
              value={floors}
              onChange={(e) => setFloors(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>30</span>
            </div>
          </div>
        )}

        {/* Height (for non-buildings) */}
        {asset.kind !== 'building' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Height: {height}m
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1m</span>
              <span>20m</span>
            </div>
          </div>
        )}

        {/* Scale */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Scale: {scale.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.5x</span>
            <span>3x</span>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Rotation: {rotation}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>360°</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleUpdate}
          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Update Instance
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
        >
          Delete Instance
        </button>
      </div>

      {/* Info */}
      <div className="mt-3 p-2 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 Adjust parameters and click Update to apply changes
        </p>
      </div>
    </div>
  )
}

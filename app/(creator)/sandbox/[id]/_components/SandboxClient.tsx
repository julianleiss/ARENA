// ARENA - Sandbox Client Component (Orchestrates Prefab System)
'use client'

import { useState } from 'react'
import PrefabPalette from '../../_components/PrefabPalette'
import SandboxLayer from '../../_components/SandboxLayer'
import Inspector from '../../_components/Inspector'
import PublishBar from '../../_components/PublishBar'
import {
  createInstance,
  updateInstance,
  deleteInstance,
} from '../../_actions/instances'

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

type SandboxClientProps = {
  sandboxId: string
  sandboxStatus: string
  sandboxGeometry: any
  initialInstances: any[]
  initialAssets: any[]
}

export default function SandboxClient({
  sandboxId,
  sandboxStatus,
  sandboxGeometry,
  initialInstances,
  initialAssets,
}: SandboxClientProps) {
  const [assets] = useState<Asset[]>(
    initialAssets.map((a: any) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      modelUrl: a.model_url,
      defaultParams: a.default_params,
    }))
  )

  const [instances, setInstances] = useState<Instance[]>(
    initialInstances.map((i: any) => ({
      id: i.id,
      sandboxId: i.sandbox_id,
      assetId: i.asset_id,
      geom: i.geom,
      params: i.params,
      transform: i.transform,
      state: i.state,
    }))
  )

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  )
  const [loading, setLoading] = useState(false)

  // Get selected instance and its asset
  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) || null
  const selectedAsset = selectedInstance
    ? assets.find((a) => a.id === selectedInstance.assetId) || null
    : null

  // Handle map click to place instance
  const handleMapClick = async (lng: number, lat: number) => {
    if (!selectedAssetId || loading) return

    setLoading(true)

    const asset = assets.find((a) => a.id === selectedAssetId)
    if (!asset) {
      setLoading(false)
      return
    }

    const result = await createInstance({
      sandboxId,
      assetId: selectedAssetId,
      geom: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      params: asset.defaultParams,
      transform: {},
    })

    if (result.success && result.data) {
      setInstances([...instances, result.data as Instance])
      // Show toast (optional - could add toast library)
      console.log('Instance created successfully')
    } else {
      alert(result.error || 'Failed to create instance')
    }

    setLoading(false)
  }

  // Handle instance update
  const handleInstanceUpdate = async (
    params: Record<string, any>,
    transform: Record<string, any>
  ) => {
    if (!selectedInstanceId || loading) return

    setLoading(true)

    const result = await updateInstance({
      id: selectedInstanceId,
      params,
      transform,
    })

    if (result.success) {
      setInstances(
        instances.map((i) =>
          i.id === selectedInstanceId
            ? { ...i, params, transform, state: 'modified' }
            : i
        )
      )
      console.log('Instance updated successfully')
    } else {
      alert(result.error || 'Failed to update instance')
    }

    setLoading(false)
  }

  // Handle instance delete
  const handleInstanceDelete = async () => {
    if (!selectedInstanceId || loading) return

    if (!confirm('Are you sure you want to delete this instance?')) {
      return
    }

    setLoading(true)

    const result = await deleteInstance({ id: selectedInstanceId })

    if (result.success) {
      setInstances(instances.filter((i) => i.id !== selectedInstanceId))
      setSelectedInstanceId(null)
      console.log('Instance deleted successfully')
    } else {
      alert(result.error || 'Failed to delete instance')
    }

    setLoading(false)
  }

  return (
    <>
      {/* Prefab Palette */}
      <PrefabPalette
        assets={assets}
        selectedAssetId={selectedAssetId}
        onSelectAsset={setSelectedAssetId}
      />

      {/* Inspector (when instance selected) */}
      {selectedInstance && selectedAsset && (
        <Inspector
          selectedInstance={selectedInstance}
          asset={selectedAsset}
          onUpdate={handleInstanceUpdate}
          onDelete={handleInstanceDelete}
          onClose={() => setSelectedInstanceId(null)}
        />
      )}

      {/* 2.5D Map Layer */}
      <SandboxLayer
        sandboxGeometry={sandboxGeometry}
        instances={instances}
        assets={assets}
        selectedInstanceId={selectedInstanceId}
        onInstanceClick={setSelectedInstanceId}
        onMapClick={handleMapClick}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            <span className="text-sm font-medium text-gray-700">
              Processing...
            </span>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!selectedInstanceId && selectedAssetId && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            Click on the map to place {assets.find((a) => a.id === selectedAssetId)?.name}
          </p>
        </div>
      )}

      {/* Publish Bar */}
      <PublishBar
        sandboxId={sandboxId}
        sandboxStatus={sandboxStatus}
        instanceCount={instances.length}
      />
    </>
  )
}

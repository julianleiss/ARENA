'use client'

// ARENA V1.0 - Model Upload Component (Iteration 7)
// Upload glTF/GLB models to Supabase storage and create custom assets

import { useState } from 'react'

interface ModelUploadProps {
  onAssetCreated?: (assetId: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['model/gltf-binary', 'model/gltf+json', '.glb', '.gltf']

export default function ModelUpload({ onAssetCreated }: ModelUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assetName, setAssetName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    }

    // Check extension
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext !== 'glb' && ext !== 'gltf') {
      return 'Only .glb and .gltf files are allowed'
    }

    // Check MIME type (if available)
    if (file.type && !ALLOWED_TYPES.some((type) => file.type.includes(type))) {
      return `Invalid MIME type: ${file.type}`
    }

    return null
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }

    setError(null)
    setSelectedFile(file)

    // Auto-fill name if empty
    if (!assetName) {
      const nameWithoutExt = file.name.replace(/\.(glb|gltf)$/i, '')
      setAssetName(nameWithoutExt)
    }
  }

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !assetName.trim()) {
      setError('Please provide a name and select a file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', assetName.trim())

      // Upload to API
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()

      // Success
      alert(`Model "${assetName}" uploaded successfully!`)
      setAssetName('')
      setSelectedFile(null)

      // Reset file input
      const fileInput = document.getElementById('model-file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Callback
      if (onAssetCreated) {
        onAssetCreated(data.assetId)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Custom 3D Model
      </h3>

      <div className="space-y-4">
        {/* Asset Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asset Name *
          </label>
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="e.g., Custom Building"
            maxLength={100}
            disabled={uploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model File (.glb or .gltf) *
          </label>
          <input
            id="model-file-input"
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Max size: 10MB | Formats: GLB, glTF
          </p>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong>Selected:</strong> {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500">
              Size: {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !assetName.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Model'}
        </button>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Uploaded models will appear in the prefab palette
            and can be placed in the sandbox with full 3D rendering.
          </p>
        </div>
      </div>
    </div>
  )
}

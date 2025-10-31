'use client'

// ARENA - Sandbox Toolbar Component
// Provides undo/redo/save controls

import { useEffect, useState } from 'react'

interface ToolbarProps {
  canUndo: boolean
  canRedo: boolean
  hasUnsavedChanges: boolean
  isSaving: boolean
  lastSaved: Date | null
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onDelete?: () => void
  hasSelection?: boolean
}

export default function Toolbar({
  canUndo,
  canRedo,
  hasUnsavedChanges,
  isSaving,
  lastSaved,
  onUndo,
  onRedo,
  onSave,
  onDelete,
  hasSelection = false,
}: ToolbarProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')

  // Update "time ago" text
  useEffect(() => {
    if (!lastSaved) return

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (seconds < 60) setTimeAgo('just now')
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)}m ago`)
      else if (seconds < 86400) setTimeAgo(`${Math.floor(seconds / 3600)}h ago`)
      else setTimeAgo(`${Math.floor(seconds / 86400)}d ago`)
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 10000) // Update every 10s

    return () => clearInterval(interval)
  }, [lastSaved])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 px-4 py-2 flex items-center gap-3">
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all group relative"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Undo (Ctrl+Z)
          </span>
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all group relative"
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Redo (Ctrl+Y)
          </span>
        </button>

        <div className="w-px h-6 bg-gray-700" />

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white text-sm font-medium group relative flex items-center gap-2"
          title="Save (Ctrl+S)"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save</span>
            </>
          )}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Save (Ctrl+S)
          </span>
        </button>

        {/* Save status */}
        <div className="text-xs text-gray-400 flex items-center gap-2">
          {isSaving && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              Saving...
            </span>
          )}
          {!isSaving && hasUnsavedChanges && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              Unsaved
            </span>
          )}
          {!isSaving && !hasUnsavedChanges && lastSaved && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Saved {timeAgo}
            </span>
          )}
        </div>

        {onDelete && hasSelection && (
          <>
            <div className="w-px h-6 bg-gray-700" />

            {/* Delete */}
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all group relative"
              title="Delete (Del)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Delete (Del)
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

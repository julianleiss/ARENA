'use client'
import { useState } from 'react'
import type { PlacedObject } from './SandboxClient'

interface StatsPanelProps {
  placedObjects: PlacedObject[]
  proposalArea?: number
}

export default function StatsPanel(props: StatsPanelProps) {
  const { placedObjects, proposalArea = 2500 } = props
  const [isExpanded, setIsExpanded] = useState(false)
  const totalObjects = placedObjects.length
  const estimatedCost = totalObjects * 500
  const density = proposalArea > 0 ? (totalObjects / proposalArea) * 100 : 0
  const categoryCounts: Record<string, number> = {}
  placedObjects.forEach(obj => {
    const cat = obj.asset.category
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  })
  const categories = [
    { key: 'vegetation', label: 'Trees', icon: '🌳' },
    { key: 'furniture', label: 'Furniture', icon: '🪑' },
    { key: 'structures', label: 'Structures', icon: '🏗️' },
    { key: 'lighting', label: 'Lighting', icon: '💡' },
    { key: 'people', label: 'People', icon: '👤' },
  ]
  if (totalObjects === 0) return null
  return (
    <div className="absolute bottom-4 right-4 z-10">
      <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><span>📊</span></div>
            <div className="text-left"><p className="text-sm font-semibold text-white">Stats</p><p className="text-xs text-gray-400">{totalObjects} objects</p></div>
          </div>
          <svg className={"w-5 h-5 text-gray-400 transition " + (isExpanded ? 'rotate-180' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isExpanded && (<div className="px-4 pb-4 space-y-3"><div className="flex justify-between text-sm"><span className="text-gray-400">Total:</span><span className="text-white font-semibold">{totalObjects}</span></div>{Object.keys(categoryCounts).length > 0 && (<div className="space-y-2"><p className="text-xs text-gray-300 font-semibold">By Category:</p>{categories.map(c => { const count = categoryCounts[c.key]; if (!count) return null; return (<div key={c.key} className="flex justify-between text-xs"><span className="text-gray-400">{c.icon} {c.label}</span><span className="text-gray-200">{count}</span></div>) })}</div>)}<div className="border-t border-gray-700 pt-3 space-y-2"><div className="flex justify-between text-sm"><span className="text-gray-400">Area:</span><span className="text-white">{proposalArea.toLocaleString()} m²</span></div><div className="flex justify-between text-sm"><span className="text-gray-400">Density:</span><span className="text-white">{density.toFixed(2)}/100m²</span></div><div className="flex justify-between text-sm"><span className="text-gray-400">Cost:</span><span className="text-green-400">${estimatedCost.toLocaleString()}</span></div></div><p className="text-xs text-gray-500 italic">💡 $500 per object</p></div>)}
      </div>
    </div>
  )
}

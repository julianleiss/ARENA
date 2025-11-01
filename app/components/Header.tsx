'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import packageJson from '@/package.json'

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* LEFT: Logo + Version */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ARENA
              </span>
            </Link>
            <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              v{packageJson.version}
            </span>
          </div>

          {/* RIGHT: Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pathname === '/'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>🗺️</span>
              <span>Mapa</span>
            </Link>
            <Link
              href="/proposals"
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pathname?.startsWith('/proposals')
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>📋</span>
              <span>Propuestas</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

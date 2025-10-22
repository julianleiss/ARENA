// ARENA V1.0 - Landing Page
// Temporary landing page for v0.100 validation

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ARENA V1.0
          </h1>
          <p className="text-xl text-gray-600">
            Plataforma cívica para transformaciones urbanas
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                v0.100 — Sistema Activo
              </h3>
              <p className="mt-2 text-sm text-green-700">
                Infraestructura base configurada y funcionando correctamente.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Base de datos conectada</p>
              <p className="text-xs text-gray-500">PostgreSQL + Prisma ORM</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
              <span className="text-blue-600 font-semibold">2</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Autenticación configurada</p>
              <p className="text-xs text-gray-500">Supabase Auth</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
              <span className="text-blue-600 font-semibold">3</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">API funcionando</p>
              <p className="text-xs text-gray-500">Endpoints REST disponibles</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-3">
          <a
            href="/map"
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            🗺️ Abrir Scene Viewer
          </a>
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors duration-200"
          >
            Verificar Estado del Sistema
          </a>
          <p className="mt-4 text-center text-sm text-gray-500">
            Versión actual: <strong className="text-gray-700">v0.101 — Scene Viewer</strong>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ARENA V1.0 MVP — Tesis de Arquitectura Urbana
          </p>
        </div>
      </div>
    </main>
  )
}
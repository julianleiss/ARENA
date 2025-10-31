// ARENA - 3D Sandbox Landing Page
import Link from 'next/link'

export default function SandboxLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ARENA
            </h1>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
              v0.3
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/map" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Map
            </Link>
            <Link href="/proposals" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Proposals
            </Link>
            <Link href="/sandbox" className="text-indigo-600 text-sm font-bold">
              Sandbox
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-xs font-bold rounded-full mb-6 animate-pulse">
            <span>NEW FEATURE</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Design Urban Spaces in Immersive 3D
          </h1>
          <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your urban proposals into interactive 3D models. Place buildings, trees, and infrastructure
            in a real-world context and visualize your vision before it's built.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sandbox/demo"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Try Demo
            </Link>
            <Link
              href="/proposals"
              className="px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-xl border-2 border-gray-300 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-lg"
            >
              Start with Proposal
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Powerful 3D Design Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg">
                Assets
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Asset Library</h3>
              <p className="text-gray-600 leading-relaxed">
                Choose from 12+ primitive shapes and urban elements. Place buildings, trees, benches,
                and infrastructure with simple clicks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg">
                Context
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Urban Context</h3>
              <p className="text-gray-600 leading-relaxed">
                Design proposals in real geographic locations. See your ideas integrated with
                existing buildings and infrastructure.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg">
                Save
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Save & Share</h3>
              <p className="text-gray-600 leading-relaxed">
                Auto-save your designs as you work. Share 3D visualizations with the community
                and gather feedback on your proposals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create or Select a Proposal</h3>
                <p className="text-gray-600 leading-relaxed">
                  Start from the map or proposals page. Select a geographic area where you want to design
                  your urban transformation project.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Design in 3D Sandbox</h3>
                <p className="text-gray-600 leading-relaxed">
                  Use the asset palette to place objects. Adjust heights, colors, and positions.
                  Orbit around your design to see it from every angle.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-600 to-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Share & Gather Feedback</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your design auto-saves as you work. Share your 3D visualization with the community
                  and let citizens vote and comment on your proposal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Design the Future?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join urban planners and citizens shaping their cities with immersive 3D tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/proposals"
              className="px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              href="/map"
              className="px-8 py-4 bg-transparent text-white text-lg font-bold rounded-xl border-2 border-white hover:bg-white/10 transition-all"
            >
              Explore Map
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            &copy; 2025 ARENA. Empowering civic participation through immersive urban design.
          </p>
        </div>
      </footer>
    </div>
  )
}

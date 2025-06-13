export default function Hero() {
  return (
    <section className="hero-gradient section-padding">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Break the{' '}
              <span className="text-blue-600">Barrier</span>: Real-time Sign Language Translation for Google Meet
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Experience seamless communication with our cutting-edge AI technology that translates sign language in real-time during your Google Meet calls.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary text-lg px-8 py-4">
                Start Free Trial
              </button>
              <button className="btn-secondary text-lg px-8 py-4">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="relative animate-fade-in-up">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8">
              {/* Mock Google Meet Interface */}
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-white text-sm">Google Meet</div>
                </div>
                <div className="bg-blue-600 rounded-lg h-32 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-2xl mb-2">🤟</div>
                    <div className="text-sm">Sign Language Detection Active</div>
                  </div>
                </div>
              </div>
              
              {/* Translation Output */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-800 font-medium">Live Translation</span>
                </div>
                <p className="text-gray-700">"Hello, how are you today?"</p>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500 rounded-full animate-float opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-500 rounded-full animate-float opacity-20" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 -right-8 w-8 h-8 bg-purple-500 rounded-full animate-float opacity-20" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
      </div>
    </section>
  )
}
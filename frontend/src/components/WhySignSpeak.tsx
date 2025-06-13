export default function WhySignSpeak() {
  return (
    <section id="why" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why SignSpeak?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered solution bridges communication gaps, making digital meetings truly inclusive for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Problem Card */}
          <div className="feature-card border-l-4 border-red-500">
            <div className="icon-circle bg-red-100 text-red-600">
              ❌
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Communication Barriers</h3>
            <p className="text-gray-600 mb-4">
              Deaf and hard-of-hearing individuals face significant challenges in video conferences, often requiring interpreters or missing crucial information.
            </p>
            <ul className="text-gray-600 space-y-2">
              <li>• Limited accessibility options</li>
              <li>• Dependency on interpreters</li>
              <li>• Missed opportunities in meetings</li>
              <li>• Reduced participation</li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="feature-card border-l-4 border-green-500">
            <div className="icon-circle bg-green-100 text-green-600">
              ✅
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">SignSpeak Solution</h3>
            <p className="text-gray-600 mb-4">
              Real-time AI translation that seamlessly integrates with Google Meet, providing instant text conversion of sign language.
            </p>
            <ul className="text-gray-600 space-y-2">
              <li>• Instant sign language recognition</li>
              <li>• Real-time text translation</li>
              <li>• Seamless Google Meet integration</li>
              <li>• Enhanced meeting participation</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
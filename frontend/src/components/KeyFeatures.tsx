export default function KeyFeatures() {
  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Recognition",
      description: "Advanced machine learning algorithms ensure accurate sign language detection and translation.",
      color: "blue"
    },
    {
      icon: "⚡",
      title: "Real-time Processing",
      description: "Instant translation with minimal latency for natural, flowing conversations.",
      color: "green"
    },
    {
      icon: "🔒",
      title: "Privacy & Security",
      description: "End-to-end encryption ensures your conversations remain private and secure.",
      color: "purple"
    },
    {
      icon: "🌍",
      title: "Multi-language Support",
      description: "Support for multiple sign languages including ASL, BSL, and more coming soon.",
      color: "orange"
    }
  ]

  return (
    <section id="features" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the powerful features that make SignSpeak the leading solution for accessible communication.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card text-center">
              <div className={`icon-circle mx-auto ${
                feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                feature.color === 'green' ? 'bg-green-100 text-green-600' :
                feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Meetings?</h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who are already experiencing barrier-free communication.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
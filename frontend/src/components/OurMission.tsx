export default function OurMission() {
  const missions = [
    {
      icon: "♿",
      title: "Accessibility First",
      description: "We believe technology should be inclusive and accessible to everyone, regardless of hearing ability.",
      color: "blue"
    },
    {
      icon: "🤝",
      title: "Breaking Barriers",
      description: "Our mission is to eliminate communication barriers and create equal opportunities for all.",
      color: "green"
    },
    {
      icon: "🚀",
      title: "Innovation for Good",
      description: "We harness cutting-edge AI technology to solve real-world accessibility challenges.",
      color: "purple"
    }
  ]

  return (
    <section id="mission" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're committed to creating a world where communication knows no boundaries, 
            empowering everyone to participate fully in digital conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {missions.map((mission, index) => (
            <div key={index} className="feature-card text-center">
              <div className={`icon-circle mx-auto ${
                mission.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                mission.color === 'green' ? 'bg-green-100 text-green-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {mission.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{mission.title}</h3>
              <p className="text-gray-600">{mission.description}</p>
            </div>
          ))}
        </div>

        {/* Impact Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h3>
            <p className="text-gray-600">Making a difference in the deaf and hard-of-hearing community</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">1M+</div>
              <div className="text-gray-600">Translations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">99.2%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
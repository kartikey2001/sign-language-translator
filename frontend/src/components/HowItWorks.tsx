export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Install Extension",
      description: "Add SignSpeak to your Chrome browser with one click",
      icon: "⬇️",
      color: "blue"
    },
    {
      number: "02",
      title: "Join Google Meet",
      description: "Start or join any Google Meet call as usual",
      icon: "📹",
      color: "green"
    },
    {
      number: "03",
      title: "Activate Translation",
      description: "Enable SignSpeak with a single click in your meeting",
      icon: "🤟",
      color: "purple"
    }
  ]

  return (
    <section id="how-it-works" className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get started with SignSpeak in three simple steps and transform your meeting experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="feature-card text-center relative">
              <div className={`icon-circle mx-auto ${
                step.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                step.color === 'green' ? 'bg-green-100 text-green-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {step.icon}
              </div>
              
              <div className={`absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                step.color === 'blue' ? 'bg-blue-600' :
                step.color === 'green' ? 'bg-green-600' :
                'bg-purple-600'
              }`}>
                {step.number}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
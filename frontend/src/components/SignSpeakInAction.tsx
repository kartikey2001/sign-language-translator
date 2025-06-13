'use client'

import { useState } from 'react'

export default function SignSpeakInAction() {
  const [activeDemo, setActiveDemo] = useState('translation')

  return (
    <section className="section-padding bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">See SignSpeak in Action</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of real-time sign language translation with our interactive demo.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Demo Navigation */}
          <div className="bg-gray-100 px-6 py-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveDemo('translation')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeDemo === 'translation'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Live Translation
              </button>
              <button
                onClick={() => setActiveDemo('meeting')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeDemo === 'meeting'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Meeting Integration
              </button>
            </div>
          </div>

          {/* Demo Content */}
          <div className="p-8">
            {activeDemo === 'translation' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-time Translation</h3>
                  <p className="text-gray-600 mb-6">
                    Watch as SignSpeak instantly recognizes and translates sign language gestures into text, 
                    making communication seamless and natural.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">99.2% accuracy rate</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Sub-second response time</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">Multiple sign languages supported</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="bg-blue-600 rounded-lg h-48 flex items-center justify-center mb-4">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-4 animate-pulse">🤟</div>
                      <div className="text-lg">Detecting Sign Language...</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">Translated Text:</div>
                    <div className="text-gray-900 font-medium">"Thank you for joining today's meeting"</div>
                  </div>
                </div>
              </div>
            )}

            {activeDemo === 'meeting' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Google Meet Integration</h3>
                  <p className="text-gray-600 mb-6">
                    SignSpeak seamlessly integrates with Google Meet, providing real-time captions 
                    and translation without disrupting your meeting flow.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">One-click activation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Non-intrusive interface</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">Automatic meeting transcripts</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="bg-white rounded-lg shadow-lg">
                    {/* Mock Google Meet Header */}
                    <div className="bg-gray-800 text-white p-3 rounded-t-lg flex items-center justify-between">
                      <span className="text-sm">Team Meeting - Google Meet</span>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Mock Video Grid */}
                    <div className="p-4 grid grid-cols-2 gap-2">
                      <div className="bg-blue-600 rounded h-20 flex items-center justify-center text-white text-xs">
                        You
                      </div>
                      <div className="bg-green-600 rounded h-20 flex items-center justify-center text-white text-xs">
                        Participant
                      </div>
                    </div>
                    
                    {/* SignSpeak Caption Bar */}
                    <div className="bg-blue-50 border-t p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-medium text-blue-700">SignSpeak Active</span>
                      </div>
                      <div className="text-sm text-gray-700 bg-white rounded p-2">
                        "Let's discuss the project timeline"
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
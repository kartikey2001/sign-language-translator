'use client'

import { useState } from 'react'
import MediaCapture from '../components/MediaCapture'

export default function Home() {
  const [speechText, setSpeechText] = useState<string>('')
  const [handState, setHandState] = useState<string>('No hand detected')
  const [isActive, setIsActive] = useState<boolean>(false)
  const [detectedGesture, setDetectedGesture] = useState<string>('')
  const [gestureConfidence, setGestureConfidence] = useState<number>(0)

  const handleTranscript = (text: string, isFinal: boolean) => {
    setSpeechText(text)
  }

  const handleHandState = (state: string) => {
    setHandState(state)
  }

  const handleGestureDetected = (gesture: string, confidence: number) => {
    setDetectedGesture(gesture)
    setGestureConfidence(confidence)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤟 Sign Language Translator
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Real-time sign language to text conversion for Google Meets
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              {isActive ? '● ACTIVE' : '○ INACTIVE'}
            </div>
            <div className="text-sm text-blue-600 font-medium">
              🏆 Made with Bolt.new
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Camera Feed
              </h2>
              <MediaCapture 
                onTranscript={handleTranscript}
                onHandState={handleHandState}
                onActiveChange={setIsActive}
                onGestureDetected={handleGestureDetected}
        />
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Hand Detection Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Hand Detection
              </h3>
              <div className={`p-4 rounded-lg ${
                handState.includes('detected') 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`text-sm font-medium ${
                  handState.includes('detected') ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {handState}
                </div>
              </div>
            </div>

            {/* Gesture Recognition */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Sign Language Detection
              </h3>
              <div className={`p-4 rounded-lg ${
                detectedGesture && detectedGesture !== 'unknown' 
                  ? 'bg-purple-50 border border-purple-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className={`text-lg font-bold ${
                  detectedGesture && detectedGesture !== 'unknown' 
                    ? 'text-purple-800' 
                    : 'text-gray-600'
                }`}>
                  {detectedGesture || 'No gesture detected'}
                </div>
                {gestureConfidence > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Confidence: {Math.round(gestureConfidence * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Speech Recognition */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Speech Recognition
              </h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg min-h-[120px]">
                <div className="text-sm text-blue-800">
                  {speechText || 'Listening for speech...'}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Instructions
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Allow camera and microphone access</li>
                <li>• Position your hand in front of the camera</li>
                <li>• Try ASL letters: A, B, D, L, Y</li>
                <li>• Speak clearly for voice recognition</li>
                <li>• Green landmarks show detected gestures</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            🚀 Development Status - Week 2A Complete!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-green-700">✅ Webcam & Microphone Access</div>
              <div className="text-green-700">✅ MediaPipe Hands Integration</div>
              <div className="text-green-700">✅ Live Hand Landmark Detection</div>
              <div className="text-green-700">✅ Basic Gesture Classification</div>
            </div>
            <div className="space-y-1">
              <div className="text-green-700">✅ Web Speech API Integration</div>
              <div className="text-green-700">✅ Real-time Speech Recognition</div>
              <div className="text-green-700">✅ Combined Audio/Visual Processing</div>
              <div className="text-green-700">✅ ASL Letter Recognition (A,B,D,L,Y)</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-indigo-600">
            🎯 <strong>Bolt Hackathon Progress:</strong> Real-time sign language translation working! Next: Backend integration & more gestures.
          </div>
        </div>

        {/* Gesture Guide */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">
            🤲 ASL Gesture Guide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-bold text-purple-800">A</div>
              <div className="text-gray-600">Fist with thumb up</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-bold text-purple-800">B</div>
              <div className="text-gray-600">Four fingers up</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-bold text-purple-800">D</div>
              <div className="text-gray-600">Index finger up</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-bold text-purple-800">L</div>
              <div className="text-gray-600">Thumb & index up</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-bold text-purple-800">Y</div>
              <div className="text-gray-600">Thumb & pinky up</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-bold text-purple-800">Open</div>
              <div className="text-gray-600">All fingers extended</div>
            </div>
          </div>
        </div>
        </div>
      </main>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'

// Speech Recognition Types
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      length: number
      isFinal: boolean
      [index: number]: {
        transcript: string
        confidence: number
      }
    }
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechCaptureProps {
  onTranscript: (text: string, isFinal: boolean) => void
}

export default function SpeechCapture({ onTranscript }: SpeechCaptureProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const intentionalStop = useRef<boolean>(false)

  useEffect(() => {
    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser')
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('Speech recognition started')
      setIsListening(true)
      setError('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      // Send interim results
      if (interimTranscript) {
        onTranscript(interimTranscript, false)
      }

      // Send final results
      if (finalTranscript) {
        onTranscript(finalTranscript.trim(), true)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)

      // Handle different error types appropriately
      if (event.error === 'aborted') {
        // Aborted errors are usually intentional stops, don't show error to user
        console.log('Speech recognition was aborted (likely intentional)')
        return
      }

      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and refresh.')
        return
      }

      if (event.error === 'network') {
        setError('Network error occurred. Please check your internet connection.')
        return
      }

      // Show error for other cases
      setError(`Speech recognition error: ${event.error}`)

      // Auto-restart on certain recoverable errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (recognitionRef.current && !intentionalStop.current) {
            try {
              recognitionRef.current.start()
            } catch (err) {
              console.error('Failed to restart speech recognition:', err)
            }
          }
        }, 1000)
      }
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
      
      if (intentionalStop.current) {
        console.log('Intentional stop, not restarting.')
        intentionalStop.current = false
        return
      }

      // Auto-restart recognition to keep it continuous
      setTimeout(() => {
        if (recognitionRef.current && !intentionalStop.current) {
          try {
            console.log('Auto-restarting speech recognition...')
            recognitionRef.current.start()
          } catch (err) {
            console.error('Failed to auto-restart speech recognition:', err)
            // If restart fails, don't keep trying indefinitely
            setError('Speech recognition stopped. Click Start to resume.')
          }
        }
      }, 500)
    }

    recognitionRef.current = recognition

    // Start recognition with a small delay to ensure proper initialization
    setTimeout(() => {
      if (recognitionRef.current && !intentionalStop.current) {
        try {
          recognitionRef.current.start()
        } catch (err) {
          console.error('Failed to start speech recognition:', err)
          setError('Failed to start speech recognition. Please check microphone permissions.')
        }
      }
    }, 100)

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        intentionalStop.current = true
        try {
          recognitionRef.current.stop()
        } catch (err) {
          console.error('Error stopping speech recognition on cleanup:', err)
        }
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      intentionalStop.current = true
      recognitionRef.current.stop()
      setError('') // Clear any previous errors
    } else {
      intentionalStop.current = false
      setError('') // Clear any previous errors
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Failed to start speech recognition:', err)
        setError('Failed to start speech recognition. Please refresh the page and try again.')
      }
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-2">⚠️</div>
          <div>
            <div className="text-yellow-800 font-medium">Speech Recognition Not Supported</div>
            <div className="text-yellow-700 text-sm mt-1">
              Your browser doesn't support the Web Speech API. Try using Chrome or Edge for full functionality.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-800">Speech Recognition</h4>
        <button
          onClick={toggleListening}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isListening
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isListening ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isListening ? 'Listening...' : 'Not listening'}
          </span>
        </div>
        
        {isListening && (
          <div className="flex items-center space-x-1">
            <div className="w-1 h-4 bg-blue-500 rounded animate-pulse"></div>
            <div className="w-1 h-6 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-3 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-5 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <div>Language: English (US)</div>
        <div>Continuous: Yes | Interim Results: Yes</div>
        <div className="mt-1">
          Status: {isSupported ? 'Supported' : 'Not Supported'} | 
          Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : 
                   navigator.userAgent.includes('Edge') ? 'Edge ✅' : 
                   'Limited Support ⚠️'}
        </div>
      </div>
    </div>
  )
} 
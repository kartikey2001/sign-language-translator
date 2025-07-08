'use client'

import { useEffect, useRef, useState } from 'react'

// MediaPipe Speech Recognition types
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
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState('')
  const [browserInfo, setBrowserInfo] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isStartingRef = useRef(false)
  const isStoppingRef = useRef(false)
  const intentionalStop = useRef(false)
  const hasInitialized = useRef(false)

  // Client-side detection
  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined' && navigator) {
      const userAgent = navigator.userAgent
      if (userAgent.includes('Chrome')) {
        setBrowserInfo('Chrome ✅')
      } else if (userAgent.includes('Edge')) {
        setBrowserInfo('Edge ✅')
      } else {
        setBrowserInfo('Limited Support ⚠️')
      }
    }
  }, [])

  // Safe start function with improved error handling
  const safeStart = () => {
    if (!recognitionRef.current || isStartingRef.current || isListening) {
      console.log('Cannot start: already starting or listening')
      return false
    }

    try {
      isStartingRef.current = true
      intentionalStop.current = false
      console.log('Starting speech recognition...')
      recognitionRef.current.start()
      return true
    } catch (err) {
      const error = err as Error
      console.error('Failed to start speech recognition:', error)
      
      // Handle the specific "already started" error
      if (error.message.includes('recognition has already started')) {
        console.log('Recognition already started, updating state...')
        setIsListening(true)
        isStartingRef.current = false
        return true
      }
      
      setError('Failed to start speech recognition. Please try again.')
      isStartingRef.current = false
      return false
    }
  }

  // Safe stop function
  const safeStop = () => {
    if (!recognitionRef.current || isStoppingRef.current) {
      console.log('Cannot stop: no recognition or already stopping')
      return false
    }

    try {
      isStoppingRef.current = true
      intentionalStop.current = true
      console.log('Stopping speech recognition...')
      recognitionRef.current.stop()
      return true
    } catch (err) {
      const error = err as Error
      console.error('Failed to stop speech recognition:', error)
      
      // Handle the case where recognition is already stopped
      if (error.message.includes('recognition has not started') || 
          error.message.includes('not started')) {
        console.log('Recognition already stopped, updating state...')
        setIsListening(false)
        isStoppingRef.current = false
        intentionalStop.current = false
        return true
      }
      
      isStoppingRef.current = false
      return false
    }
  }

  useEffect(() => {
    // Only initialize speech recognition on client side
    if (!isClient || typeof window === 'undefined') return
    
    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('Speech recognition already initialized, skipping...')
      return
    }

    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser')
      setIsSupported(false)
      return
    }
    
    hasInitialized.current = true

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('Speech recognition started successfully')
      setIsListening(true)
      setError('')
      isStartingRef.current = false
      isStoppingRef.current = false
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
      // Handle different error types appropriately
      if (event.error === 'aborted') {
        console.log('Speech recognition was aborted (likely intentional)')
        setIsListening(false)
        isStartingRef.current = false
        isStoppingRef.current = false
        return
      }

      // Log error for non-aborted cases
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      isStartingRef.current = false
      isStoppingRef.current = false

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

      // Auto-restart on certain recoverable errors after a delay
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (recognitionRef.current && !intentionalStop.current) {
            console.log('Auto-restarting after recoverable error...')
            safeStart()
          }
        }, 1500)
      }
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
      isStartingRef.current = false
      isStoppingRef.current = false
      
      if (intentionalStop.current) {
        console.log('Intentional stop, not restarting.')
        intentionalStop.current = false
        return
      }

      // Auto-restart recognition to keep it continuous
      setTimeout(() => {
        if (recognitionRef.current && !intentionalStop.current && !isStartingRef.current) {
          console.log('Auto-restarting speech recognition...')
          if (!safeStart()) {
            setError('Speech recognition stopped. Click Start to resume.')
          }
        }
      }, 750)
    }

    recognitionRef.current = recognition

    // Start recognition with a delay to ensure proper initialization
    setTimeout(() => {
      if (recognitionRef.current && !intentionalStop.current) {
        console.log('Initial start of speech recognition')
        safeStart()
      }
    }, 500)

    // Cleanup
    return () => {
      console.log('Cleaning up speech recognition')
      intentionalStop.current = true
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          console.error('Error stopping speech recognition on cleanup:', err)
        }
        recognitionRef.current = null
      }
      // Reset all refs
      isStartingRef.current = false
      isStoppingRef.current = false
      hasInitialized.current = false
    }
  }, [onTranscript, isClient])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      safeStop()
      setError('') // Clear any previous errors
    } else {
      intentionalStop.current = false
      setError('') // Clear any previous errors
      if (!safeStart()) {
        setError('Failed to start speech recognition. Please refresh the page and try again.')
      }
    }
  }

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-2"></div>
          <span className="text-gray-600">Loading speech recognition...</span>
        </div>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-yellow-600 mr-2">⚠️</div>
          <div>
            <div className="text-yellow-800 font-medium">Speech Recognition Not Supported</div>
            <div className="text-yellow-700 text-sm mt-1">
              Your browser doesn&apos;t support the Web Speech API. Try using Chrome or Edge for full functionality.
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
          disabled={isStartingRef.current || isStoppingRef.current}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isListening
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isStartingRef.current ? 'Starting...' : 
           isStoppingRef.current ? 'Stopping...' :
           isListening ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isStartingRef.current ? 'bg-yellow-500 animate-pulse' :
            isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm text-gray-600">
            {isStartingRef.current ? 'Starting...' :
             isStoppingRef.current ? 'Stopping...' :
             isListening ? 'Listening...' : 'Not listening'}
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
          Browser: {browserInfo || 'Loading...'}
        </div>
      </div>
    </div>
  )
} 
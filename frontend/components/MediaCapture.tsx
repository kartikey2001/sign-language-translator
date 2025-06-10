'use client'

import { useEffect, useRef, useState } from 'react'
import SpeechCapture from './SpeechCapture'

// MediaPipe types
declare global {
  interface Window {
    Hands: any
    Camera: any
    drawConnectors: any
    drawLandmarks: any
    HAND_CONNECTIONS: any
  }
}

interface MediaCaptureProps {
  onTranscript: (text: string, isFinal: boolean) => void
  onHandState: (state: string) => void
  onActiveChange: (active: boolean) => void
}

export default function MediaCapture({ 
  onTranscript, 
  onHandState, 
  onActiveChange 
}: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string>('')
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [handsInstance, setHandsInstance] = useState<any>(null)
  const [cameraInstance, setCameraInstance] = useState<any>(null)

  // Load MediaPipe scripts
  useEffect(() => {
    const loadMediaPipeScripts = async () => {
      try {
        // Load MediaPipe Hands
        const script1 = document.createElement('script')
        script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
        document.head.appendChild(script1)

        const script2 = document.createElement('script')
        script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
        document.head.appendChild(script2)

        const script3 = document.createElement('script')
        script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
        document.head.appendChild(script3)

        // Wait for scripts to load
        await new Promise((resolve) => {
          script3.onload = resolve
        })

        setIsLoaded(true)
      } catch (err) {
        console.error('Failed to load MediaPipe scripts:', err)
        setError('Failed to load MediaPipe libraries')
      }
    }

    loadMediaPipeScripts()
  }, [])

  // Initialize camera and MediaPipe
  useEffect(() => {
    if (!isLoaded || !videoRef.current || !canvasRef.current) return

    const initializeCamera = async () => {
      try {
        // Request camera and microphone permissions
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }, 
          audio: true 
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          setPermissionGranted(true)
          onActiveChange(true)
        }

        // Initialize MediaPipe Hands
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          }
        })

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        })

        hands.onResults(onHandsResults)
        setHandsInstance(hands)

        // Initialize camera helper
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await hands.send({ image: videoRef.current })
            }
          },
          width: 640,
          height: 480,
        })

        setCameraInstance(camera)
        camera.start()

      } catch (err) {
        console.error('Camera initialization failed:', err)
        setError('Failed to access camera and microphone. Please grant permissions and refresh.')
        onActiveChange(false)
      }
    }

    initializeCamera()

    // Cleanup
    return () => {
      if (cameraInstance) {
        cameraInstance.stop()
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isLoaded, onActiveChange])

  // Handle hand detection results
  const onHandsResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return

    const canvasCtx = canvasRef.current.getContext('2d')
    if (!canvasCtx) return

    // Clear canvas
    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    // Draw hand landmarks and connections
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      onHandState(`Hand detected (${results.multiHandLandmarks.length})`)
      
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections
        window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        })
        
        // Draw landmarks
        window.drawLandmarks(canvasCtx, landmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3
        })
      }
    } else {
      onHandState('No hand detected')
    }

    canvasCtx.restore()
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <div className="text-red-500 text-sm">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading MediaPipe...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="video-container mx-auto">
        <video
          ref={videoRef}
          width={640}
          height={480}
          autoPlay
          muted
          playsInline
          className="rounded-lg"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="video-overlay rounded-lg"
        />
        
        {/* Status indicators */}
        {!permissionGranted && (
          <div className="hand-status bg-yellow-600">
            Requesting camera access...
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${permissionGranted ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            Camera: {permissionGranted ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm text-gray-600">
            MediaPipe: {isLoaded ? 'Ready' : 'Loading'}
          </span>
        </div>
      </div>

      {/* Speech Capture Component */}
      {permissionGranted && (
        <SpeechCapture onTranscript={onTranscript} />
      )}

      {/* Technical Info */}
      <div className="text-xs text-gray-500 text-center mt-4">
        <div>Resolution: 640x480 | Max Hands: 1 | Detection Confidence: 70%</div>
        <div className="mt-1">
          Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : 'Other (may have limited features)'}
        </div>
      </div>
    </div>
  )
} 
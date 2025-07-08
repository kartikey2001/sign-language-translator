'use client'

import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import SpeechCapture from './SpeechCapture'
import { AdvancedGestureClassifier } from './gesture/AdvancedGestureClassifier'

// MediaPipe Types (using the one from AdvancedGestureClassifier)
interface AdvancedGestureResult {
  primaryGesture: string
  confidence: number
  secondaryClassification?: string
  confusionGroup?: string
  geometricFeatures: number[]
  stabilityScore: number
}

let handLandmarker: HandLandmarker | undefined = undefined
let lastVideoTime = -1

// --- Main Component ---
interface MediaCaptureProps {
  onTranscript: (text: string, isFinal: boolean) => void
  onHandState: (state: string) => void
  onActiveChange: (active: boolean) => void
  onGestureDetected?: (gestureData: AdvancedGestureResult) => void
}

export default function MediaCapture({ 
  onTranscript, 
  onHandState, 
  onActiveChange,
  onGestureDetected 
}: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string>('')
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [browserInfo, setBrowserInfo] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  
  // Advanced gesture classifier instance
  const gestureClassifierRef = useRef<AdvancedGestureClassifier>(new AdvancedGestureClassifier())
  
  // State stabilization for hand detection
  const handDetectionHistoryRef = useRef<boolean[]>([])
  const lastHandStateRef = useRef<string>('')
  const lastGestureRef = useRef<string>('')
  const frameCountRef = useRef<number>(0)

  // Store callbacks in refs to prevent useEffect re-runs
  const onHandStateRef = useRef(onHandState)
  const onActiveChangeRef = useRef(onActiveChange)
  const onGestureDetectedRef = useRef(onGestureDetected)

  // Update refs when props change
  useEffect(() => {
    onHandStateRef.current = onHandState
    onActiveChangeRef.current = onActiveChange
    onGestureDetectedRef.current = onGestureDetected
  }, [onHandState, onActiveChange, onGestureDetected])
  
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
        setBrowserInfo('Other ⚠️')
      }
    }
  }, [])
  
  // Initialize MediaPipe Hand Landmarker with enhanced configuration
  useEffect(() => {
    const createHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        )
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.7, // Increased for better quality
          minHandPresenceConfidence: 0.6,  // More sensitive to presence
          minTrackingConfidence: 0.7,      // Enhanced tracking
        })
        console.log('✅ Advanced HandLandmarker created successfully with enhanced config')
        setIsLoaded(true)
      } catch (e) {
        const error = e as Error
        console.error('❌ Error creating HandLandmarker:', error)
        // Try fallback URL
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
          )
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
              delegate: 'CPU', // Fallback to CPU
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.6,
          })
          console.log('✅ HandLandmarker created with fallback config')
          setIsLoaded(true)
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
          setError(`Failed to load MediaPipe models. Network issue or model unavailable. Error: ${error.message}`)
        }
      }
    }
    createHandLandmarker()
  }, [])

  // Enhanced webcam and rendering loop
  useEffect(() => {
    if (!isClient || !isLoaded || !videoRef.current || !canvasRef.current) return

    let animationFrameId: number
    const video = videoRef.current
    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    let drawingUtils: DrawingUtils | null = null
    if (canvasCtx) {
       drawingUtils = new DrawingUtils(canvasCtx)
    }

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640, min: 480 }, 
            height: { ideal: 480, min: 360 },
            frameRate: { ideal: 30, min: 15 } // Optimize for smooth processing
          }, 
          audio: true 
        })
        video.srcObject = stream
        
        // Wait for video to be fully loaded before starting prediction
        const onVideoReady = () => {
          console.log(`🎥 Video ready: ${video.videoWidth}x${video.videoHeight}`)
          
          // Sync canvas dimensions with actual video dimensions
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }
          
          video.removeEventListener('loadedmetadata', onVideoReady)
          video.removeEventListener('canplay', onVideoReady)
          predictWebcam()
        }
        
        video.addEventListener('loadedmetadata', onVideoReady)
        video.addEventListener('canplay', onVideoReady)
        
        setPermissionGranted(true)
        onActiveChangeRef.current(true)
      } catch (err) {
        const error = err as Error
        console.error('❌ Camera initialization failed:', error)
        setError(`Failed to access camera. Please grant permissions and refresh. Error: ${error.message}`)
        onActiveChangeRef.current(false)
      }
    }

    const predictWebcam = async () => {
      if (!video.srcObject || video.paused || !handLandmarker || !drawingUtils || !canvasCtx) {
        animationFrameId = requestAnimationFrame(predictWebcam)
        return
      }

      // Check if video has valid dimensions before processing
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(predictWebcam)
        return
      }

      if (video.currentTime !== lastVideoTime) {
        try {
          const results = handLandmarker.detectForVideo(video, Date.now())
          lastVideoTime = video.currentTime

          canvasCtx.save()
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

          const hasHands = results.landmarks && results.landmarks.length > 0
          frameCountRef.current++
          
          // Add current detection to history
          handDetectionHistoryRef.current.push(hasHands)
          
          // Keep only last 12 frames for stabilization (slightly reduced)
          if (handDetectionHistoryRef.current.length > 12) {
            handDetectionHistoryRef.current.shift()
          }
          
          // Update UI only every 12 frames to reduce flickering
          if (frameCountRef.current % 12 === 0) {
            // Calculate hand detection confidence over recent frames
            const recentDetections = handDetectionHistoryRef.current
            const detectionRatio = recentDetections.filter(Boolean).length / recentDetections.length
            
            let newHandState = ''
            if (detectionRatio > 0.75) {
              newHandState = `Hand detected (${hasHands ? results.landmarks!.length : 0}) - Quality: ${(detectionRatio * 100).toFixed(0)}%`
            } else if (detectionRatio > 0.4) {
              newHandState = 'Hand partially visible - Hold steady'
            } else {
              newHandState = 'No hand detected - Place hand in view'
            }
            
            // Only update state if it actually changed
            if (newHandState !== lastHandStateRef.current) {
              lastHandStateRef.current = newHandState
              onHandStateRef.current(newHandState)
            }
          }

          if (hasHands) {
            for (const landmarks of results.landmarks!) {
              // Enhanced drawing with better colors
              drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { 
                color: '#00FF7F', // Spring green
                lineWidth: 2 
              })
              drawingUtils.drawLandmarks(landmarks, { 
                color: '#FF4500', // Orange red  
                lineWidth: 1, 
                radius: 4 
              })
              
              // Advanced gesture detection using the new classifier
              const gestureResult = gestureClassifierRef.current.classifyGesture(landmarks)
              if (gestureResult && onGestureDetectedRef.current) {
                // Only update gesture if stability score is good and it's different
                if (gestureResult.primaryGesture !== lastGestureRef.current || frameCountRef.current % 8 === 0) {
                  lastGestureRef.current = gestureResult.primaryGesture
                  onGestureDetectedRef.current(gestureResult)
                  
                  // Log advanced classification details
                  console.log('🧠 Advanced Classification:', {
                    gesture: gestureResult.primaryGesture,
                    confidence: `${(gestureResult.confidence * 100).toFixed(1)}%`,
                    stability: `${(gestureResult.stabilityScore * 100).toFixed(1)}%`,
                    method: gestureResult.secondaryClassification,
                    group: gestureResult.confusionGroup
                  })
                }
              }
            }
          }
          canvasCtx.restore()
        } catch (error) {
          console.error('⚠️ MediaPipe detection error:', error)
          // Continue the loop even if one frame fails
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam)
    }

    startWebcam()

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
      // Clean up event listeners
      video.removeEventListener('loadedmetadata', () => {})
      video.removeEventListener('canplay', () => {})
      
      // Reset stabilization state
      handDetectionHistoryRef.current = []
      lastHandStateRef.current = ''
      lastGestureRef.current = ''
      frameCountRef.current = 0
    }
  }, [isClient, isLoaded])

  // --- JSX Rendering ---
  
  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-blue-700 font-medium mb-2">🧠 Loading Camera...</div>
          <div className="text-blue-600 text-sm">Initializing MediaPipe + AI Models</div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-lg font-semibold mb-2">⚠️ MediaPipe Error</div>
          <div className="text-red-500 text-sm mb-4">{error}</div>
          <div className="text-xs text-red-400 mb-4">
            This might be a temporary network issue or model availability problem.
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🔄 Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-blue-700 font-medium mb-2">🧠 Loading Advanced AI Models...</div>
          <div className="text-blue-600 text-sm">MediaPipe Hand Landmarker + Two-Layer Classifier</div>
          <div className="text-xs text-blue-500 mt-2">This may take a few moments...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Video Container */}
      <div className="video-container mx-auto relative">
        <video ref={videoRef} width={640} height={480} autoPlay muted playsInline className="rounded-lg shadow-lg" />
        <canvas ref={canvasRef} width={640} height={480} className="video-overlay rounded-lg" />
        {!permissionGranted && (
          <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center rounded-lg">
            <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium">
              📷 Requesting camera access...
            </div>
          </div>
        )}
        
        {/* Enhanced Quality Indicator */}
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          🎯 Enhanced ASL Recognition
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${permissionGranted ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">Camera: {permissionGranted ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isLoaded ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-sm text-gray-600">AI: {isLoaded ? 'Ready' : 'Loading'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
          <span className="text-sm text-gray-600">Mode: Two-Layer</span>
        </div>
      </div>

      {/* Speech Capture Component */}
      {permissionGranted && <SpeechCapture onTranscript={onTranscript} />}

      {/* Enhanced Technical Info */}
      <div className="text-xs text-gray-500 text-center mt-4 space-y-1">
        <div className="font-medium">🔬 Advanced Configuration:</div>
        <div>Resolution: 640x480 | Hands: 1 | Detection: 70% | Tracking: 70%</div>
        <div>Algorithm: Two-Layer Classification | Features: Geometric + Angular</div>
        <div className="mt-1">
          Browser: {browserInfo || 'Loading...'} | 
          GPU: {isLoaded ? 'Enabled' : 'Unknown'}
        </div>
      </div>
    </div>
  )
} 
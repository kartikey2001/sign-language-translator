'use client'

import { useEffect, useRef, useState } from 'react'
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import SpeechCapture from './SpeechCapture'

// MediaPipe Types
interface Landmark {
  x: number
  y: number
  z: number
}

interface GestureResult {
  gesture: string
  confidence: number
}

let handLandmarker: HandLandmarker | undefined = undefined
let lastVideoTime = -1

// --- Main Component ---
interface MediaCaptureProps {
  onTranscript: (text: string, isFinal: boolean) => void
  onHandState: (state: string) => void
  onActiveChange: (active: boolean) => void
  onGestureDetected?: (gesture: string, confidence: number) => void
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
  
  // State stabilization for hand detection
  const handDetectionHistoryRef = useRef<boolean[]>([])
  const lastHandStateRef = useRef<string>('')
  const lastGestureRef = useRef<string>('')
  const frameCountRef = useRef<number>(0)
  
  // Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    const createHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        )
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        console.log('HandLandmarker created successfully.')
        setIsLoaded(true)
      } catch (e) {
        const error = e as Error
        console.error('Error creating HandLandmarker:', error)
        setError(`Failed to load MediaPipe models. Please check your network or refresh. Error: ${error.message}`)
      }
    }
    createHandLandmarker()
  }, [])

  // Start webcam and rendering loop
  useEffect(() => {
    if (!isLoaded || !videoRef.current || !canvasRef.current) return

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
          video: { width: 640, height: 480 }, 
          audio: true 
        })
        video.srcObject = stream
        
        // Wait for video to be fully loaded before starting prediction
        const onVideoReady = () => {
          console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`)
          
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
        onActiveChange(true)
      } catch (err) {
        const error = err as Error
        console.error('Camera initialization failed:', error)
        setError(`Failed to access camera. Please grant permissions and refresh. Error: ${error.message}`)
        onActiveChange(false)
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
          
          // Keep only last 10 frames for stabilization
          if (handDetectionHistoryRef.current.length > 10) {
            handDetectionHistoryRef.current.shift()
          }
          
          // Update UI only every 15 frames to reduce flickering (more aggressive)
          if (frameCountRef.current % 15 === 0) {
            // Calculate hand detection confidence over last 10 frames
            const recentDetections = handDetectionHistoryRef.current
            const detectionRatio = recentDetections.filter(Boolean).length / recentDetections.length
            
                         let newHandState = ''
             if (detectionRatio > 0.8) {
               newHandState = `Hand detected (${hasHands ? results.landmarks!.length : 0})`
             } else if (detectionRatio > 0.4) {
               newHandState = 'Hand partially visible'
             } else {
               newHandState = 'No hand detected'
             }
            
            // Only update state if it actually changed
            if (newHandState !== lastHandStateRef.current) {
              lastHandStateRef.current = newHandState
              onHandState(newHandState)
            }
          }

          if (hasHands) {
            for (const landmarks of results.landmarks!) {
              // Draw landmarks
              drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 })
              drawingUtils.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 })
              
              // Gesture detection with stabilization
              const gestureResult = classifyGesture(landmarks)
              if (gestureResult) {
                // Only update gesture if it's different or every 10 frames
                if (gestureResult.gesture !== lastGestureRef.current || frameCountRef.current % 10 === 0) {
                  lastGestureRef.current = gestureResult.gesture
                  if (onGestureDetected) {
                    onGestureDetected(gestureResult.gesture, gestureResult.confidence)
                  }
                }
              }
            }
          }
          canvasCtx.restore()
        } catch (error) {
          console.error('MediaPipe detection error:', error)
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
  }, [isLoaded, onActiveChange, onGestureDetected, onHandState])

  // Simple gesture classification (remains the same)
  const classifyGesture = (landmarks: Landmark[]): GestureResult | null => {
    if (!landmarks || landmarks.length !== 21) return null
    const thumbUp = landmarks[4].y < landmarks[3].y
    const indexUp = landmarks[8].y < landmarks[6].y
    const middleUp = landmarks[12].y < landmarks[10].y
    const ringUp = landmarks[16].y < landmarks[14].y
    const pinkyUp = landmarks[20].y < landmarks[18].y

    if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbUp) return { gesture: 'A', confidence: 0.8 }
    if (!thumbUp && indexUp && middleUp && ringUp && pinkyUp) return { gesture: 'B', confidence: 0.8 }
    if (!thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) return { gesture: 'D', confidence: 0.8 }
    if (thumbUp && indexUp && !middleUp && !ringUp && !pinkyUp) return { gesture: 'L', confidence: 0.8 }
    if (thumbUp && !indexUp && !middleUp && !ringUp && pinkyUp) return { gesture: 'Y', confidence: 0.8 }
    if (thumbUp && indexUp && middleUp && ringUp && pinkyUp) return { gesture: 'Open Hand', confidence: 0.9 }
    return null
  }

  // --- JSX Rendering ---
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <div className="text-red-500 text-sm">{error}</div>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
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
          <div className="text-gray-600">Loading MediaPipe Models...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="video-container mx-auto">
        <video ref={videoRef} width={640} height={480} autoPlay muted playsInline className="rounded-lg" />
        <canvas ref={canvasRef} width={640} height={480} className="video-overlay rounded-lg" />
        {!permissionGranted && (
          <div className="hand-status bg-yellow-600">Requesting camera access...</div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${permissionGranted ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">Camera: {permissionGranted ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm text-gray-600">MediaPipe: {isLoaded ? 'Ready' : 'Loading'}</span>
        </div>
      </div>

      {/* Speech Capture Component */}
      {permissionGranted && <SpeechCapture onTranscript={onTranscript} />}

      {/* Technical Info */}
      <div className="text-xs text-gray-500 text-center mt-4">
        <div>Resolution: 640x480 | Max Hands: 1 | Detection Confidence: 70%</div>
        <div className="mt-1">Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : 'Other'}</div>
      </div>
    </div>
  )
} 
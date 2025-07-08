'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  Hand, 
  Brain, 
  Zap, 
  Activity,
  Settings,
  RotateCcw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

// === Types ===

interface Landmark {
  x: number
  y: number
  z: number
}

interface AdvancedFingerStates {
  thumbExtended: boolean
  thumbUp: boolean
  thumbCurled: boolean
  indexExtended: boolean
  indexCurled: boolean
  middleExtended: boolean
  middleCurled: boolean
  ringExtended: boolean
  ringCurled: boolean
  pinkyExtended: boolean
  pinkyCurled: boolean
  palmFacing: boolean
  handOrientation: 'left' | 'right' | 'unknown'
  fingerAngles: number[]
  fingerDistances: number[]
  handOpenness: number
  wristAngle: number
}

interface GestureData {
  gesture: string
  confidence: number
  stability: number
  method: string
  finger_states?: AdvancedFingerStates
  processing_time?: number
}

interface MediaCaptureGestureData {
  primaryGesture?: string
  gesture?: string
  confidence?: number
  stabilityScore?: number
  stability?: number
  method?: string
  processing_time_ms?: number
  landmarks?: Landmark[]
}

interface EnhancedGesturePanelProps {
  gestureData?: MediaCaptureGestureData
  onGestureHistory?: (history: GestureData[]) => void
  className?: string
}

// === Main Component ===

export default function EnhancedGesturePanel({ gestureData, onGestureHistory, className }: EnhancedGesturePanelProps) {
  // State management
  const [currentGesture, setCurrentGesture] = useState<GestureData | null>(null)
  const [gestureHistory, setGestureHistory] = useState<GestureData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [backendConnected, setBackendConnected] = useState(false)
  const [showAdvancedStats, setShowAdvancedStats] = useState(false)
  const [recognitionMethod, setRecognitionMethod] = useState<'frontend' | 'backend'>('frontend')
  
  // Performance tracking
  const [performanceStats, setPerformanceStats] = useState({
    totalRecognitions: 0,
    averageConfidence: 0,
    averageStability: 0,
    averageProcessingTime: 0,
    successRate: 0
  })
  
  // WebSocket connection for real-time backend communication
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  const BACKEND_URL = 'ws://localhost:8000'
  
  // === Backend Integration ===
  
  useEffect(() => {
    if (recognitionMethod === 'backend') {
      connectToBackend()
    } else {
      disconnectFromBackend()
    }
    
    return () => {
      disconnectFromBackend()
    }
  }, [recognitionMethod])
  
  const connectToBackend = () => {
    try {
      wsRef.current = new WebSocket(`${BACKEND_URL}/ws/real-time`)
      
      wsRef.current.onopen = () => {
        setBackendConnected(true)
        console.log('✅ Connected to SLT Backend')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'gesture_result') {
            const gestureData: GestureData = {
              gesture: message.data.gesture,
              confidence: message.data.confidence,
              stability: message.data.stability,
              method: `${message.data.method} (backend)`,
              finger_states: message.data.finger_states,
              processing_time: message.data.processing_time_ms || 0
            }
            
            setCurrentGesture(gestureData)
            updateGestureHistory(gestureData)
            setIsProcessing(false)
          }
        } catch (error) {
          console.error('WebSocket message parsing error:', error)
        }
      }
      
      wsRef.current.onclose = () => {
        setBackendConnected(false)
        console.log('❌ Disconnected from SLT Backend')
        
        // Auto-reconnect
        if (recognitionMethod === 'backend') {
          reconnectTimeoutRef.current = setTimeout(connectToBackend, 3000)
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setBackendConnected(false)
      }
      
    } catch (error) {
      console.error('Failed to connect to backend:', error)
      setBackendConnected(false)
    }
  }
  
  const disconnectFromBackend = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setBackendConnected(false)
  }
  
  const sendLandmarksToBackend = (landmarks: Landmark[]) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsProcessing(true)
      wsRef.current.send(JSON.stringify({
        type: 'gesture_landmarks',
        landmarks: landmarks
      }))
    }
  }
  
  // === Data Processing ===
  
  useEffect(() => {
    if (gestureData) {
      if (recognitionMethod === 'backend' && gestureData.landmarks) {
        // Send to backend for enhanced processing
        sendLandmarksToBackend(gestureData.landmarks)
      } else {
        // Use frontend data
        const frontendGestureData: GestureData = {
          gesture: gestureData.primaryGesture || gestureData.gesture || 'Unknown',
          confidence: gestureData.confidence || 0,
          stability: gestureData.stabilityScore || gestureData.stability || 0,
          method: gestureData.method || 'frontend_two_layer',
          processing_time: gestureData.processing_time_ms || 0
        }
        
        setCurrentGesture(frontendGestureData)
        updateGestureHistory(frontendGestureData)
      }
    }
  }, [gestureData, recognitionMethod])
  
  const updateGestureHistory = (newGesture: GestureData) => {
    setGestureHistory(prev => {
      const updated = [newGesture, ...prev.slice(0, 19)] // Keep last 20 gestures
      onGestureHistory?.(updated)
      
      // Update performance stats
      updatePerformanceStats(updated)
      
      return updated
    })
  }
  
  const updatePerformanceStats = (history: GestureData[]) => {
    if (history.length === 0) return
    
    const validGestures = history.filter(g => g.gesture !== 'Unknown' && g.gesture !== 'No Hand')
    const totalConfidence = history.reduce((sum, g) => sum + g.confidence, 0)
    const totalStability = history.reduce((sum, g) => sum + g.stability, 0)
    const totalProcessingTime = history.reduce((sum, g) => sum + (g.processing_time || 0), 0)
    
    setPerformanceStats({
      totalRecognitions: history.length,
      averageConfidence: totalConfidence / history.length,
      averageStability: totalStability / history.length,
      averageProcessingTime: totalProcessingTime / history.length,
      successRate: validGestures.length / history.length
    })
  }
  
  // === Render Helpers ===
  
  const getGestureStatusColor = (gesture?: string) => {
    if (!gesture || gesture === 'Unknown' || gesture === 'No Hand') return 'text-gray-500'
    if (currentGesture?.confidence && currentGesture.confidence > 0.8) return 'text-green-600'
    if (currentGesture?.confidence && currentGesture.confidence > 0.6) return 'text-yellow-600'
    return 'text-orange-600'
  }
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-500'
    if (confidence > 0.6) return 'bg-yellow-500'
    if (confidence > 0.4) return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  const getStabilityColor = (stability: number) => {
    if (stability > 0.85) return 'bg-green-500'
    if (stability > 0.7) return 'bg-yellow-500'
    return 'bg-orange-500'
  }
  
  const renderGestureDisplay = () => (
    <div className="text-center space-y-4">
      <div className="relative">
        <div className={`text-6xl font-bold ${getGestureStatusColor(currentGesture?.gesture)} transition-all duration-300`}>
          {currentGesture?.gesture || '•'}
        </div>
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin opacity-50"></div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <Badge variant={currentGesture?.gesture && currentGesture.gesture !== 'Unknown' ? 'default' : 'secondary'}>
          {currentGesture?.method || 'No Method'}
        </Badge>
        
        <Badge variant={backendConnected ? 'default' : 'outline'} className="gap-1">
          <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {recognitionMethod === 'backend' ? (backendConnected ? 'Backend' : 'Backend (Offline)') : 'Frontend'}
        </Badge>
      </div>
    </div>
  )
  
  const renderMetrics = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Confidence</span>
          <span className="font-medium">{((currentGesture?.confidence || 0) * 100).toFixed(1)}%</span>
        </div>
        <Progress 
          value={(currentGesture?.confidence || 0) * 100} 
          className="h-2"
          style={{ 
            '--progress-background': getConfidenceColor(currentGesture?.confidence || 0) 
          } as React.CSSProperties}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Stability</span>
          <span className="font-medium">{((currentGesture?.stability || 0) * 100).toFixed(1)}%</span>
        </div>
        <Progress 
          value={(currentGesture?.stability || 0) * 100} 
          className="h-2"
          style={{ 
            '--progress-background': getStabilityColor(currentGesture?.stability || 0) 
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
  
  const renderAdvancedStats = () => {
    if (!showAdvancedStats) return null
    
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-800">Performance Analytics</h4>
          <Button size="sm" variant="outline" onClick={() => setGestureHistory([])}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{performanceStats.totalRecognitions}</div>
            <div className="text-xs text-gray-600">Total Gestures</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(performanceStats.averageConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(performanceStats.averageStability * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Avg Stability</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {performanceStats.averageProcessingTime.toFixed(1)}ms
            </div>
            <div className="text-xs text-gray-600">Avg Time</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Success Rate</span>
            <span className="font-medium">{(performanceStats.successRate * 100).toFixed(1)}%</span>
          </div>
          <Progress value={performanceStats.successRate * 100} className="h-2" />
        </div>
      </div>
    )
  }
  
  const renderGestureHistory = () => {
    if (gestureHistory.length === 0) return null
    
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-800">Recent Gestures</h4>
        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
          {gestureHistory.slice(0, 15).map((gesture, index) => (
            <Badge 
              key={index}
              variant={gesture.gesture !== 'Unknown' && gesture.gesture !== 'No Hand' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {gesture.gesture}
            </Badge>
          ))}
        </div>
      </div>
    )
  }
  
  // === Main Render ===
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-blue-600" />
            Enhanced Gesture Recognition
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRecognitionMethod(recognitionMethod === 'frontend' ? 'backend' : 'frontend')}
            >
              <Zap className="w-4 h-4 mr-1" />
              {recognitionMethod === 'backend' ? 'Use Frontend' : 'Use Backend'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {recognitionMethod === 'backend' && (
          <div className="flex items-center gap-2 text-sm">
            {backendConnected ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Connected to SLT Backend</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-600">Backend connection failed, using frontend fallback</span>
              </>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Gesture Display */}
        {renderGestureDisplay()}
        
        <Separator />
        
        {/* Metrics */}
        {renderMetrics()}
        
        {/* Processing Info */}
        {currentGesture && (
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>Processing: {currentGesture.processing_time?.toFixed(1) || 0}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              <span>Method: {currentGesture.method}</span>
            </div>
          </div>
        )}
        
        <Separator />
        
        {/* Gesture History */}
        {renderGestureHistory()}
        
        {/* Advanced Stats */}
        {renderAdvancedStats()}
        
        {/* Algorithm Info */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t space-y-1">
          <div className="font-medium">
            {recognitionMethod === 'backend' ? 'SLT Framework + Two-Layer Classification' : 'Two-Layer Rule-Based Algorithm'}
          </div>
          <div>
            {recognitionMethod === 'backend' 
              ? 'Enhanced geometric features • Confusion group resolution • Real-time backend processing'
              : 'Geometric analysis • Finger state detection • Stability tracking'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
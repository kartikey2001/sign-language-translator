'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

// Import our components
import MediaCapture from '@/components/MediaCapture'
import SpeechCapture from '@/components/SpeechCapture'
import EnhancedGesturePanel from '@/components/gesture/EnhancedGesturePanel'
import SLTTranslationPanel from '@/components/translation/SLTTranslationPanel'

// Icons
import { 
  Camera, 
  Mic, 
  Hand, 
  Globe, 
  Activity,  
  Play, 
  Square,
  Wifi,
  WifiOff,
  Brain,
  Sparkles,
  BarChart3,
  Clock
} from 'lucide-react'

// === Types ===

interface DashboardState {
  isRecording: boolean
  cameraActive: boolean
  speechActive: boolean
  backendConnected: boolean
  currentGesture: string
  sessionStartTime: Date | null
  gesturesDetected: number
  speechTranscriptions: number
  translations: number
}

interface SessionStats {
  duration: number
  gesturesPerMinute: number
  accuracyRate: number
  totalInteractions: number
}

// === Main Dashboard Component ===

export default function SLTDashboard() {
  // State management
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isRecording: false,
    cameraActive: false,
    speechActive: false,
    backendConnected: false,
    currentGesture: '',
    sessionStartTime: null,
    gesturesDetected: 0,
    speechTranscriptions: 0,
    translations: 0
  })
  
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    duration: 0,
    gesturesPerMinute: 0,
    accuracyRate: 0,
    totalInteractions: 0
  })
  
  const [currentTab, setCurrentTab] = useState('capture')
  const [transcript, setTranscript] = useState('')
  const [handState, setHandState] = useState('Initializing...')
  const [gestureHistory, setGestureHistory] = useState<Array<{gesture: string, confidence: number}>>([])
  
  // WebSocket for backend communication
  const wsRef = useRef<WebSocket | null>(null)
  const sessionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // === Backend Connection ===
  
  useEffect(() => {
    connectToBackend()
    startSession()
    
    return () => {
      disconnectFromBackend()
      endSession()
    }
  }, [])
  
  const connectToBackend = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/real-time')
      
      wsRef.current.onopen = () => {
        setDashboardState(prev => ({ ...prev, backendConnected: true }))
        toast.success('🔗 Connected to SLT Backend')
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleBackendMessage(message)
        } catch (error) {
          console.error('WebSocket message error:', error)
        }
      }
      
      wsRef.current.onclose = () => {
        setDashboardState(prev => ({ ...prev, backendConnected: false }))
        toast.error('❌ Backend connection lost')
        
        // Auto-reconnect after 3 seconds
        setTimeout(connectToBackend, 3000)
      }
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setDashboardState(prev => ({ ...prev, backendConnected: false }))
      }
      
    } catch (error) {
      console.error('Failed to connect to backend:', error)
      setDashboardState(prev => ({ ...prev, backendConnected: false }))
    }
  }
  
  const disconnectFromBackend = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }
  
  const handleBackendMessage = (message: {type: string, data: Record<string, unknown>, message?: string}) => {
    switch (message.type) {
      case 'gesture_result':
        setDashboardState(prev => ({
          ...prev,
          currentGesture: message.data.gesture as string || '',
          gesturesDetected: prev.gesturesDetected + 1
        }))
        break
        
      case 'translation_result':
        setDashboardState(prev => ({
          ...prev,
          translations: prev.translations + 1
        }))
        toast.success(`✅ Translation: "${message.data.text}"`)
        break
        
      case 'error':
        toast.error(`❌ Backend Error: ${message.message}`)
        break
    }
  }
  
  // === Session Management ===
  
  const startSession = () => {
    const now = new Date()
    setDashboardState(prev => ({
      ...prev,
      sessionStartTime: now,
      isRecording: true
    }))
    
    // Update session stats every second
    sessionTimerRef.current = setInterval(updateSessionStats, 1000)
    
    toast.success('🎯 Session started')
  }
  
  const endSession = () => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
    }
    
    setDashboardState(prev => ({
      ...prev,
      isRecording: false,
      sessionStartTime: null
    }))
    
    toast.info('⏹️ Session ended')
  }
  
  const updateSessionStats = () => {
    setSessionStats(prev => {
      if (!dashboardState.sessionStartTime) return prev
      
      const duration = (Date.now() - dashboardState.sessionStartTime.getTime()) / 1000
      const gesturesPerMinute = duration > 0 ? (dashboardState.gesturesDetected / duration) * 60 : 0
      const totalInteractions = dashboardState.gesturesDetected + dashboardState.speechTranscriptions + dashboardState.translations
      
      return {
        duration,
        gesturesPerMinute,
        accuracyRate: gestureHistory.length > 0 ? 
          (gestureHistory.filter(g => g.gesture !== 'Unknown').length / gestureHistory.length) * 100 : 0,
        totalInteractions
      }
    })
  }
  
  // === Event Handlers - MEMOIZED to prevent camera flickering ===
  
  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    setTranscript(text)
    if (isFinal) {
      setDashboardState(prev => ({
        ...prev,
        speechTranscriptions: prev.speechTranscriptions + 1
      }))
    }
  }, [])
  
  const handleHandState = useCallback((state: string) => {
    setHandState(state)
  }, [])
  
  const handleActiveChange = useCallback((active: boolean) => {
    setDashboardState(prev => ({
      ...prev,
      cameraActive: active
    }))
  }, [])
  
  const handleGestureDetected = useCallback(() => {
    // This is handled by the EnhancedGesturePanel component
  }, [])
  
  const handleGestureHistory = useCallback((history: Array<{gesture: string, confidence: number}>) => {
    setGestureHistory(history)
  }, [])
  
  const handleTranslationComplete = useCallback((result: {format: string}) => {
    toast.success(`✅ Translation completed: ${result.format}`)
  }, [])
  
  // === Render Helpers ===
  
  const renderHeader = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            Sign Language Translator
            <Badge variant="secondary" className="ml-2">
              SLT Framework
            </Badge>
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time sign language recognition and translation powered by AI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={dashboardState.backendConnected ? "default" : "destructive"} className="gap-2">
            {dashboardState.backendConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {dashboardState.backendConnected ? 'Connected' : 'Offline'}
          </Badge>
          
          <Button
            variant={dashboardState.isRecording ? "destructive" : "default"}
            onClick={dashboardState.isRecording ? endSession : startSession}
            className="gap-2"
          >
            {dashboardState.isRecording ? (
              <>
                <Square className="w-4 h-4" />
                Stop Session
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Session
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Session Stats Bar */}
      {dashboardState.sessionStartTime && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(sessionStats.duration / 60)}:{(sessionStats.duration % 60).toFixed(0).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">Session Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{dashboardState.gesturesDetected}</div>
              <div className="text-sm text-gray-600">Gestures</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{dashboardState.translations}</div>
              <div className="text-sm text-gray-600">Translations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{sessionStats.accuracyRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  
  const renderSystemStatus = () => (
    <div className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${dashboardState.cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm">Camera: {dashboardState.cameraActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${dashboardState.backendConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm">Backend: {dashboardState.backendConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${dashboardState.isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm">Session: {dashboardState.isRecording ? 'Recording' : 'Stopped'}</span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-sm text-gray-600">
            <div>Current Gesture: <Badge variant="outline">{dashboardState.currentGesture || 'None'}</Badge></div>
            <div className="mt-2">Hand State: {handState}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  // === Main Render ===
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {renderHeader()}
        
        {/* System Status */}
        {renderSystemStatus()}
        
        {/* Main Content */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="capture" className="gap-2">
              <Camera className="w-4 h-4" />
              Capture
            </TabsTrigger>
            <TabsTrigger value="recognition" className="gap-2">
              <Hand className="w-4 h-4" />
              Recognition
            </TabsTrigger>
            <TabsTrigger value="translation" className="gap-2">
              <Globe className="w-4 h-4" />
              Translation
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          {/* Capture Tab */}
          <TabsContent value="capture" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Capture */}
              <div>
                <MediaCapture
                  onTranscript={handleTranscript}
                  onHandState={handleHandState}
                  onActiveChange={handleActiveChange}
                  onGestureDetected={handleGestureDetected}
                />
              </div>
              
              {/* Speech Capture */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="w-5 h-5 text-green-600" />
                      Speech Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SpeechCapture onTranscript={handleTranscript} />
                    
                    {transcript && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Latest Transcript:</div>
                        <div className="text-gray-900">{transcript}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Recognition Tab */}
          <TabsContent value="recognition" className="space-y-6">
            <EnhancedGesturePanel
              gestureData={undefined}
              onGestureHistory={handleGestureHistory}
              className="w-full"
            />
          </TabsContent>
          
          {/* Translation Tab */}
          <TabsContent value="translation" className="space-y-6">
            <SLTTranslationPanel
              onTranslationComplete={handleTranslationComplete}
              className="w-full"
            />
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Session Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Session Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="font-medium">
                        {Math.floor(sessionStats.duration / 60)}m {(sessionStats.duration % 60).toFixed(0)}s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gestures/min</span>
                      <span className="font-medium">{sessionStats.gesturesPerMinute.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accuracy</span>
                      <span className="font-medium">{sessionStats.accuracyRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <Progress value={sessionStats.accuracyRate} className="h-2" />
                </CardContent>
              </Card>
              
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{dashboardState.gesturesDetected}</div>
                      <div className="text-xs text-gray-600">Gestures</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{dashboardState.speechTranscriptions}</div>
                      <div className="text-xs text-gray-600">Speech</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{dashboardState.translations}</div>
                    <div className="text-xs text-gray-600">Translations</div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gestureHistory.slice(0, 8).map((gesture, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <Badge variant="outline" className="text-xs">
                          {gesture.gesture}
                        </Badge>
                        <span className="text-gray-500">
                          {(gesture.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                    
                    {gestureHistory.length === 0 && (
                      <div className="text-center text-gray-500 text-sm py-4">
                        No recent activity
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Brain className="w-4 h-4" />
            <span className="font-medium">Powered by Sign Language Translator Framework</span>
          </div>
          <div>
            Real-time ASL recognition • Multi-language support • AI-powered translation
          </div>
        </div>
      </div>
    </div>
  )
} 
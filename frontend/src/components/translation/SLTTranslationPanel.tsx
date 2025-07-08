'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Brain, 
  Globe, 
  Video, 
  Hand, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  RotateCcw,
  Download,
  Play
} from 'lucide-react'

// === Types ===

interface TranslationData {
  video_path?: string
  landmarks?: Array<{x: number, y: number, z: number}>
  [key: string]: unknown
}

interface TranslationResult {
  success: boolean
  format: 'video' | 'landmarks'
  data: TranslationData
  text: string
  language: string
  confidence?: number
  processing_time_ms?: number
}

interface SentenceAnalysis {
  text: string
  language: string
  word_count: number
  unique_words: number
  complexity_score: number
  translatable: boolean
  supported_formats: string[]
  estimated_confidence: number
  processing_time: number
}

interface SupportedLanguages {
  text_languages: string[]
  sign_languages: string[]
  [key: string]: unknown
}

interface SLTTranslationPanelProps {
  onTranslationComplete?: (result: TranslationResult) => void
  className?: string
}

// === Main Component ===

export default function SLTTranslationPanel({ onTranslationComplete, className }: SLTTranslationPanelProps) {
  // State management
  const [inputText, setInputText] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('english')
  const [outputFormat, setOutputFormat] = useState<'video' | 'landmarks'>('landmarks')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null)
  const [sentenceAnalysis, setSentenceAnalysis] = useState<SentenceAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading')
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguages | null>(null)
  
  // Refs
  const analysisTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Backend URL
  const BACKEND_URL = 'http://localhost:8000'
  
  // === Backend Communication ===
  
  useEffect(() => {
    checkBackendStatus()
    fetchSupportedLanguages()
  }, [])
  
  // Real-time analysis as user types
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current)
    }
    
    if (inputText.trim().length > 2) {
      analysisTimeoutRef.current = setTimeout(() => {
        analyzeSentence()
      }, 800) // Debounce analysis
    } else {
      setSentenceAnalysis(null)
    }
    
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [inputText, selectedLanguage])
  
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`)
      const data = await response.json()
      
      if (data.status === 'healthy') {
        setBackendStatus('connected')
        toast.success('🔗 Connected to SLT Backend')
      } else {
        setBackendStatus('disconnected')
        toast.error('⚠️ Backend not ready')
      }
    } catch (error) {
      setBackendStatus('disconnected')
      console.error('Backend connection failed:', error)
    }
  }
  
  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/languages/supported`)
      const data = await response.json()
      setSupportedLanguages(data)
    } catch (error) {
      console.error('Failed to fetch supported languages:', error)
    }
  }
  
  const analyzeSentence = async () => {
    if (!inputText.trim()) return
    
    setIsAnalyzing(true)
    try {
      const response = await fetch(`${BACKEND_URL}/analyze/sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          language: selectedLanguage
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setSentenceAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const translateText = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to translate')
      return
    }
    
    setIsTranslating(true)
    setTranslationResult(null)
    
    try {
      const response = await fetch(`${BACKEND_URL}/translate/text-to-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          language: selectedLanguage,
          format: outputFormat
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTranslationResult(data)
        onTranslationComplete?.(data)
        toast.success(`✅ Translation completed in ${outputFormat} format`)
      } else {
        toast.error(`❌ Translation failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Translation failed:', error)
      toast.error('❌ Translation request failed')
    } finally {
      setIsTranslating(false)
    }
  }
  
  // === Render Helpers ===
  
  const renderSentenceAnalysis = () => {
    if (!sentenceAnalysis) return null
    
    return (
      <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-blue-800">Sentence Analysis</h4>
          {isAnalyzing && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{sentenceAnalysis.word_count}</div>
            <div className="text-sm text-gray-600">Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{sentenceAnalysis.unique_words}</div>
            <div className="text-sm text-gray-600">Unique</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(sentenceAnalysis.complexity_score * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Complexity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {(sentenceAnalysis.estimated_confidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Confidence</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={sentenceAnalysis.translatable ? "default" : "destructive"}>
            {sentenceAnalysis.translatable ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Translatable
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Complex Text
              </>
            )}
          </Badge>
          
          <Badge variant="outline">
            <Globe className="w-3 h-3 mr-1" />
            {sentenceAnalysis.language}
          </Badge>
          
          <Badge variant="secondary">
            {sentenceAnalysis.supported_formats.join(', ')}
          </Badge>
        </div>
        
        {sentenceAnalysis.complexity_score > 0.7 && (
          <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                Complex sentence detected. Consider breaking into shorter phrases for better translation.
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  const renderTranslationResult = () => {
    if (!translationResult) return null
    
    return (
      <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-green-800">Translation Result</h4>
          </div>
          
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            {translationResult.format.toUpperCase()}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Original Text</label>
            <div className="p-2 bg-white rounded border text-sm">
              &quot;{translationResult.text}&quot;
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Target Language</label>
            <div className="p-2 bg-white rounded border text-sm">
              {translationResult.language}
            </div>
          </div>
        </div>
        
        {translationResult.format === 'video' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Generated Video</label>
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
              {translationResult.data?.video_path ? (
                <video 
                  ref={videoRef}
                  className="w-full h-full rounded-lg"
                  controls
                  poster="/api/placeholder/640/360"
                >
                  <source src={`${BACKEND_URL}/files/video/${translationResult.data.video_path}`} type="video/mp4" />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="text-white text-center">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div>Video processing...</div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Play className="w-4 h-4 mr-1" />
                Play
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}
        
        {translationResult.format === 'landmarks' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Generated Landmarks</label>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded">
                <div className="text-center">
                  <Hand className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    Landmarks: {typeof translationResult.data === 'object' ? 'Generated' : 'Processing...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Processing time: {translationResult.processing_time_ms || 0}ms</span>
          <span>Confidence: {translationResult.confidence ? `${(translationResult.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
        </div>
      </div>
    )
  }
  
  // === Main Render ===
  
  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            SLT Framework Translation
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={backendStatus === 'connected' ? "default" : backendStatus === 'loading' ? "secondary" : "destructive"}
              className="gap-1"
            >
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                backendStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`} />
              {backendStatus === 'connected' ? 'Connected' : 
               backendStatus === 'loading' ? 'Connecting...' : 'Disconnected'}
            </Badge>
            
            <Button size="sm" variant="outline" onClick={checkBackendStatus}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Input Language</label>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 border rounded-lg"
                disabled={!supportedLanguages}
              >
                {supportedLanguages?.text_languages?.map((lang: string) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                )) || <option value="english">English</option>}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Output Format</label>
              <Tabs value={outputFormat} onValueChange={(value: string) => setOutputFormat(value as 'video' | 'landmarks')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="landmarks" className="flex items-center gap-2">
                    <Hand className="w-4 h-4" />
                    Landmarks
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Video
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Text to Translate</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to translate to sign language..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
              disabled={backendStatus !== 'connected'}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{inputText.length} characters</span>
              <span>{inputText.trim().split(/\s+/).filter(word => word).length} words</span>
            </div>
          </div>
          
          <Button 
            onClick={translateText}
            disabled={!inputText.trim() || isTranslating || backendStatus !== 'connected'}
            className="w-full"
            size="lg"
          >
            {isTranslating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Translating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Translate to Sign Language
              </>
            )}
          </Button>
        </div>
        
        <Separator />
        
        {/* Analysis Section */}
        {renderSentenceAnalysis()}
        
        {sentenceAnalysis && translationResult && <Separator />}
        
        {/* Result Section */}
        {renderTranslationResult()}
        
        {/* Framework Info */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe className="w-4 h-4" />
            <span className="font-medium">Powered by Sign Language Translator Framework</span>
          </div>
          <div>
            Real-time translation • Multi-language support • Video & Landmark generation
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
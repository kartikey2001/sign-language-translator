import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface TranslationPanelProps {
  speechText: string
}

export default function TranslationPanel({ speechText }: TranslationPanelProps) {
  const [translatedText, setTranslatedText] = useState<string>('')
  const [isTranslating, setIsTranslating] = useState<boolean>(false)

  const handleTranslate = async () => {
    if (!speechText.trim()) {
      toast.error("No speech text to translate")
      return
    }
    
    setIsTranslating(true)
    try {
      // Using free Google Translate endpoint for demo
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(speechText)}`
      )
      const data = await response.json()
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        setTranslatedText(data[0][0][0])
        toast.success("Translation completed!")
      } else {
        setTranslatedText('Translation failed')
        toast.error("Translation failed")
      }
    } catch (error) {
      console.error('Translation error:', error)
      setTranslatedText('Translation service unavailable')
      toast.error("Translation service unavailable")
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">🌐 Translation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Original Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Original (English)
            </label>
            <div className="min-h-[100px] p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-800">
                {speechText || 'Start speaking to see transcription...'}
              </p>
            </div>
          </div>
          
          {/* Translated Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Translation (Spanish)
            </label>
            <div className="min-h-[100px] p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                {translatedText || 'Translation will appear here...'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Translation Button */}
        <div className="text-center">
          <Button
            onClick={handleTranslate}
            disabled={!speechText.trim() || isTranslating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTranslating ? 'Translating...' : '🔄 Translate to Spanish'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
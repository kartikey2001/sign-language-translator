import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SpeechPanelProps {
  speechText: string
}

export default function SpeechPanel({ speechText }: SpeechPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Speech Recognition</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg min-h-[120px]">
          <div className="text-sm text-blue-800">
            {speechText || 'Listening for speech...'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import MediaCapture from "../MediaCapture"

interface AdvancedGestureData {
  primaryGesture: string
  confidence: number
  secondaryClassification?: string
  confusionGroup?: string
  geometricFeatures: number[]
  stabilityScore: number
}

interface VideoFeedPanelProps {
  onTranscript: (text: string, isFinal: boolean) => void
  onHandState: (state: string) => void
  onActiveChange: (active: boolean) => void
  onGestureDetected?: (gestureData: AdvancedGestureData) => void
}

export default function VideoFeedPanel({
  onTranscript,
  onHandState,
  onActiveChange,
  onGestureDetected
}: VideoFeedPanelProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl">Camera Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <MediaCapture 
          onTranscript={onTranscript}
          onHandState={onHandState}
          onActiveChange={onActiveChange}
          onGestureDetected={onGestureDetected}
        />
      </CardContent>
    </Card>
  )
} 
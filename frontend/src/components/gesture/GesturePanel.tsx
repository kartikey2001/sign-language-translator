import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface GesturePanelProps {
  detectedGesture: string
  gestureConfidence: number
  handState: string
}

export default function GesturePanel({ 
  detectedGesture, 
  gestureConfidence, 
  handState 
}: GesturePanelProps) {
  const isHandDetected = handState.includes('detected')
  const confidencePercentage = Math.round(gestureConfidence * 100)
  
  return (
    <div className="space-y-4">
      {/* Hand Detection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Hand Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${
            isHandDetected 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`text-sm font-medium ${
              isHandDetected ? 'text-green-800' : 'text-gray-600'
            }`}>
              {handState}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gesture Recognition */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-purple-800">
            🤟 Gesture Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Detected:</span>
              <Badge 
                variant={detectedGesture && detectedGesture !== 'Unknown' ? 'default' : 'secondary'}
                className={`font-mono ${
                  detectedGesture && detectedGesture !== 'Unknown' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : ''
                }`}
              >
                {detectedGesture || 'None'}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <span className="text-sm font-mono text-purple-600">
                  {confidencePercentage}%
                </span>
              </div>
              <Progress 
                value={confidencePercentage} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
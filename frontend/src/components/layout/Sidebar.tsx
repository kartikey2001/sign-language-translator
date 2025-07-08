import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface SidebarProps {
  isActive: boolean
  handState: string
  detectedGesture: string
  gestureConfidence: number
}

export default function Sidebar({ 
  isActive, 
  handState, 
  detectedGesture, 
  gestureConfidence 
}: SidebarProps) {
  const confidencePercentage = Math.round(gestureConfidence * 100)
  
  return (
    <div className="space-y-4">
      {/* Quick Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">System:</span>
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className={`text-xs ${
                isActive 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Hand:</span>
            <Badge 
              variant="outline"
              className={`text-xs ${
                handState.includes('detected') 
                  ? 'border-green-200 text-green-700' 
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {handState.includes('detected') ? 'Detected' : 'None'}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Gesture:</span>
            <Badge 
              variant={detectedGesture && detectedGesture !== 'Unknown' ? 'default' : 'secondary'}
              className="text-xs font-mono"
            >
              {detectedGesture || 'None'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Confidence:</span>
            <span className="text-xs font-mono text-purple-600">
              {confidencePercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recognition Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs text-gray-600">
            <div>✅ MediaPipe: Ready</div>
            <div>✅ Speech API: Active</div>
            <div>✅ Camera: Connected</div>
            <div>✅ Microphone: Active</div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Supported Gestures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <Badge variant="outline" className="justify-center">A</Badge>
            <Badge variant="outline" className="justify-center">B</Badge>
            <Badge variant="outline" className="justify-center">C</Badge>
            <Badge variant="outline" className="justify-center">D</Badge>
            <Badge variant="outline" className="justify-center">E</Badge>
            <Badge variant="outline" className="justify-center">L</Badge>
            <Badge variant="outline" className="justify-center">O</Badge>
            <Badge variant="outline" className="justify-center">S</Badge>
            <Badge variant="outline" className="justify-center">Y</Badge>
            <Badge variant="outline" className="justify-center">Z</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
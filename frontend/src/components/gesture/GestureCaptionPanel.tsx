import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface GestureCaptionPanelProps {
  gestureCaption: string
  onClear: () => void
}

export default function GestureCaptionPanel({ 
  gestureCaption, 
  onClear 
}: GestureCaptionPanelProps) {
  const handleClear = () => {
    onClear()
    toast.success("Gesture caption cleared")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">🤟 Sign Language Caption</CardTitle>
          <Button
            onClick={handleClear}
            disabled={!gestureCaption}
            variant="destructive"
            size="sm"
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="min-h-[80px] p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <p className="text-lg text-purple-800 font-mono leading-relaxed">
            {gestureCaption || 'Sign language letters will appear here as you gesture...'}
          </p>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>💡 Tip: Hold each gesture clearly for 2+ seconds to add it to the caption</p>
        </div>
      </CardContent>
    </Card>
  )
} 
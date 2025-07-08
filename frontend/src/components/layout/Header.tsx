import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function Header() {
  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-800">
          🤟 Sign Language Translator
        </h1>
        <p className="text-lg text-gray-600">
          Real-time sign language detection with speech translation for accessibility
        </p>
      </div>
      
      <div className="flex justify-center items-center space-x-2">
        <Badge variant="secondary">📱 Google Meets Integration Ready</Badge>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant="secondary">🚀 Hackathon Project</Badge>
        <Separator orientation="vertical" className="h-4" />
        <Badge variant="secondary">⚡ Real-time Processing</Badge>
      </div>
    </div>
  )
} 
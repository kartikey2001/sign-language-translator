import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface SystemStatusProps {
  isActive: boolean
  handState: string
}

export default function SystemStatus({ isActive, handState }: SystemStatusProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className={`${
                isActive 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isActive ? 'bg-white' : 'bg-gray-300'
              }`} />
              {isActive ? 'SYSTEM ACTIVE' : 'SYSTEM INACTIVE'}
            </Badge>
            
            <div className="text-sm text-gray-600">
              Hand Detection: <span className="font-mono">{handState}</span>
            </div>
          </div>
          
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            🏆 Built with Bolt.new
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
} 
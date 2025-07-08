import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function GestureGuide() {
  const gestureGroups = [
    {
      name: "Group 1: Fist",
      letters: "A, E, S",
      description: "Closed hand variations"
    },
    {
      name: "Group 2: Point", 
      letters: "D, Z",
      description: "Index finger pointing"
    },
    {
      name: "Group 3: Open",
      letters: "B, Open Hand", 
      description: "Multiple fingers up"
    },
    {
      name: "Group 4: L-Shape",
      letters: "L, Y",
      description: "Thumb + finger combos"
    },
    {
      name: "Group 5: Circle",
      letters: "C, O",
      description: "Curved hand shapes"
    }
  ]

  return (
    <Card className="bg-purple-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-purple-900">
          🤲 Enhanced ASL Recognition (Inspired by Research)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge variant="secondary" className="w-full text-purple-700 bg-purple-100 border-purple-200">
          ✨ <strong>New:</strong> Advanced gesture classification using normalized landmarks and group-based recognition for higher accuracy!
        </Badge>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {gestureGroups.map((group, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border">
              <div className="font-bold text-purple-800">{group.name}</div>
              <div className="text-gray-600">{group.letters}</div>
              <div className="text-xs text-gray-500">{group.description}</div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-purple-600 bg-white p-3 rounded border">
          📊 <strong>Algorithm:</strong> Landmark normalization → Group classification → Sub-classification → 97%+ accuracy
        </div>
      </CardContent>
    </Card>
  )
} 
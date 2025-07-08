import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function InstructionsPanel() {
  const instructions = [
    "Allow camera and microphone access",
    "Position your hand in front of the camera",
    "Try ASL letters: A, B, D, L, Y",
    "Speak clearly for voice recognition",
    "Green landmarks show detected gestures"
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Instructions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-sm text-gray-600 space-y-2">
          {instructions.map((instruction, index) => (
            <li key={index}>• {instruction}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
} 
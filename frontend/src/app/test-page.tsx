'use client'

import EnhancedGestureGuide from '@/components/gesture/EnhancedGestureGuide'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Test Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧠 Enhanced ASL Recognition Guide
          </h1>
          <p className="text-lg text-gray-600">
            Testing the advanced two-layer gesture classification system
          </p>
        </div>

        {/* Enhanced Gesture Guide */}
        <EnhancedGestureGuide />
      </div>
    </div>
  )
} 
'use client'

import { useRef } from 'react'

// Advanced Types for Enhanced Classification
interface Landmark {
  x: number
  y: number
  z: number
}

interface AdvancedFingerStates {
  // Basic finger positions
  thumbExtended: boolean
  thumbUp: boolean
  thumbCurled: boolean
  indexExtended: boolean
  indexCurled: boolean
  middleExtended: boolean
  middleCurled: boolean
  ringExtended: boolean
  ringCurled: boolean
  pinkyExtended: boolean
  pinkyCurled: boolean
  
  // Advanced geometric features
  palmFacing: boolean
  handOrientation: 'left' | 'right' | 'unknown'
  fingerAngles: number[]
  fingerDistances: number[]
  handOpenness: number
  wristAngle: number
}

interface GestureClassificationResult {
  primaryGesture: string
  confidence: number
  secondaryClassification?: string
  confusionGroup?: string
  geometricFeatures: number[]
  stabilityScore: number
}

// Confusion Groups based on the repository's findings
const CONFUSION_GROUPS = {
  group1: ['D', 'R', 'U'], // Similar pointing gestures
  group2: ['T', 'K', 'D', 'I'], // Similar thumb-index combinations
  group3: ['S', 'M', 'N'], // Similar fist variations
  group4: ['C', 'O'], // Similar curved shapes
  group5: ['B', 'F'], // Similar four-finger gestures
  group6: ['P', 'Q'], // Similar downward gestures
  group7: ['V', 'W'], // Similar two/three finger gestures
  group8: ['G', 'H'], // Similar horizontal gestures
}

export class AdvancedGestureClassifier {
  private gestureHistory: string[] = []
  private confidenceHistory: number[] = []
  private stabilityThreshold = 0.85
  private historySize = 15

  // Primary classification inspired by the CNN approach
  classifyGesture(landmarks: Landmark[]): GestureClassificationResult | null {
    if (!landmarks || landmarks.length !== 21) return null

    // Step 1: Normalize and extract geometric features
    const normalizedLandmarks = this.normalizeLandmarks(landmarks)
    const geometricFeatures = this.extractGeometricFeatures(normalizedLandmarks)
    const fingerStates = this.calculateAdvancedFingerStates(normalizedLandmarks)
    
    // Step 2: Primary classification (Layer 1)
    const primaryResult = this.primaryClassification(fingerStates, geometricFeatures)
    
    // Step 3: Secondary classification for confusion groups (Layer 2)
    let finalResult = primaryResult
    if (primaryResult && this.isInConfusionGroup(primaryResult.primaryGesture)) {
      const secondaryResult = this.secondaryClassification(
        primaryResult.primaryGesture,
        fingerStates,
        geometricFeatures
      )
      if (secondaryResult) {
        finalResult = {
          ...primaryResult,
          primaryGesture: secondaryResult.gesture,
          confidence: (primaryResult.confidence + secondaryResult.confidence) / 2,
          secondaryClassification: secondaryResult.method,
          confusionGroup: secondaryResult.group
        }
      }
    }

    // Step 4: Stability analysis
    if (finalResult) {
      const stabilityScore = this.calculateStabilityScore(finalResult.primaryGesture, finalResult.confidence)
      finalResult.stabilityScore = stabilityScore
      
      // Only return if stability is above threshold
      if (stabilityScore > this.stabilityThreshold) {
        return finalResult
      }
    }

    return null
  }

  // Advanced landmark normalization
  private normalizeLandmarks(landmarks: Landmark[]): Landmark[] {
    const wrist = landmarks[0]
    
    // Calculate bounding box for scale normalization
    let minX = wrist.x, maxX = wrist.x, minY = wrist.y, maxY = wrist.y
    landmarks.forEach(point => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })
    
    const scaleX = maxX - minX
    const scaleY = maxY - minY
    const scale = Math.max(scaleX, scaleY) || 1

    return landmarks.map(point => ({
      x: (point.x - wrist.x) / scale,
      y: (point.y - wrist.y) / scale,
      z: (point.z - wrist.z) / scale
    }))
  }

  // Extract geometric features inspired by CNN feature extraction
  private extractGeometricFeatures(landmarks: Landmark[]): number[] {
    const features: number[] = []
    
    // Finger tip distances from palm center
    const palmCenter = landmarks[0] // Wrist as reference
    const fingerTips = [4, 8, 12, 16, 20] // Thumb, Index, Middle, Ring, Pinky tips
    
    fingerTips.forEach(tipIndex => {
      const tip = landmarks[tipIndex]
      const distance = Math.sqrt(
        Math.pow(tip.x - palmCenter.x, 2) + 
        Math.pow(tip.y - palmCenter.y, 2) + 
        Math.pow(tip.z - palmCenter.z, 2)
      )
      features.push(distance)
    })

    // Finger angles relative to palm
    const fingerBases = [1, 5, 9, 13, 17] // Finger base joints
    fingerTips.forEach((tipIndex, i) => {
      const base = landmarks[fingerBases[i]]
      const tip = landmarks[tipIndex]
      const angle = Math.atan2(tip.y - base.y, tip.x - base.x)
      features.push(angle)
    })

    // Inter-finger distances
    for (let i = 0; i < fingerTips.length - 1; i++) {
      const tip1 = landmarks[fingerTips[i]]
      const tip2 = landmarks[fingerTips[i + 1]]
      const distance = Math.sqrt(
        Math.pow(tip2.x - tip1.x, 2) + 
        Math.pow(tip2.y - tip1.y, 2)
      )
      features.push(distance)
    }

    // Hand curvature (palm curvature estimation)
    const knuckles = [2, 5, 9, 13, 17] // MCP joints
    let curvature = 0
    for (let i = 1; i < knuckles.length - 1; i++) {
      const p1 = landmarks[knuckles[i - 1]]
      const p2 = landmarks[knuckles[i]]
      const p3 = landmarks[knuckles[i + 1]]
      
      // Calculate angle between three points
      const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x)
      curvature += Math.abs(angle2 - angle1)
    }
    features.push(curvature)

    return features
  }

  // Enhanced finger state calculation with more precision
  private calculateAdvancedFingerStates(landmarks: Landmark[]): AdvancedFingerStates {
    // Calculate finger angles and distances
    const fingerAngles = this.calculateFingerAngles(landmarks)
    const fingerDistances = this.calculateFingerDistances(landmarks)
    
    return {
      // Basic finger extension (improved thresholds)
      thumbExtended: landmarks[4].x > landmarks[3].x + 0.015,
      thumbUp: landmarks[4].y < landmarks[3].y - 0.01,
      thumbCurled: landmarks[4].y > landmarks[3].y + 0.015,
      
      indexExtended: landmarks[8].y < landmarks[6].y - 0.015,
      indexCurled: landmarks[8].y > landmarks[6].y + 0.015,
      
      middleExtended: landmarks[12].y < landmarks[10].y - 0.015,
      middleCurled: landmarks[12].y > landmarks[10].y + 0.015,
      
      ringExtended: landmarks[16].y < landmarks[14].y - 0.015,
      ringCurled: landmarks[16].y > landmarks[14].y + 0.015,
      
      pinkyExtended: landmarks[20].y < landmarks[18].y - 0.015,
      pinkyCurled: landmarks[20].y > landmarks[18].y + 0.015,
      
      // Advanced features
      palmFacing: landmarks[9].z > landmarks[0].z + 0.01,
      handOrientation: this.calculateHandOrientation(landmarks),
      fingerAngles,
      fingerDistances,
      handOpenness: this.calculateHandOpenness(landmarks),
      wristAngle: this.calculateWristAngle(landmarks)
    }
  }

  // Primary classification using rule-based approach enhanced with geometric features
  private primaryClassification(
    fingerStates: AdvancedFingerStates, 
    geometricFeatures: number[]
  ): GestureClassificationResult | null {
    
    // A: Closed fist with thumb on side
    if (!fingerStates.indexExtended && !fingerStates.middleExtended && 
        !fingerStates.ringExtended && !fingerStates.pinkyExtended &&
        fingerStates.thumbExtended && fingerStates.handOpenness < 0.3) {
      return {
        primaryGesture: 'A',
        confidence: 0.92,
        geometricFeatures,
        stabilityScore: 0
      }
    }

    // B: Four fingers up, thumb tucked
    if (fingerStates.indexExtended && fingerStates.middleExtended &&
        fingerStates.ringExtended && fingerStates.pinkyExtended &&
        !fingerStates.thumbExtended && fingerStates.handOpenness > 0.7) {
      return {
        primaryGesture: 'B',
        confidence: 0.90,
        geometricFeatures,
        stabilityScore: 0
      }
    }

    // C: Curved hand shape
    if (fingerStates.thumbUp && fingerStates.indexCurled && 
        fingerStates.handOpenness > 0.4 && fingerStates.handOpenness < 0.8) {
      const curvature = geometricFeatures[geometricFeatures.length - 1]
      if (curvature > 0.5) {
        return {
          primaryGesture: 'C',
          confidence: 0.88,
          geometricFeatures,
          stabilityScore: 0
        }
      }
    }

    // D: Index pointing up
    if (fingerStates.indexExtended && !fingerStates.middleExtended &&
        !fingerStates.ringExtended && !fingerStates.pinkyExtended &&
        fingerStates.thumbExtended) {
      return {
        primaryGesture: 'D',
        confidence: 0.89,
        geometricFeatures,
        stabilityScore: 0
      }
    }

    // Continue with more sophisticated rules for all 26 letters...
    // E: Closed fist, thumb down
    if (!fingerStates.indexExtended && !fingerStates.middleExtended &&
        !fingerStates.ringExtended && !fingerStates.pinkyExtended &&
        fingerStates.thumbCurled) {
      return {
        primaryGesture: 'E',
        confidence: 0.85,
        geometricFeatures,
        stabilityScore: 0
      }
    }

    // F: OK-like shape with index and thumb
    if (fingerStates.thumbExtended && fingerStates.indexCurled &&
        fingerStates.middleExtended && fingerStates.ringExtended &&
        fingerStates.pinkyExtended) {
      return {
        primaryGesture: 'F',
        confidence: 0.87,
        geometricFeatures,
        stabilityScore: 0
      }
    }

    // Add more letter classifications...
    
    return null
  }

  // Secondary classification for confusion groups (inspired by repository's Layer 2)
  private secondaryClassification(
    primaryGesture: string,
    fingerStates: AdvancedFingerStates,
    geometricFeatures: number[]
  ): { gesture: string; confidence: number; method: string; group: string } | null {
    
    // Group 1: {D, R, U} - Similar pointing gestures
    if (['D', 'R', 'U'].includes(primaryGesture)) {
      const indexAngle = fingerStates.fingerAngles[1] // Index finger angle
      const thumbPosition = geometricFeatures[0] // Thumb distance from palm
      
      if (indexAngle > -0.5 && indexAngle < 0.5 && thumbPosition > 0.05) {
        return { gesture: 'D', confidence: 0.91, method: 'angle_analysis', group: 'DRU' }
      } else if (indexAngle > 0.5 && fingerStates.middleExtended) {
        return { gesture: 'R', confidence: 0.89, method: 'angle_analysis', group: 'DRU' }
      } else if (indexAngle < -0.5 && fingerStates.middleExtended) {
        return { gesture: 'U', confidence: 0.88, method: 'angle_analysis', group: 'DRU' }
      }
    }

    // Group 2: {T, K, D, I} - Thumb-index combinations
    if (['T', 'K', 'D', 'I'].includes(primaryGesture)) {
      const thumbIndexDistance = Math.abs(geometricFeatures[0] - geometricFeatures[1])
      const wristAngle = fingerStates.wristAngle
      
      if (thumbIndexDistance < 0.02 && !fingerStates.indexExtended) {
        return { gesture: 'T', confidence: 0.90, method: 'distance_analysis', group: 'TKDI' }
      } else if (fingerStates.indexExtended && fingerStates.middleExtended && thumbIndexDistance > 0.05) {
        return { gesture: 'K', confidence: 0.87, method: 'distance_analysis', group: 'TKDI' }
      } else if (fingerStates.indexExtended && !fingerStates.middleExtended) {
        return { gesture: 'I', confidence: 0.89, method: 'distance_analysis', group: 'TKDI' }
      }
    }

    // Group 3: {S, M, N} - Fist variations
    if (['S', 'M', 'N'].includes(primaryGesture)) {
      const handOpenness = fingerStates.handOpenness
      const thumbPosition = fingerStates.thumbExtended
      
      if (handOpenness < 0.2 && !thumbPosition) {
        return { gesture: 'S', confidence: 0.92, method: 'openness_analysis', group: 'SMN' }
      } else if (handOpenness < 0.3 && thumbPosition) {
        return { gesture: 'M', confidence: 0.88, method: 'openness_analysis', group: 'SMN' }
      } else if (handOpenness < 0.4) {
        return { gesture: 'N', confidence: 0.86, method: 'openness_analysis', group: 'SMN' }
      }
    }

    return null
  }

  // Utility methods for advanced calculations
  private calculateFingerAngles(landmarks: Landmark[]): number[] {
    const angles: number[] = []
    const fingerBases = [1, 5, 9, 13, 17]
    const fingerTips = [4, 8, 12, 16, 20]
    
    fingerBases.forEach((baseIndex, i) => {
      const base = landmarks[baseIndex]
      const tip = landmarks[fingerTips[i]]
      const angle = Math.atan2(tip.y - base.y, tip.x - base.x)
      angles.push(angle)
    })
    
    return angles
  }

  private calculateFingerDistances(landmarks: Landmark[]): number[] {
    const distances: number[] = []
    const palmCenter = landmarks[0]
    const fingerTips = [4, 8, 12, 16, 20]
    
    fingerTips.forEach(tipIndex => {
      const tip = landmarks[tipIndex]
      const distance = Math.sqrt(
        Math.pow(tip.x - palmCenter.x, 2) + 
        Math.pow(tip.y - palmCenter.y, 2)
      )
      distances.push(distance)
    })
    
    return distances
  }

  private calculateHandOrientation(landmarks: Landmark[]): 'left' | 'right' | 'unknown' {
    const wrist = landmarks[0]
    const middleFinger = landmarks[9]
    
    if (middleFinger.x > wrist.x + 0.02) return 'right'
    if (middleFinger.x < wrist.x - 0.02) return 'left'
    return 'unknown'
  }

  private calculateHandOpenness(landmarks: Landmark[]): number {
    const fingerTips = [4, 8, 12, 16, 20]
    const palmCenter = landmarks[0]
    
    let totalDistance = 0
    fingerTips.forEach(tipIndex => {
      const tip = landmarks[tipIndex]
      totalDistance += Math.sqrt(
        Math.pow(tip.x - palmCenter.x, 2) + 
        Math.pow(tip.y - palmCenter.y, 2)
      )
    })
    
    return totalDistance / fingerTips.length
  }

  private calculateWristAngle(landmarks: Landmark[]): number {
    const wrist = landmarks[0]
    const middleBase = landmarks[9]
    return Math.atan2(middleBase.y - wrist.y, middleBase.x - wrist.x)
  }

  private calculateStabilityScore(gesture: string, confidence: number): number {
    this.gestureHistory.push(gesture)
    this.confidenceHistory.push(confidence)
    
    if (this.gestureHistory.length > this.historySize) {
      this.gestureHistory.shift()
      this.confidenceHistory.shift()
    }
    
    // Calculate consistency
    const recentGestures = this.gestureHistory.slice(-5)
    const consistentGestures = recentGestures.filter(g => g === gesture).length
    const consistency = consistentGestures / recentGestures.length
    
    // Calculate average confidence
    const recentConfidence = this.confidenceHistory.slice(-5)
    const avgConfidence = recentConfidence.reduce((a, b) => a + b, 0) / recentConfidence.length
    
    return (consistency * 0.6 + avgConfidence * 0.4)
  }

  private isInConfusionGroup(gesture: string): boolean {
    return Object.values(CONFUSION_GROUPS).some(group => group.includes(gesture))
  }
}

export default AdvancedGestureClassifier 
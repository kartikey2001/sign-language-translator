"""
Advanced Gesture Recognizer with OOP Architecture
Integrates two-layer classification with SLT framework
"""

import asyncio
import numpy as np
import cv2
import base64
import logging
from typing import Dict, List, Optional, Union, Tuple
from datetime import datetime
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

# MediaPipe integration
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

# SLT Framework integration
try:
    import sign_language_translator as slt
    SLT_AVAILABLE = True
except ImportError:
    SLT_AVAILABLE = False

logger = logging.getLogger(__name__)

# === Data Classes ===

@dataclass
class Landmark:
    """3D landmark point with confidence"""
    x: float
    y: float
    z: float
    confidence: float = 1.0

@dataclass
class GestureResult:
    """Complete gesture recognition result"""
    primary_gesture: str
    confidence: float
    stability_score: float
    processing_time_ms: float
    method: str
    secondary_classification: Optional[str] = None
    confusion_group: Optional[str] = None
    geometric_features: Optional[List[float]] = None
    landmarks: Optional[List[Landmark]] = None
    raw_prediction: Optional[Dict] = None

class RecognitionMethod(Enum):
    """Available recognition methods"""
    TWO_LAYER_RULE_BASED = "two_layer_rule_based"
    SLT_LANDMARKS = "slt_landmarks"
    HYBRID_ENHANCED = "hybrid_enhanced"
    DEEP_LEARNING = "deep_learning"

# === Abstract Base Classes ===

class BaseGestureRecognizer(ABC):
    """Abstract base class for all gesture recognizers"""
    
    def __init__(self, method: RecognitionMethod):
        self.method = method
        self.is_initialized = False
        self.model = None
        
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the recognizer model"""
        pass
    
    @abstractmethod
    async def recognize(self, **kwargs) -> GestureResult:
        """Recognize gesture from input data"""
        pass
    
    def is_ready(self) -> bool:
        """Check if recognizer is ready to use"""
        return self.is_initialized and self.model is not None

class BaseLandmarkProcessor(ABC):
    """Abstract base class for landmark processing"""
    
    @abstractmethod
    def extract_landmarks(self, frame: np.ndarray) -> List[Landmark]:
        """Extract landmarks from video frame"""
        pass
    
    @abstractmethod
    def normalize_landmarks(self, landmarks: List[Landmark]) -> List[Landmark]:
        """Normalize landmarks for consistent processing"""
        pass

# === Concrete Implementations ===

class MediaPipeLandmarkProcessor(BaseLandmarkProcessor):
    """MediaPipe-based landmark extraction"""
    
    def __init__(self):
        if not MEDIAPIPE_AVAILABLE:
            raise ImportError("MediaPipe not available. Install with: pip install mediapipe")
            
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
    def extract_landmarks(self, frame: np.ndarray) -> Optional[List[Landmark]]:
        """Extract hand landmarks from frame"""
        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb_frame)
            
            if results.multi_hand_landmarks:
                hand_landmarks = results.multi_hand_landmarks[0]
                landmarks = []
                
                for landmark in hand_landmarks.landmark:
                    landmarks.append(Landmark(
                        x=landmark.x,
                        y=landmark.y,
                        z=landmark.z,
                        confidence=1.0  # MediaPipe doesn't provide per-landmark confidence
                    ))
                
                return landmarks
            
            return None
            
        except Exception as e:
            logger.error(f"Landmark extraction error: {e}")
            return None
    
    def normalize_landmarks(self, landmarks: List[Landmark]) -> List[Landmark]:
        """Normalize landmarks relative to wrist"""
        if not landmarks or len(landmarks) != 21:
            return landmarks
            
        # Use wrist (landmark 0) as reference
        wrist = landmarks[0]
        
        # Calculate bounding box for scale normalization
        x_coords = [lm.x for lm in landmarks]
        y_coords = [lm.y for lm in landmarks]
        
        min_x, max_x = min(x_coords), max(x_coords)
        min_y, max_y = min(y_coords), max(y_coords)
        
        scale = max(max_x - min_x, max_y - min_y) or 1.0
        
        normalized = []
        for landmark in landmarks:
            normalized.append(Landmark(
                x=(landmark.x - wrist.x) / scale,
                y=(landmark.y - wrist.y) / scale,
                z=(landmark.z - wrist.z) / scale,
                confidence=landmark.confidence
            ))
            
        return normalized

class TwoLayerRuleBasedRecognizer(BaseGestureRecognizer):
    """Our enhanced two-layer rule-based recognizer"""
    
    # Confusion groups based on research
    CONFUSION_GROUPS = {
        "pointing_gestures": ["D", "R", "U", "Z"],
        "thumb_index_combos": ["T", "K", "D", "I"],
        "fist_variations": ["S", "M", "N", "A", "E"],
        "curved_shapes": ["C", "O"],
        "four_finger_sets": ["B", "F"],
        "downward_gestures": ["P", "Q"],
        "two_three_fingers": ["V", "W"],
        "horizontal_gestures": ["G", "H"]
    }
    
    def __init__(self):
        super().__init__(RecognitionMethod.TWO_LAYER_RULE_BASED)
        self.gesture_history: List[str] = []
        self.confidence_history: List[float] = []
        self.stability_threshold = 0.85
        self.history_size = 15
        
    async def initialize(self) -> bool:
        """Initialize the two-layer recognizer"""
        try:
            # Initialize any required models or data
            logger.info("✅ Two-layer rule-based recognizer initialized")
            self.is_initialized = True
            self.model = "two_layer_v2.0"
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize two-layer recognizer: {e}")
            return False
    
    async def recognize(self, landmarks: List[Landmark], **kwargs) -> GestureResult:
        """Recognize gesture using two-layer approach"""
        start_time = datetime.now()
        
        try:
            if not landmarks or len(landmarks) != 21:
                return self._create_empty_result(start_time)
            
            # Step 1: Extract geometric features
            geometric_features = self._extract_geometric_features(landmarks)
            
            # Step 2: Calculate advanced finger states
            finger_states = self._calculate_finger_states(landmarks)
            
            # Step 3: Primary classification (Layer 1)
            primary_result = self._primary_classification(finger_states, geometric_features)
            
            if not primary_result:
                return self._create_empty_result(start_time)
            
            # Step 4: Secondary classification for confusion groups (Layer 2)
            final_gesture = primary_result["gesture"]
            final_confidence = primary_result["confidence"]
            secondary_method = None
            confusion_group = None
            
            if self._is_in_confusion_group(primary_result["gesture"]):
                secondary_result = self._secondary_classification(
                    primary_result["gesture"],
                    finger_states,
                    geometric_features
                )
                if secondary_result:
                    final_gesture = secondary_result["gesture"]
                    final_confidence = (primary_result["confidence"] + secondary_result["confidence"]) / 2
                    secondary_method = secondary_result["method"]
                    confusion_group = secondary_result["group"]
            
            # Step 5: Calculate stability score
            stability_score = self._calculate_stability_score(final_gesture, final_confidence)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return GestureResult(
                primary_gesture=final_gesture,
                confidence=final_confidence,
                stability_score=stability_score,
                processing_time_ms=processing_time,
                method=self.method.value,
                secondary_classification=secondary_method,
                confusion_group=confusion_group,
                geometric_features=geometric_features,
                landmarks=landmarks
            )
            
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return self._create_empty_result(start_time)
    
    def _extract_geometric_features(self, landmarks: List[Landmark]) -> List[float]:
        """Extract geometric features from landmarks"""
        features = []
        
        # Finger tip distances from palm center (wrist)
        palm_center = landmarks[0]
        finger_tips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
        
        for tip_idx in finger_tips:
            tip = landmarks[tip_idx]
            distance = np.sqrt(
                (tip.x - palm_center.x)**2 + 
                (tip.y - palm_center.y)**2 + 
                (tip.z - palm_center.z)**2
            )
            features.append(distance)
        
        # Finger angles relative to palm
        finger_bases = [1, 5, 9, 13, 17]
        for i, tip_idx in enumerate(finger_tips):
            base = landmarks[finger_bases[i]]
            tip = landmarks[tip_idx]
            angle = np.arctan2(tip.y - base.y, tip.x - base.x)
            features.append(angle)
        
        # Inter-finger distances
        for i in range(len(finger_tips) - 1):
            tip1 = landmarks[finger_tips[i]]
            tip2 = landmarks[finger_tips[i + 1]]
            distance = np.sqrt((tip2.x - tip1.x)**2 + (tip2.y - tip1.y)**2)
            features.append(distance)
        
        # Palm curvature estimation
        knuckles = [2, 5, 9, 13, 17]
        curvature = 0
        for i in range(1, len(knuckles) - 1):
            p1 = landmarks[knuckles[i - 1]]
            p2 = landmarks[knuckles[i]]
            p3 = landmarks[knuckles[i + 1]]
            
            angle1 = np.arctan2(p2.y - p1.y, p2.x - p1.x)
            angle2 = np.arctan2(p3.y - p2.y, p3.x - p2.x)
            curvature += abs(angle2 - angle1)
        
        features.append(curvature)
        
        return features
    
    def _calculate_finger_states(self, landmarks: List[Landmark]) -> Dict:
        """Calculate advanced finger states"""
        return {
            # Basic finger extension
            "thumb_extended": landmarks[4].x > landmarks[3].x + 0.015,
            "thumb_up": landmarks[4].y < landmarks[3].y - 0.01,
            "thumb_curled": landmarks[4].y > landmarks[3].y + 0.015,
            
            "index_extended": landmarks[8].y < landmarks[6].y - 0.015,
            "index_curled": landmarks[8].y > landmarks[6].y + 0.015,
            
            "middle_extended": landmarks[12].y < landmarks[10].y - 0.015,
            "middle_curled": landmarks[12].y > landmarks[10].y + 0.015,
            
            "ring_extended": landmarks[16].y < landmarks[14].y - 0.015,
            "ring_curled": landmarks[16].y > landmarks[14].y + 0.015,
            
            "pinky_extended": landmarks[20].y < landmarks[18].y - 0.015,
            "pinky_curled": landmarks[20].y > landmarks[18].y + 0.015,
            
            # Advanced features
            "palm_facing": landmarks[9].z > landmarks[0].z + 0.01,
            "hand_openness": self._calculate_hand_openness(landmarks),
            "wrist_angle": np.arctan2(landmarks[9].y - landmarks[0].y, landmarks[9].x - landmarks[0].x)
        }
    
    def _calculate_hand_openness(self, landmarks: List[Landmark]) -> float:
        """Calculate hand openness score"""
        finger_tips = [4, 8, 12, 16, 20]
        palm_center = landmarks[0]
        
        total_distance = 0
        for tip_idx in finger_tips:
            tip = landmarks[tip_idx]
            distance = np.sqrt(
                (tip.x - palm_center.x)**2 + (tip.y - palm_center.y)**2
            )
            total_distance += distance
        
        return total_distance / len(finger_tips)
    
    def _primary_classification(self, finger_states: Dict, features: List[float]) -> Optional[Dict]:
        """Primary gesture classification (Layer 1)"""
        
        # A: Closed fist with thumb on side
        if (not finger_states["index_extended"] and not finger_states["middle_extended"] and
            not finger_states["ring_extended"] and not finger_states["pinky_extended"] and
            finger_states["thumb_extended"] and finger_states["hand_openness"] < 0.3):
            return {"gesture": "A", "confidence": 0.92}
        
        # B: Four fingers up, thumb tucked
        if (finger_states["index_extended"] and finger_states["middle_extended"] and
            finger_states["ring_extended"] and finger_states["pinky_extended"] and
            not finger_states["thumb_extended"] and finger_states["hand_openness"] > 0.7):
            return {"gesture": "B", "confidence": 0.90}
        
        # Continue with more classifications...
        # (Implementation would include all 26 letters)
        
        return None
    
    def _secondary_classification(self, primary_gesture: str, finger_states: Dict, features: List[float]) -> Optional[Dict]:
        """Secondary classification for confusion groups (Layer 2)"""
        
        # Group 1: {D, R, U} - Similar pointing gestures
        if primary_gesture in ["D", "R", "U"]:
            if len(features) > 5:
                index_angle = features[6]  # Index finger angle
                thumb_distance = features[0]  # Thumb distance from palm
                
                if -0.5 < index_angle < 0.5 and thumb_distance > 0.05:
                    return {"gesture": "D", "confidence": 0.91, "method": "angle_analysis", "group": "DRU"}
                elif index_angle > 0.5 and finger_states["middle_extended"]:
                    return {"gesture": "R", "confidence": 0.89, "method": "angle_analysis", "group": "DRU"}
                elif index_angle < -0.5 and finger_states["middle_extended"]:
                    return {"gesture": "U", "confidence": 0.88, "method": "angle_analysis", "group": "DRU"}
        
        # Add more confusion group handling...
        
        return None
    
    def _calculate_stability_score(self, gesture: str, confidence: float) -> float:
        """Calculate gesture stability over time"""
        self.gesture_history.append(gesture)
        self.confidence_history.append(confidence)
        
        if len(self.gesture_history) > self.history_size:
            self.gesture_history.pop(0)
            self.confidence_history.pop(0)
        
        # Calculate consistency
        recent_gestures = self.gesture_history[-5:]
        consistent_gestures = sum(1 for g in recent_gestures if g == gesture)
        consistency = consistent_gestures / len(recent_gestures) if recent_gestures else 0
        
        # Calculate average confidence
        recent_confidence = self.confidence_history[-5:]
        avg_confidence = sum(recent_confidence) / len(recent_confidence) if recent_confidence else 0
        
        return consistency * 0.6 + avg_confidence * 0.4
    
    def _is_in_confusion_group(self, gesture: str) -> bool:
        """Check if gesture is in any confusion group"""
        for group_gestures in self.CONFUSION_GROUPS.values():
            if gesture in group_gestures:
                return True
        return False
    
    def _create_empty_result(self, start_time: datetime) -> GestureResult:
        """Create empty result for failed recognition"""
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        return GestureResult(
            primary_gesture="Unknown",
            confidence=0.0,
            stability_score=0.0,
            processing_time_ms=processing_time,
            method=self.method.value
        )

class SLTEnhancedRecognizer(BaseGestureRecognizer):
    """SLT Framework enhanced recognizer"""
    
    def __init__(self):
        super().__init__(RecognitionMethod.SLT_LANDMARKS)
        
    async def initialize(self) -> bool:
        """Initialize SLT-based recognizer"""
        if not SLT_AVAILABLE:
            logger.warning("SLT Framework not available")
            return False
            
        try:
            # Initialize SLT landmark model
            self.model = slt.models.MediaPipeLandmarksModel()
            logger.info("✅ SLT Enhanced recognizer initialized")
            self.is_initialized = True
            return True
        except Exception as e:
            logger.error(f"❌ Failed to initialize SLT recognizer: {e}")
            return False
    
    async def recognize(self, frame_data: str = None, landmarks: List[Landmark] = None, **kwargs) -> GestureResult:
        """Recognize gesture using SLT framework"""
        start_time = datetime.now()
        
        try:
            # Convert landmarks to SLT format if needed
            # Implementation depends on SLT framework requirements
            
            # For now, return a placeholder result
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return GestureResult(
                primary_gesture="SLT_PROCESSED",
                confidence=0.95,
                stability_score=0.9,
                processing_time_ms=processing_time,
                method=self.method.value,
                landmarks=landmarks
            )
            
        except Exception as e:
            logger.error(f"SLT recognition error: {e}")
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            return GestureResult(
                primary_gesture="Unknown",
                confidence=0.0,
                stability_score=0.0,
                processing_time_ms=processing_time,
                method=self.method.value
            )

# === Main Gesture Recognizer Class ===

class AdvancedGestureRecognizer:
    """
    Main gesture recognizer that orchestrates multiple recognition methods
    """
    
    def __init__(self):
        self.landmark_processor = MediaPipeLandmarkProcessor() if MEDIAPIPE_AVAILABLE else None
        self.recognizers: Dict[RecognitionMethod, BaseGestureRecognizer] = {}
        self.default_method = RecognitionMethod.TWO_LAYER_RULE_BASED
        self.frame_processor = self._setup_frame_processor()
        
    async def initialize(self) -> bool:
        """Initialize all recognizers"""
        try:
            # Initialize two-layer rule-based recognizer
            two_layer = TwoLayerRuleBasedRecognizer()
            if await two_layer.initialize():
                self.recognizers[RecognitionMethod.TWO_LAYER_RULE_BASED] = two_layer
            
            # Initialize SLT recognizer if available
            if SLT_AVAILABLE:
                slt_recognizer = SLTEnhancedRecognizer()
                if await slt_recognizer.initialize():
                    self.recognizers[RecognitionMethod.SLT_LANDMARKS] = slt_recognizer
            
            logger.info(f"✅ Initialized {len(self.recognizers)} gesture recognizers")
            return len(self.recognizers) > 0
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize gesture recognizers: {e}")
            return False
    
    async def recognize(self, frame_data: str = None, landmarks: List[dict] = None, method: RecognitionMethod = None) -> Dict:
        """
        Main recognition method with multiple input formats
        """
        try:
            # Use default method if not specified
            if method is None:
                method = self.default_method
            
            # Get the appropriate recognizer
            recognizer = self.recognizers.get(method)
            if not recognizer:
                raise ValueError(f"Recognizer for method {method} not available")
            
            # Process landmarks
            processed_landmarks = None
            
            if landmarks:
                # Convert from dict format to Landmark objects
                processed_landmarks = [
                    Landmark(x=lm.get("x", 0), y=lm.get("y", 0), z=lm.get("z", 0))
                    for lm in landmarks
                ]
            elif frame_data and self.landmark_processor:
                # Extract landmarks from frame
                frame = self._decode_frame(frame_data)
                if frame is not None:
                    extracted = self.landmark_processor.extract_landmarks(frame)
                    if extracted:
                        processed_landmarks = self.landmark_processor.normalize_landmarks(extracted)
            
            if not processed_landmarks:
                return {
                    "gesture": "No Hand Detected",
                    "confidence": 0.0,
                    "stability_score": 0.0,
                    "method": method.value,
                    "error": "No valid landmarks found"
                }
            
            # Perform recognition
            result = await recognizer.recognize(landmarks=processed_landmarks)
            
            # Convert to dict format for API response
            return {
                "gesture": result.primary_gesture,
                "confidence": result.confidence,
                "stability_score": result.stability_score,
                "processing_time": result.processing_time_ms,
                "method": result.method,
                "secondary_classification": result.secondary_classification,
                "confusion_group": result.confusion_group,
                "geometric_features": result.geometric_features,
                "landmarks_count": len(processed_landmarks) if processed_landmarks else 0
            }
            
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return {
                "gesture": "Error",
                "confidence": 0.0,
                "stability_score": 0.0,
                "method": method.value if method else "unknown",
                "error": str(e)
            }
    
    def is_ready(self) -> bool:
        """Check if at least one recognizer is ready"""
        return any(recognizer.is_ready() for recognizer in self.recognizers.values())
    
    def get_available_methods(self) -> List[str]:
        """Get list of available recognition methods"""
        return [method.value for method, recognizer in self.recognizers.items() if recognizer.is_ready()]
    
    def _decode_frame(self, frame_data: str) -> Optional[np.ndarray]:
        """Decode base64 frame data to OpenCV format"""
        try:
            # Remove data URL prefix if present
            if frame_data.startswith('data:image'):
                frame_data = frame_data.split(',')[1]
            
            # Decode base64
            img_data = base64.b64decode(frame_data)
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return frame
            
        except Exception as e:
            logger.error(f"Frame decoding error: {e}")
            return None
    
    def _setup_frame_processor(self):
        """Setup frame processing utilities"""
        # Can be extended with additional frame processing logic
        return {
            "resize_target": (640, 480),
            "quality_threshold": 0.5
        } 
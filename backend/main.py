"""
Enhanced Sign Language Translator Backend
Integrates SLT framework with real-time gesture recognition
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from contextlib import asynccontextmanager
import asyncio
import json
import base64
import cv2
import numpy as np
from typing import Dict, List, Optional, Union
import logging
from datetime import datetime
import os
from pathlib import Path

# Sign Language Translator Framework
try:
    import sign_language_translator as slt
    SLT_AVAILABLE = True
except ImportError:
    SLT_AVAILABLE = False
    logging.warning("Sign Language Translator not available. Install with: pip install sign-language-translator")

# Local modules - only import existing files
try:
    from models.gesture_recognizer import AdvancedGestureRecognizer
    GESTURE_RECOGNIZER_AVAILABLE = True
except ImportError:
    GESTURE_RECOGNIZER_AVAILABLE = False
    logging.warning("Advanced gesture recognizer not available, using simple recognizer")

try:
    from models.translation_engine import TranslationEngine
    TRANSLATION_ENGINE_AVAILABLE = True
except ImportError:
    TRANSLATION_ENGINE_AVAILABLE = False
    logging.warning("Translation engine not available, using SLT directly")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global state
class GlobalState:
    def __init__(self):
        self.slt_models = {}
        self.connections = set()
        self.gesture_history = []
        self.is_initialized = False

state = GlobalState()

# === SLT Framework Initialization ===

async def initialize_slt_models():
    """Initialize SLT Framework models with improved error handling"""
    if not SLT_AVAILABLE:
        logger.warning("❌ SLT Framework not available")
        return False
    
    try:
        # Try to initialize models one by one with fallbacks
        state.slt_models = {}
        
        # Try English to video first (most likely to work)
        try:
            state.slt_models["english_to_video"] = slt.models.ConcatenativeSynthesis(
                text_language="english",
                sign_language="pk-sl", 
                sign_format="video"
            )
            logger.info("✅ English to video model loaded")
        except Exception as e:
            logger.warning(f"⚠️ English to video model failed: {e}")
        
        # Try landmarks with proper embedding model configuration
        try:
            landmarks_model = slt.models.ConcatenativeSynthesis(
                text_language="english",
                sign_language="pk-sl",
                sign_format="landmarks"
            )
            
            # Try to set embedding model if the attribute exists
            if hasattr(landmarks_model, 'sign_embedding_model'):
                try:
                    landmarks_model.sign_embedding_model = "mediapipe-world"
                    state.slt_models["english_to_landmarks"] = landmarks_model
                    logger.info("✅ English to landmarks model loaded with mediapipe-world embedding")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to set embedding model: {e}")
                    # Try without setting embedding model
                    state.slt_models["english_to_landmarks"] = landmarks_model
                    logger.info("✅ English to landmarks model loaded (without embedding)")
            else:
                state.slt_models["english_to_landmarks"] = landmarks_model
                logger.info("✅ English to landmarks model loaded (no embedding attribute)")
                
        except Exception as e:
            logger.warning(f"⚠️ English to landmarks model failed: {e}")
        
        # Try Urdu models (optional)
        try:
            state.slt_models["urdu_to_video"] = slt.models.ConcatenativeSynthesis(
                text_language="urdu",
                sign_language="pk-sl",
                sign_format="video"
            )
            logger.info("✅ Urdu to video model loaded")
        except Exception as e:
            logger.warning(f"⚠️ Urdu to video model failed: {e}")
        
        try:
            urdu_landmarks_model = slt.models.ConcatenativeSynthesis(
                text_language="urdu",
                sign_language="pk-sl",
                sign_format="landmarks"
            )
            
            if hasattr(urdu_landmarks_model, 'sign_embedding_model'):
                try:
                    urdu_landmarks_model.sign_embedding_model = "mediapipe-world"
                except:
                    pass  # Continue without embedding
            
            state.slt_models["urdu_to_landmarks"] = urdu_landmarks_model
            logger.info("✅ Urdu to landmarks model loaded")
        except Exception as e:
            logger.warning(f"⚠️ Urdu to landmarks model failed: {e}")
        
        # Try MediaPipe landmark extraction (optional)
        try:
            state.slt_models["landmarks_extractor"] = slt.models.MediaPipeLandmarksModel()
            logger.info("✅ MediaPipe landmarks extractor loaded")
        except Exception as e:
            logger.warning(f"⚠️ MediaPipe landmarks extractor failed: {e}")
        
        # Check if we loaded any models
        if state.slt_models:
            logger.info(f"✅ SLT Framework partially initialized with {len(state.slt_models)} models: {list(state.slt_models.keys())}")
            return True
        else:
            logger.warning("❌ No SLT models could be loaded, using fallback gesture recognition only")
            return False
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize SLT models: {e}")
        logger.info("📝 SLT models disabled, using simple gesture recognition only")
        return False

# === Simple Gesture Recognition (without external files) ===

class SimpleGestureRecognizer:
    """Simplified gesture recognizer for immediate use"""
    
    def __init__(self):
        self.gesture_history = []
        self.confidence_history = []
        self.history_size = 10
        
        # ASL letter patterns (simplified)
        self.gesture_patterns = {
            "A": {"fingers_up": 0, "thumb_out": True},
            "B": {"fingers_up": 4, "thumb_in": True},
            "C": {"curve": True, "open": True},
            "D": {"index_up": True, "others_down": True},
            "E": {"all_down": True, "curled": True},
            "F": {"index_middle_touch": True},
            "G": {"index_horizontal": True},
            "H": {"two_fingers_horizontal": True},
            "I": {"pinky_up": True},
            "L": {"thumb_index_90": True},
            "O": {"circle": True},
            "Y": {"thumb_pinky_up": True}
        }
    
    def recognize_from_landmarks(self, landmarks: List[Dict]) -> Dict:
        """Simple recognition from landmarks"""
        if not landmarks or len(landmarks) != 21:
            return {
                "gesture": "No Hand",
                "confidence": 0.0,
                "stability": 0.0,
                "method": "simple_rules"
            }
        
        try:
            # Convert to simple format
            points = [(lm.get("x", 0), lm.get("y", 0), lm.get("z", 0)) for lm in landmarks]
            
            # Basic finger state analysis
            finger_states = self._analyze_fingers(points)
            
            # Match against patterns
            best_match = self._match_pattern(finger_states)
            
            # Calculate stability
            stability = self._calculate_stability(best_match["gesture"], best_match["confidence"])
            
            return {
                "gesture": best_match["gesture"],
                "confidence": best_match["confidence"],
                "stability": stability,
                "method": "simple_rules",
                "finger_states": finger_states
            }
            
        except Exception as e:
            logger.error(f"Recognition error: {e}")
            return {
                "gesture": "Error",
                "confidence": 0.0,
                "stability": 0.0,
                "method": "simple_rules",
                "error": str(e)
            }
    
    def _analyze_fingers(self, points: List[tuple]) -> Dict:
        """Analyze finger positions"""
        # Finger tip indices: thumb=4, index=8, middle=12, ring=16, pinky=20
        # Finger base indices: thumb=3, index=6, middle=10, ring=14, pinky=18
        
        finger_tips = [4, 8, 12, 16, 20]
        finger_bases = [3, 6, 10, 14, 18]
        
        fingers_extended = []
        for i in range(5):
            tip = points[finger_tips[i]]
            base = points[finger_bases[i]]
            # Simple heuristic: finger is extended if tip is above base
            extended = tip[1] < base[1] - 0.02 if i > 0 else tip[0] > base[0] + 0.02  # Thumb different
            fingers_extended.append(extended)
        
        return {
            "fingers_extended": fingers_extended,
            "thumb_extended": fingers_extended[0],
            "index_extended": fingers_extended[1],
            "middle_extended": fingers_extended[2],
            "ring_extended": fingers_extended[3],
            "pinky_extended": fingers_extended[4],
            "fingers_up_count": sum(fingers_extended[1:]),  # Exclude thumb
            "all_fingers_down": not any(fingers_extended[1:])
        }
    
    def _match_pattern(self, finger_states: Dict) -> Dict:
        """Match finger states to gesture patterns"""
        matches = []
        
        # Simple pattern matching
        if finger_states["all_fingers_down"] and finger_states["thumb_extended"]:
            matches.append({"gesture": "A", "confidence": 0.85})
        elif finger_states["fingers_up_count"] == 4 and not finger_states["thumb_extended"]:
            matches.append({"gesture": "B", "confidence": 0.90})
        elif finger_states["index_extended"] and finger_states["fingers_up_count"] == 1:
            matches.append({"gesture": "D", "confidence": 0.80})
        elif finger_states["all_fingers_down"]:
            matches.append({"gesture": "E", "confidence": 0.75})
        elif finger_states["pinky_extended"] and finger_states["fingers_up_count"] == 1:
            matches.append({"gesture": "I", "confidence": 0.80})
        elif finger_states["thumb_extended"] and finger_states["index_extended"] and finger_states["fingers_up_count"] == 1:
            matches.append({"gesture": "L", "confidence": 0.85})
        elif finger_states["thumb_extended"] and finger_states["pinky_extended"] and finger_states["fingers_up_count"] == 1:
            matches.append({"gesture": "Y", "confidence": 0.85})
        else:
            matches.append({"gesture": "Unknown", "confidence": 0.3})
        
        # Return best match
        return max(matches, key=lambda x: x["confidence"]) if matches else {"gesture": "Unknown", "confidence": 0.0}
    
    def _calculate_stability(self, gesture: str, confidence: float) -> float:
        """Calculate gesture stability over time"""
        self.gesture_history.append(gesture)
        self.confidence_history.append(confidence)
        
        if len(self.gesture_history) > self.history_size:
            self.gesture_history.pop(0)
            self.confidence_history.pop(0)
        
        if len(self.gesture_history) < 3:
            return confidence * 0.5
        
        # Calculate consistency
        recent_gestures = self.gesture_history[-5:]
        consistent_count = sum(1 for g in recent_gestures if g == gesture)
        consistency = consistent_count / len(recent_gestures)
        
        # Calculate average confidence
        recent_confidence = self.confidence_history[-5:]
        avg_confidence = sum(recent_confidence) / len(recent_confidence)
        
        return consistency * 0.6 + avg_confidence * 0.4

# === WebSocket Connection Manager ===

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        state.connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        state.connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)

# === Initialize Components ===

# Initialize gesture recognizer
if GESTURE_RECOGNIZER_AVAILABLE:
    try:
        gesture_recognizer = AdvancedGestureRecognizer()
        logger.info("✅ Advanced gesture recognizer loaded")
    except Exception as e:
        logger.warning(f"Failed to load advanced recognizer: {e}, using simple recognizer")
        gesture_recognizer = SimpleGestureRecognizer()
else:
    gesture_recognizer = SimpleGestureRecognizer()
    logger.info("✅ Simple gesture recognizer loaded")

# Initialize connection manager
manager = ConnectionManager()
logger.info("✅ Connection manager initialized")

# === Lifespan Events (Modern FastAPI) ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown with lifespan context manager"""
    # Startup
    logger.info("🚀 Starting Enhanced Sign Language Translator Backend")
    
    # Initialize SLT models
    slt_success = await initialize_slt_models()
    
    state.is_initialized = True
    logger.info(f"✅ Backend initialized (SLT: {'✅' if slt_success else '❌'})")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("🛑 Shutting down Enhanced Sign Language Translator Backend")
    
    # Close all WebSocket connections
    for websocket in list(state.connections):
        try:
            await websocket.close()
        except:
            pass

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Enhanced Sign Language Translator API",
    description="Real-time sign language recognition and translation with SLT framework",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Core API Endpoints ===

@app.get("/")
async def root():
    """Health check and service info"""
    return {
        "service": "Enhanced Sign Language Translator API",
        "version": "2.0.0",
        "status": "running",
        "slt_framework": SLT_AVAILABLE,
        "slt_models_loaded": len(state.slt_models),
        "active_connections": len(state.connections),
        "timestamp": datetime.now().isoformat(),
        "capabilities": {
            "gesture_recognition": True,
            "text_to_sign": SLT_AVAILABLE,
            "multi_language": SLT_AVAILABLE,
            "real_time": True,
            "video_generation": SLT_AVAILABLE,
            "landmark_generation": SLT_AVAILABLE
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check with model status"""
    model_status = {}
    
    if SLT_AVAILABLE and state.slt_models:
        for model_name in state.slt_models:
            model_status[model_name] = "loaded"
    
    # Check for missing common models
    expected_models = ["english_to_video", "english_to_landmarks", "urdu_to_video", "urdu_to_landmarks"]
    for expected in expected_models:
        if expected not in model_status:
            model_status[expected] = "not_available"
    
    return {
        "status": "healthy" if state.is_initialized else "initializing",
        "slt_framework": {
            "available": SLT_AVAILABLE,
            "models_loaded": len(state.slt_models) if SLT_AVAILABLE else 0,
            "models": model_status
        },
        "gesture_recognition": {
            "advanced": GESTURE_RECOGNIZER_AVAILABLE,
            "simple_fallback": True
        },
        "websocket": {
            "connections": len(state.connections),
            "manager_active": bool(manager)
        },
        "server": {
            "uptime": "running",
            "version": "2.0.0"
        }
    }

@app.post("/recognize/gesture")
async def recognize_gesture(request: Dict):
    """
    Advanced gesture recognition from landmarks
    Expected: { "landmarks": [...] }
    """
    try:
        landmarks = request.get("landmarks", [])
        
        if not landmarks:
            raise HTTPException(status_code=400, detail="Landmarks data required")
        
        # Use simple gesture recognizer
        result = gesture_recognizer.recognize_from_landmarks(landmarks)
        
        return {
            "success": True,
            "result": result,
            "processing_time_ms": 5,  # Placeholder
            "model_version": "simple_v1.0"
        }
        
    except Exception as e:
        logger.error(f"Gesture recognition error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate/text-to-sign")
async def text_to_sign(request: Dict):
    """
    Translate text to sign language using SLT framework
    Expected: { "text": "Hello world", "language": "english", "format": "video|landmarks" }
    """
    if not SLT_AVAILABLE:
        raise HTTPException(status_code=503, detail="SLT Framework not available. Please install sign-language-translator package.")
    
    if not state.slt_models:
        raise HTTPException(status_code=503, detail="No SLT models loaded. Check server logs for initialization errors.")
    
    try:
        text = request.get("text", "")
        language = request.get("language", "english")
        output_format = request.get("format", "landmarks")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Select appropriate SLT model with fallbacks
        model_key = f"{language}_to_{output_format}"
        model = None
        
        if model_key in state.slt_models:
            model = state.slt_models[model_key]
        else:
            # Try fallbacks
            fallback_keys = [
                f"english_to_{output_format}",  # Fallback to English
                f"{language}_to_video",         # Fallback to video format
                "english_to_video"              # Ultimate fallback
            ]
            
            for fallback_key in fallback_keys:
                if fallback_key in state.slt_models:
                    model = state.slt_models[fallback_key]
                    logger.warning(f"Using fallback model {fallback_key} instead of requested {model_key}")
                    break
        
        if not model:
            available_models = list(state.slt_models.keys())
            raise HTTPException(
                status_code=400, 
                detail=f"No suitable model available. Requested: {model_key}. Available: {available_models}"
            )
        
        # Translate text to sign
        try:
            sign_result = model.translate(text)
            
            if output_format == "video":
                return {
                    "success": True,
                    "format": "video",
                    "data": {
                        "video_path": str(sign_result),
                        "message": "Video generated successfully"
                    },
                    "text": text,
                    "language": language,
                    "model_used": model_key if model_key in state.slt_models else "fallback"
                }
            else:
                # For landmarks, return structured data
                try:
                    if hasattr(sign_result, 'to_dict'):
                        landmarks_data = sign_result.to_dict()
                    elif hasattr(sign_result, 'landmarks'):
                        landmarks_data = sign_result.landmarks
                    else:
                        landmarks_data = {"raw": str(sign_result)}
                        
                    return {
                        "success": True,
                        "format": "landmarks",
                        "data": landmarks_data,
                        "text": text,
                        "language": language,
                        "model_used": model_key if model_key in state.slt_models else "fallback"
                    }
                except Exception as e:
                    logger.warning(f"Landmarks conversion failed: {e}")
                    return {
                        "success": True,
                        "format": "landmarks",
                        "data": {"message": "Landmarks generated", "raw": str(sign_result)},
                        "text": text,
                        "language": language,
                        "model_used": model_key if model_key in state.slt_models else "fallback"
                    }
        except Exception as translation_error:
            logger.error(f"Translation failed: {translation_error}")
            raise HTTPException(
                status_code=500, 
                detail=f"Translation failed: {str(translation_error)}. The model may need additional configuration."
            )
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Text-to-sign translation error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/languages/supported")
async def get_supported_languages():
    """Get list of supported languages for text and sign translation"""
    base_languages = {
        "text_languages": ["english", "urdu"],
        "sign_languages": ["pk-sl"],
        "output_formats": ["video", "landmarks"],
        "translation_pairs": []
    }
    
    if SLT_AVAILABLE and state.slt_models:
        # Extract available pairs from loaded models
        for model_name in state.slt_models.keys():
            if "_to_" in model_name:
                parts = model_name.split("_to_")
                if len(parts) == 2:
                    source, target = parts
                    base_languages["translation_pairs"].append({
                        "source": source,
                        "target": target,
                        "available": True
                    })
    
    return base_languages

@app.post("/analyze/sentence")
async def analyze_sentence(request: Dict):
    """Analyze sentence structure and translation readiness"""
    try:
        text = request.get("text", "")
        language = request.get("language", "english")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Basic analysis
        words = text.split()
        analysis = {
            "text": text,
            "language": language,
            "word_count": len(words),
            "unique_words": len(set(words)),
            "complexity_score": min(1.0, len(words) / 10),
            "translatable": True,
            "supported_formats": ["landmarks", "video"] if SLT_AVAILABLE else [],
            "estimated_confidence": 0.85 if len(words) <= 10 else 0.70,
            "processing_time": 2
        }
        
        return {
            "success": True,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"Sentence analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === WebSocket Endpoints ===

@app.websocket("/ws/real-time")
async def websocket_real_time(websocket: WebSocket):
    """Real-time WebSocket for continuous processing"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive data from frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            timestamp = datetime.now().isoformat()
            
            if message_type == "gesture_landmarks":
                # Process gesture recognition
                landmarks = message.get("landmarks", [])
                result = gesture_recognizer.recognize_from_landmarks(landmarks)
                
                await manager.send_personal_message(json.dumps({
                    "type": "gesture_result",
                    "data": result,
                    "timestamp": timestamp
                }), websocket)
                
            elif message_type == "translate_text":
                # Translate text to sign using SLT
                if SLT_AVAILABLE:
                    text = message.get("text", "")
                    language = message.get("language", "english")
                    
                    if text:
                        try:
                            model_key = f"{language}_to_landmarks"
                            if model_key in state.slt_models:
                                model = state.slt_models[model_key]
                                sign_result = model.translate(text)
                                
                                await manager.send_personal_message(json.dumps({
                                    "type": "translation_result",
                                    "data": {
                                        "text": text,
                                        "result": str(sign_result),
                                        "format": "landmarks",
                                        "language": language
                                    },
                                    "timestamp": timestamp
                                }), websocket)
                        except Exception as e:
                            await manager.send_personal_message(json.dumps({
                                "type": "error",
                                "message": f"Translation error: {str(e)}",
                                "timestamp": timestamp
                            }), websocket)
                            
            elif message_type == "ping":
                # Health check ping
                await manager.send_personal_message(json.dumps({
                    "type": "pong",
                    "timestamp": timestamp,
                    "server_status": "running"
                }), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# === File Serving (for videos) ===

@app.get("/files/video/{filename}")
async def serve_video(filename: str):
    """Serve generated video files"""
    # This would serve SLT-generated videos
    # Implementation depends on where SLT saves videos
    file_path = Path(f"./generated_videos/{filename}")
    
    if file_path.exists():
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="Video file not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 
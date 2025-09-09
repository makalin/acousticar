"""
Audio API Routes
Handles audio processing and analysis endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional
import numpy as np
import asyncio
import logging
from pydantic import BaseModel
import json

from core.acoustic_analyzer import AcousticAnalyzer
from core.eq_generator import EQGenerator
from core.soundstage_optimizer import SoundstageOptimizer

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize core components
acoustic_analyzer = AcousticAnalyzer()
eq_generator = EQGenerator()
soundstage_optimizer = SoundstageOptimizer()

class AudioAnalysisRequest(BaseModel):
    samples: list
    sample_rate: int = 44100
    timestamp: Optional[str] = None

class AudioAnalysisResponse(BaseModel):
    acoustic_profile: Dict[str, Any]
    recommendations: list
    timestamp: str

class EQGenerationRequest(BaseModel):
    acoustic_profile: Dict[str, Any]
    user_preferences: Dict[str, Any]
    music_genre: str = "general"

class SoundstageOptimizationRequest(BaseModel):
    acoustic_profile: Dict[str, Any]
    user_preferences: Dict[str, Any]

@router.post("/analyze", response_model=AudioAnalysisResponse)
async def analyze_audio(request: AudioAnalysisRequest):
    """Analyze audio data for acoustic characteristics"""
    try:
        # Convert samples to numpy array
        samples = np.array(request.samples, dtype=np.float32)
        
        # Perform acoustic analysis
        analysis_result = await acoustic_analyzer.analyze_realtime({
            'samples': samples.tolist(),
            'timestamp': request.timestamp
        })
        
        if 'error' in analysis_result:
            raise HTTPException(status_code=400, detail=analysis_result['error'])
        
        return AudioAnalysisResponse(
            acoustic_profile=analysis_result['acoustic_profile'],
            recommendations=analysis_result['recommendations'],
            timestamp=request.timestamp or "2024-01-01T00:00:00Z"
        )
        
    except Exception as e:
        logger.error(f"Error in audio analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_audio_file(file: UploadFile = File(...)):
    """Upload audio file for analysis"""
    try:
        # Read file content
        content = await file.read()
        
        # Convert to numpy array (simplified - would need proper audio decoding)
        samples = np.frombuffer(content, dtype=np.int16).astype(np.float32) / 32768.0
        
        # Perform analysis
        analysis_result = await acoustic_analyzer.analyze_realtime({
            'samples': samples.tolist(),
            'timestamp': "2024-01-01T00:00:00Z"
        })
        
        return {
            "filename": file.filename,
            "file_size": len(content),
            "analysis_result": analysis_result
        }
        
    except Exception as e:
        logger.error(f"Error uploading audio file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-eq")
async def generate_eq_profile(request: EQGenerationRequest):
    """Generate personalized EQ profile"""
    try:
        # Generate EQ profile
        eq_profile = await eq_generator.generate_personalized_eq(
            acoustic_profile=request.acoustic_profile,
            user_preferences=request.user_preferences,
            music_genre=request.music_genre
        )
        
        # Convert to JSON-serializable format
        profile_data = {
            "name": eq_profile.name,
            "frequency_bands": eq_profile.frequency_bands,
            "gains": eq_profile.gains,
            "q_factors": eq_profile.q_factors,
            "filter_types": eq_profile.filter_types,
            "user_preferences": eq_profile.user_preferences,
            "acoustic_compensation": eq_profile.acoustic_compensation
        }
        
        return profile_data
        
    except Exception as e:
        logger.error(f"Error generating EQ profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize-soundstage")
async def optimize_soundstage(request: SoundstageOptimizationRequest):
    """Optimize soundstage for immersive audio"""
    try:
        # Optimize soundstage
        soundstage_profile = await soundstage_optimizer.optimize_soundstage(
            acoustic_profile=request.acoustic_profile,
            user_preferences=request.user_preferences
        )
        
        # Convert to JSON-serializable format
        profile_data = {
            "stereo_width": soundstage_profile.stereo_width,
            "center_image_strength": soundstage_profile.center_image_strength,
            "depth_perception": soundstage_profile.depth_perception,
            "height_perception": soundstage_profile.height_perception,
            "left_right_balance": soundstage_profile.left_right_balance,
            "front_back_positioning": soundstage_profile.front_back_positioning,
            "spatial_coherence": soundstage_profile.spatial_coherence,
            "crosstalk_compensation": soundstage_profile.crosstalk_compensation,
            "hrtf_compensation": soundstage_profile.hrtf_compensation
        }
        
        return profile_data
        
    except Exception as e:
        logger.error(f"Error optimizing soundstage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-audio")
async def process_audio(
    samples: list = Form(...),
    eq_profile: str = Form(...),
    soundstage_profile: str = Form(...)
):
    """Process audio with EQ and soundstage optimization"""
    try:
        # Parse profiles
        eq_data = json.loads(eq_profile)
        soundstage_data = json.loads(soundstage_profile)
        
        # Convert samples to numpy array
        audio_data = np.array(samples, dtype=np.float32)
        
        # Apply EQ processing
        from core.eq_generator import EQProfile
        eq_profile_obj = EQProfile(
            name=eq_data["name"],
            frequency_bands=eq_data["frequency_bands"],
            gains=eq_data["gains"],
            q_factors=eq_data["q_factors"],
            filter_types=eq_data["filter_types"],
            user_preferences=eq_data["user_preferences"],
            acoustic_compensation=eq_data["acoustic_compensation"]
        )
        
        processed_audio = await eq_generator.apply_eq_to_audio(audio_data, eq_profile_obj)
        
        # Apply soundstage optimization
        from core.soundstage_optimizer import SoundstageProfile
        soundstage_profile_obj = SoundstageProfile(
            stereo_width=soundstage_data["stereo_width"],
            center_image_strength=soundstage_data["center_image_strength"],
            depth_perception=soundstage_data["depth_perception"],
            height_perception=soundstage_data["height_perception"],
            left_right_balance=soundstage_data["left_right_balance"],
            front_back_positioning=soundstage_data["front_back_positioning"],
            spatial_coherence=soundstage_data["spatial_coherence"],
            crosstalk_compensation=soundstage_data["crosstalk_compensation"],
            hrtf_compensation=soundstage_data["hrtf_compensation"]
        )
        
        final_audio = await soundstage_optimizer.apply_soundstage_optimization(
            processed_audio, soundstage_profile_obj
        )
        
        return {
            "processed_samples": final_audio.tolist(),
            "original_samples": samples,
            "processing_applied": ["eq", "soundstage_optimization"]
        }
        
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/frequency-bands")
async def get_frequency_bands():
    """Get standard frequency bands for EQ"""
    return {
        "frequency_bands": acoustic_analyzer.frequency_bands if hasattr(acoustic_analyzer, 'frequency_bands') else [
            20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500,
            630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
            10000, 12500, 16000, 20000
        ]
    }

@router.get("/audio-formats")
async def get_supported_audio_formats():
    """Get supported audio formats"""
    return {
        "supported_formats": [
            "wav", "mp3", "flac", "aac", "ogg", "m4a"
        ],
        "sample_rates": [44100, 48000, 96000],
        "bit_depths": [16, 24, 32],
        "channels": [1, 2, 5.1, 7.1]
    }

@router.post("/test-signal")
async def generate_test_signal(
    frequency: int = 1000,
    duration: float = 1.0,
    sample_rate: int = 44100
):
    """Generate test signal for acoustic analysis"""
    try:
        # Generate sine wave test signal
        t = np.linspace(0, duration, int(sample_rate * duration))
        signal = np.sin(2 * np.pi * frequency * t)
        
        # Convert to stereo
        stereo_signal = np.column_stack([signal, signal])
        
        return {
            "samples": stereo_signal.tolist(),
            "frequency": frequency,
            "duration": duration,
            "sample_rate": sample_rate
        }
        
    except Exception as e:
        logger.error(f"Error generating test signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

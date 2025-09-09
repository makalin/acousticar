"""
Acoustic Analysis Module
Handles real-time acoustic analysis of car cabin audio
"""

import numpy as np
import librosa
import scipy.signal as signal
from scipy.fft import fft, fftfreq
from typing import Dict, List, Any, Optional
import asyncio
import logging
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)

@dataclass
class AcousticProfile:
    """Data class for acoustic analysis results"""
    frequency_response: List[float]
    resonance_frequencies: List[float]
    reverb_time: float
    clarity_index: float
    stereo_width: float
    phase_coherence: float
    noise_floor: float
    dynamic_range: float
    harmonic_distortion: float
    intermodulation_distortion: float

class AcousticAnalyzer:
    """Main acoustic analysis engine"""
    
    def __init__(self):
        self.sample_rate = 44100
        self.fft_size = 4096
        self.hop_length = 1024
        self.models_loaded = False
        
    async def load_models(self):
        """Load pre-trained models for acoustic analysis"""
        try:
            # Load ML models for acoustic analysis
            # This would typically load TensorFlow/PyTorch models
            logger.info("Loading acoustic analysis models...")
            await asyncio.sleep(0.1)  # Simulate model loading
            self.models_loaded = True
            logger.info("Acoustic analysis models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load acoustic analysis models: {e}")
            raise

    async def analyze_realtime(self, audio_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze real-time audio data from car cabin"""
        try:
            # Extract audio samples from input data
            samples = np.array(audio_data.get('samples', []), dtype=np.float32)
            if len(samples) == 0:
                return {"error": "No audio data provided"}
            
            # Perform acoustic analysis
            profile = await self._analyze_audio_samples(samples)
            
            # Convert to JSON-serializable format
            result = {
                "timestamp": audio_data.get('timestamp'),
                "acoustic_profile": {
                    "frequency_response": profile.frequency_response,
                    "resonance_frequencies": profile.resonance_frequencies,
                    "reverb_time": profile.reverb_time,
                    "clarity_index": profile.clarity_index,
                    "stereo_width": profile.stereo_width,
                    "phase_coherence": profile.phase_coherence,
                    "noise_floor": profile.noise_floor,
                    "dynamic_range": profile.dynamic_range,
                    "harmonic_distortion": profile.harmonic_distortion,
                    "intermodulation_distortion": profile.intermodulation_distortion
                },
                "recommendations": await self._generate_recommendations(profile)
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in real-time analysis: {e}")
            return {"error": str(e)}

    async def _analyze_audio_samples(self, samples: np.ndarray) -> AcousticProfile:
        """Perform comprehensive acoustic analysis on audio samples"""
        
        # Ensure stereo audio
        if samples.ndim == 1:
            samples = np.column_stack([samples, samples])
        
        left_channel = samples[:, 0] if samples.shape[1] > 0 else samples
        right_channel = samples[:, 1] if samples.shape[1] > 1 else samples
        
        # Frequency response analysis
        frequency_response = await self._analyze_frequency_response(samples)
        
        # Resonance detection
        resonance_frequencies = await self._detect_resonances(samples)
        
        # Reverb time calculation
        reverb_time = await self._calculate_reverb_time(samples)
        
        # Clarity index
        clarity_index = await self._calculate_clarity_index(samples)
        
        # Stereo width analysis
        stereo_width = await self._analyze_stereo_width(left_channel, right_channel)
        
        # Phase coherence
        phase_coherence = await self._analyze_phase_coherence(left_channel, right_channel)
        
        # Noise floor analysis
        noise_floor = await self._analyze_noise_floor(samples)
        
        # Dynamic range
        dynamic_range = await self._calculate_dynamic_range(samples)
        
        # Harmonic distortion
        harmonic_distortion = await self._calculate_harmonic_distortion(samples)
        
        # Intermodulation distortion
        intermodulation_distortion = await self._calculate_intermodulation_distortion(samples)
        
        return AcousticProfile(
            frequency_response=frequency_response,
            resonance_frequencies=resonance_frequencies,
            reverb_time=reverb_time,
            clarity_index=clarity_index,
            stereo_width=stereo_width,
            phase_coherence=phase_coherence,
            noise_floor=noise_floor,
            dynamic_range=dynamic_range,
            harmonic_distortion=harmonic_distortion,
            intermodulation_distortion=intermodulation_distortion
        )

    async def _analyze_frequency_response(self, samples: np.ndarray) -> List[float]:
        """Analyze frequency response of the audio system"""
        # Use Welch's method for power spectral density
        freqs, psd = signal.welch(samples.mean(axis=1), fs=self.sample_rate, nperseg=1024)
        
        # Convert to dB and return as list
        psd_db = 10 * np.log10(psd + 1e-10)
        return psd_db.tolist()

    async def _detect_resonances(self, samples: np.ndarray) -> List[float]:
        """Detect resonance frequencies in the car cabin"""
        # Use peak detection on frequency spectrum
        freqs, psd = signal.welch(samples.mean(axis=1), fs=self.sample_rate)
        
        # Find peaks in the spectrum
        peaks, _ = signal.find_peaks(psd, height=np.max(psd) * 0.1, distance=10)
        
        # Convert peak indices to frequencies
        resonance_freqs = freqs[peaks]
        return resonance_freqs.tolist()

    async def _calculate_reverb_time(self, samples: np.ndarray) -> float:
        """Calculate RT60 reverb time"""
        # Use Schroeder integration method
        squared = samples.mean(axis=1) ** 2
        
        # Schroeder integration (backwards)
        schroeder = np.cumsum(squared[::-1])[::-1]
        schroeder_db = 10 * np.log10(schroeder + 1e-10)
        
        # Find RT60 (60dB decay)
        start_level = np.max(schroeder_db)
        target_level = start_level - 60
        
        # Find where signal drops to target level
        rt60_idx = np.where(schroeder_db <= target_level)[0]
        if len(rt60_idx) > 0:
            rt60_time = rt60_idx[0] / self.sample_rate
            return float(rt60_time)
        
        return 0.0

    async def _calculate_clarity_index(self, samples: np.ndarray) -> float:
        """Calculate C50 clarity index (50ms)"""
        # Calculate energy in first 50ms vs total
        fifty_ms_samples = int(0.05 * self.sample_rate)
        
        early_energy = np.sum(samples[:fifty_ms_samples] ** 2)
        total_energy = np.sum(samples ** 2)
        
        if total_energy > 0:
            clarity = 10 * np.log10(early_energy / (total_energy - early_energy + 1e-10))
            return float(clarity)
        
        return 0.0

    async def _analyze_stereo_width(self, left: np.ndarray, right: np.ndarray) -> float:
        """Analyze stereo width using cross-correlation"""
        if len(left) != len(right):
            min_len = min(len(left), len(right))
            left = left[:min_len]
            right = right[:min_len]
        
        # Calculate cross-correlation
        correlation = np.corrcoef(left, right)[0, 1]
        
        # Convert to stereo width (0 = mono, 1 = full stereo)
        width = (1 - correlation) / 2
        return float(np.clip(width, 0, 1))

    async def _analyze_phase_coherence(self, left: np.ndarray, right: np.ndarray) -> float:
        """Analyze phase coherence between channels"""
        if len(left) != len(right):
            min_len = min(len(left), len(right))
            left = left[:min_len]
            right = right[:min_len]
        
        # Calculate phase difference
        left_fft = fft(left)
        right_fft = fft(right)
        
        phase_diff = np.angle(left_fft) - np.angle(right_fft)
        
        # Calculate coherence
        coherence = np.abs(np.mean(np.exp(1j * phase_diff)))
        return float(coherence)

    async def _analyze_noise_floor(self, samples: np.ndarray) -> float:
        """Analyze noise floor level"""
        # Use quietest 10% of samples as noise floor estimate
        power = samples ** 2
        sorted_power = np.sort(power.flatten())
        noise_samples = int(0.1 * len(sorted_power))
        
        if noise_samples > 0:
            noise_floor = np.mean(sorted_power[:noise_samples])
            noise_floor_db = 10 * np.log10(noise_floor + 1e-10)
            return float(noise_floor_db)
        
        return -100.0

    async def _calculate_dynamic_range(self, samples: np.ndarray) -> float:
        """Calculate dynamic range of the audio"""
        rms = np.sqrt(np.mean(samples ** 2))
        peak = np.max(np.abs(samples))
        
        if rms > 0:
            dynamic_range = 20 * np.log10(peak / rms)
            return float(dynamic_range)
        
        return 0.0

    async def _calculate_harmonic_distortion(self, samples: np.ndarray) -> float:
        """Calculate total harmonic distortion"""
        # Use FFT to find harmonics
        fft_data = np.abs(fft(samples.mean(axis=1)))
        freqs = fftfreq(len(fft_data), 1/self.sample_rate)
        
        # Find fundamental frequency (strongest peak)
        fundamental_idx = np.argmax(fft_data[1:len(fft_data)//2]) + 1
        fundamental_freq = freqs[fundamental_idx]
        
        # Calculate THD
        harmonic_power = 0
        fundamental_power = fft_data[fundamental_idx] ** 2
        
        for harmonic in range(2, 6):  # Check 2nd through 5th harmonics
            harmonic_idx = int(fundamental_idx * harmonic)
            if harmonic_idx < len(fft_data):
                harmonic_power += fft_data[harmonic_idx] ** 2
        
        if fundamental_power > 0:
            thd = np.sqrt(harmonic_power / fundamental_power) * 100
            return float(thd)
        
        return 0.0

    async def _calculate_intermodulation_distortion(self, samples: np.ndarray) -> float:
        """Calculate intermodulation distortion"""
        # Simplified IMD calculation using two-tone test
        # This is a placeholder - real IMD requires specific test signals
        return 0.0

    async def _generate_recommendations(self, profile: AcousticProfile) -> List[Dict[str, Any]]:
        """Generate optimization recommendations based on analysis"""
        recommendations = []
        
        # Resonance recommendations
        if len(profile.resonance_frequencies) > 0:
            recommendations.append({
                "type": "resonance",
                "priority": "high",
                "message": f"Detected resonances at {profile.resonance_frequencies} Hz. Consider EQ adjustments.",
                "action": "eq_adjustment"
            })
        
        # Reverb time recommendations
        if profile.reverb_time > 0.5:
            recommendations.append({
                "type": "reverb",
                "priority": "medium",
                "message": f"High reverb time ({profile.reverb_time:.2f}s). Consider acoustic treatment.",
                "action": "acoustic_treatment"
            })
        
        # Clarity recommendations
        if profile.clarity_index < 0:
            recommendations.append({
                "type": "clarity",
                "priority": "high",
                "message": "Poor clarity index. Check speaker positioning and phase alignment.",
                "action": "speaker_positioning"
            })
        
        # Stereo width recommendations
        if profile.stereo_width < 0.3:
            recommendations.append({
                "type": "stereo",
                "priority": "medium",
                "message": "Narrow stereo image. Check speaker balance and positioning.",
                "action": "stereo_optimization"
            })
        
        return recommendations

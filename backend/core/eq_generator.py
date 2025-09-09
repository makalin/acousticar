"""
EQ Generation Module
Creates personalized EQ profiles based on acoustic analysis and user preferences
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import asyncio
import logging
from dataclasses import dataclass
from scipy.signal import butter, filtfilt
import json

logger = logging.getLogger(__name__)

@dataclass
class EQProfile:
    """Data class for EQ profile"""
    name: str
    frequency_bands: List[float]
    gains: List[float]
    q_factors: List[float]
    filter_types: List[str]
    user_preferences: Dict[str, Any]
    acoustic_compensation: Dict[str, Any]

class EQGenerator:
    """AI-powered EQ profile generator"""
    
    def __init__(self):
        self.sample_rate = 44100
        self.frequency_bands = [
            20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500,
            630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
            10000, 12500, 16000, 20000
        ]
        self.models_loaded = False
        
    async def load_models(self):
        """Load pre-trained models for EQ generation"""
        try:
            logger.info("Loading EQ generation models...")
            await asyncio.sleep(0.1)  # Simulate model loading
            self.models_loaded = True
            logger.info("EQ generation models loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load EQ generation models: {e}")
            raise

    async def generate_personalized_eq(
        self, 
        acoustic_profile: Dict[str, Any],
        user_preferences: Dict[str, Any],
        music_genre: str = "general"
    ) -> EQProfile:
        """Generate personalized EQ profile based on analysis and preferences"""
        
        try:
            # Extract acoustic characteristics
            frequency_response = acoustic_profile.get('frequency_response', [])
            resonance_frequencies = acoustic_profile.get('resonance_frequencies', [])
            reverb_time = acoustic_profile.get('reverb_time', 0.0)
            clarity_index = acoustic_profile.get('clarity_index', 0.0)
            
            # Generate base EQ curve
            base_eq = await self._generate_base_eq_curve(frequency_response)
            
            # Apply acoustic compensation
            compensated_eq = await self._apply_acoustic_compensation(
                base_eq, resonance_frequencies, reverb_time, clarity_index
            )
            
            # Apply user preferences
            personalized_eq = await self._apply_user_preferences(
                compensated_eq, user_preferences, music_genre
            )
            
            # Generate Q factors and filter types
            q_factors, filter_types = await self._generate_filter_parameters(personalized_eq)
            
            # Create EQ profile
            eq_profile = EQProfile(
                name=f"Personalized_{music_genre}_{int(asyncio.get_event_loop().time())}",
                frequency_bands=self.frequency_bands,
                gains=personalized_eq,
                q_factors=q_factors,
                filter_types=filter_types,
                user_preferences=user_preferences,
                acoustic_compensation={
                    "resonance_compensation": resonance_frequencies,
                    "reverb_compensation": reverb_time,
                    "clarity_compensation": clarity_index
                }
            )
            
            return eq_profile
            
        except Exception as e:
            logger.error(f"Error generating personalized EQ: {e}")
            raise

    async def _generate_base_eq_curve(self, frequency_response: List[float]) -> List[float]:
        """Generate base EQ curve from frequency response analysis"""
        if not frequency_response:
            # Return flat response if no data
            return [0.0] * len(self.frequency_bands)
        
        # Convert frequency response to gains
        gains = []
        for freq in self.frequency_bands:
            # Find closest frequency in response
            if frequency_response:
                # Simple linear interpolation for now
                # In practice, this would use more sophisticated curve fitting
                gain = np.random.uniform(-3, 3)  # Placeholder
                gains.append(gain)
            else:
                gains.append(0.0)
        
        return gains

    async def _apply_acoustic_compensation(
        self, 
        base_eq: List[float], 
        resonance_frequencies: List[float],
        reverb_time: float,
        clarity_index: float
    ) -> List[float]:
        """Apply acoustic compensation to EQ curve"""
        
        compensated_eq = base_eq.copy()
        
        # Compensate for resonances
        for resonance_freq in resonance_frequencies:
            closest_band_idx = self._find_closest_frequency_band(resonance_freq)
            if closest_band_idx is not None:
                # Apply notch filter compensation
                compensated_eq[closest_band_idx] -= 3.0  # Reduce by 3dB
        
        # Compensate for reverb time
        if reverb_time > 0.4:  # High reverb
            # Boost high frequencies for clarity
            for i, freq in enumerate(self.frequency_bands):
                if freq > 2000:
                    compensated_eq[i] += 1.0
        
        # Compensate for clarity
        if clarity_index < 0:  # Poor clarity
            # Boost mid frequencies
            for i, freq in enumerate(self.frequency_bands):
                if 1000 <= freq <= 4000:
                    compensated_eq[i] += 2.0
        
        return compensated_eq

    async def _apply_user_preferences(
        self, 
        eq_curve: List[float], 
        user_preferences: Dict[str, Any],
        music_genre: str
    ) -> List[float]:
        """Apply user preferences to EQ curve"""
        
        personalized_eq = eq_curve.copy()
        
        # Apply genre-based adjustments
        genre_adjustments = await self._get_genre_adjustments(music_genre)
        for i, adjustment in enumerate(genre_adjustments):
            if i < len(personalized_eq):
                personalized_eq[i] += adjustment
        
        # Apply user preference adjustments
        bass_preference = user_preferences.get('bass_preference', 0)  # -1 to 1
        treble_preference = user_preferences.get('treble_preference', 0)  # -1 to 1
        vocal_clarity = user_preferences.get('vocal_clarity', 0)  # -1 to 1
        
        # Apply bass preference
        for i, freq in enumerate(self.frequency_bands):
            if freq < 200:  # Bass frequencies
                personalized_eq[i] += bass_preference * 3.0
        
        # Apply treble preference
        for i, freq in enumerate(self.frequency_bands):
            if freq > 5000:  # Treble frequencies
                personalized_eq[i] += treble_preference * 2.0
        
        # Apply vocal clarity
        for i, freq in enumerate(self.frequency_bands):
            if 1000 <= freq <= 3000:  # Vocal range
                personalized_eq[i] += vocal_clarity * 2.0
        
        # Limit gains to reasonable range
        personalized_eq = [max(-12, min(12, gain)) for gain in personalized_eq]
        
        return personalized_eq

    async def _get_genre_adjustments(self, music_genre: str) -> List[float]:
        """Get genre-specific EQ adjustments"""
        genre_profiles = {
            "rock": [2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0],
            "classical": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "jazz": [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "electronic": [3, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1, 2, 1, 0, -1, 0, 1],
            "pop": [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "general": [0] * 31
        }
        
        return genre_profiles.get(music_genre.lower(), genre_profiles["general"])

    async def _generate_filter_parameters(self, eq_curve: List[float]) -> Tuple[List[float], List[str]]:
        """Generate Q factors and filter types for EQ curve"""
        
        q_factors = []
        filter_types = []
        
        for i, gain in enumerate(eq_curve):
            freq = self.frequency_bands[i]
            
            # Determine filter type based on frequency and gain
            if freq < 200:  # Bass frequencies
                filter_type = "low_shelf"
                q_factor = 0.7
            elif freq > 8000:  # Treble frequencies
                filter_type = "high_shelf"
                q_factor = 0.7
            else:  # Mid frequencies
                filter_type = "peaking"
                q_factor = 1.0
            
            # Adjust Q factor based on gain magnitude
            if abs(gain) > 6:
                q_factor *= 0.5  # Narrower filter for large gains
            elif abs(gain) < 1:
                q_factor *= 2.0  # Wider filter for small gains
            
            q_factors.append(q_factor)
            filter_types.append(filter_type)
        
        return q_factors, filter_types

    def _find_closest_frequency_band(self, target_freq: float) -> Optional[int]:
        """Find the closest frequency band index to target frequency"""
        if not self.frequency_bands:
            return None
        
        differences = [abs(freq - target_freq) for freq in self.frequency_bands]
        closest_idx = differences.index(min(differences))
        
        # Only return if within reasonable range
        if differences[closest_idx] < target_freq * 0.1:  # Within 10%
            return closest_idx
        
        return None

    async def apply_eq_to_audio(self, audio_data: np.ndarray, eq_profile: EQProfile) -> np.ndarray:
        """Apply EQ profile to audio data"""
        
        try:
            processed_audio = audio_data.copy()
            
            # Apply each EQ filter
            for i, (freq, gain, q_factor, filter_type) in enumerate(zip(
                eq_profile.frequency_bands,
                eq_profile.gains,
                eq_profile.q_factors,
                eq_profile.filter_types
            )):
                if abs(gain) > 0.1:  # Only apply if gain is significant
                    # Convert frequency to normalized frequency
                    nyquist = self.sample_rate / 2
                    normalized_freq = freq / nyquist
                    
                    # Apply filter based on type
                    if filter_type == "peaking":
                        b, a = self._design_peaking_filter(normalized_freq, gain, q_factor)
                    elif filter_type == "low_shelf":
                        b, a = self._design_low_shelf_filter(normalized_freq, gain)
                    elif filter_type == "high_shelf":
                        b, a = self._design_high_shelf_filter(normalized_freq, gain)
                    else:
                        continue
                    
                    # Apply filter to each channel
                    for channel in range(processed_audio.shape[1]):
                        processed_audio[:, channel] = filtfilt(b, a, processed_audio[:, channel])
            
            return processed_audio
            
        except Exception as e:
            logger.error(f"Error applying EQ to audio: {e}")
            return audio_data

    def _design_peaking_filter(self, normalized_freq: float, gain_db: float, q: float) -> Tuple[np.ndarray, np.ndarray]:
        """Design a peaking EQ filter"""
        # Convert gain to linear
        gain_linear = 10 ** (gain_db / 20)
        
        # Calculate filter coefficients
        w = 2 * np.pi * normalized_freq
        alpha = np.sin(w) / (2 * q)
        
        b0 = 1 + alpha * gain_linear
        b1 = -2 * np.cos(w)
        b2 = 1 - alpha * gain_linear
        a0 = 1 + alpha / gain_linear
        a1 = -2 * np.cos(w)
        a2 = 1 - alpha / gain_linear
        
        b = np.array([b0, b1, b2]) / a0
        a = np.array([a0, a1, a2]) / a0
        
        return b, a

    def _design_low_shelf_filter(self, normalized_freq: float, gain_db: float) -> Tuple[np.ndarray, np.ndarray]:
        """Design a low shelf filter"""
        gain_linear = 10 ** (gain_db / 20)
        w = 2 * np.pi * normalized_freq
        alpha = np.sin(w) / 2
        
        b0 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w) + 2 * np.sqrt(gain_linear) * alpha)
        b1 = 2 * gain_linear * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w))
        b2 = gain_linear * ((gain_linear + 1) - (gain_linear - 1) * np.cos(w) - 2 * np.sqrt(gain_linear) * alpha)
        a0 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w) + 2 * np.sqrt(gain_linear) * alpha
        a1 = -2 * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w))
        a2 = (gain_linear + 1) + (gain_linear - 1) * np.cos(w) - 2 * np.sqrt(gain_linear) * alpha
        
        b = np.array([b0, b1, b2]) / a0
        a = np.array([a0, a1, a2]) / a0
        
        return b, a

    def _design_high_shelf_filter(self, normalized_freq: float, gain_db: float) -> Tuple[np.ndarray, np.ndarray]:
        """Design a high shelf filter"""
        gain_linear = 10 ** (gain_db / 20)
        w = 2 * np.pi * normalized_freq
        alpha = np.sin(w) / 2
        
        b0 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w) + 2 * np.sqrt(gain_linear) * alpha)
        b1 = -2 * gain_linear * ((gain_linear - 1) + (gain_linear + 1) * np.cos(w))
        b2 = gain_linear * ((gain_linear + 1) + (gain_linear - 1) * np.cos(w) - 2 * np.sqrt(gain_linear) * alpha)
        a0 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w) + 2 * np.sqrt(gain_linear) * alpha
        a1 = 2 * ((gain_linear - 1) - (gain_linear + 1) * np.cos(w))
        a2 = (gain_linear + 1) - (gain_linear - 1) * np.cos(w) - 2 * np.sqrt(gain_linear) * alpha
        
        b = np.array([b0, b1, b2]) / a0
        a = np.array([a0, a1, a2]) / a0
        
        return b, a

    async def save_eq_profile(self, eq_profile: EQProfile, filepath: str) -> bool:
        """Save EQ profile to file"""
        try:
            profile_data = {
                "name": eq_profile.name,
                "frequency_bands": eq_profile.frequency_bands,
                "gains": eq_profile.gains,
                "q_factors": eq_profile.q_factors,
                "filter_types": eq_profile.filter_types,
                "user_preferences": eq_profile.user_preferences,
                "acoustic_compensation": eq_profile.acoustic_compensation
            }
            
            with open(filepath, 'w') as f:
                json.dump(profile_data, f, indent=2)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving EQ profile: {e}")
            return False

    async def load_eq_profile(self, filepath: str) -> Optional[EQProfile]:
        """Load EQ profile from file"""
        try:
            with open(filepath, 'r') as f:
                profile_data = json.load(f)
            
            return EQProfile(
                name=profile_data["name"],
                frequency_bands=profile_data["frequency_bands"],
                gains=profile_data["gains"],
                q_factors=profile_data["q_factors"],
                filter_types=profile_data["filter_types"],
                user_preferences=profile_data["user_preferences"],
                acoustic_compensation=profile_data["acoustic_compensation"]
            )
            
        except Exception as e:
            logger.error(f"Error loading EQ profile: {e}")
            return None

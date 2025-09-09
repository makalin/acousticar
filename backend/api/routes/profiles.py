"""
Profiles API Routes
Handles user profiles and preferences management
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import asyncio
import logging
from pydantic import BaseModel
import json
import os
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

class UserProfile(BaseModel):
    user_id: str
    name: str
    preferences: Dict[str, Any]
    created_at: str
    updated_at: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class ProfileResponse(BaseModel):
    profile: UserProfile
    message: str

# In-memory storage for demo (would use database in production)
profiles_storage = {}

@router.post("/create", response_model=ProfileResponse)
async def create_profile(profile: UserProfile):
    """Create a new user profile"""
    try:
        # Check if profile already exists
        if profile.user_id in profiles_storage:
            raise HTTPException(status_code=400, detail="Profile already exists")
        
        # Store profile
        profiles_storage[profile.user_id] = profile.dict()
        
        return ProfileResponse(
            profile=profile,
            message="Profile created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", response_model=ProfileResponse)
async def get_profile(user_id: str):
    """Get user profile by ID"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = profiles_storage[user_id]
        profile = UserProfile(**profile_data)
        
        return ProfileResponse(
            profile=profile,
            message="Profile retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}", response_model=ProfileResponse)
async def update_profile(user_id: str, update_request: ProfileUpdateRequest):
    """Update user profile"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Get existing profile
        profile_data = profiles_storage[user_id]
        profile = UserProfile(**profile_data)
        
        # Update fields
        if update_request.name is not None:
            profile.name = update_request.name
        
        if update_request.preferences is not None:
            profile.preferences.update(update_request.preferences)
        
        # Update timestamp
        profile.updated_at = datetime.now().isoformat()
        
        # Store updated profile
        profiles_storage[user_id] = profile.dict()
        
        return ProfileResponse(
            profile=profile,
            message="Profile updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}")
async def delete_profile(user_id: str):
    """Delete user profile"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        del profiles_storage[user_id]
        
        return {"message": "Profile deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[UserProfile])
async def list_profiles():
    """List all user profiles"""
    try:
        profiles = [UserProfile(**data) for data in profiles_storage.values()]
        return profiles
        
    except Exception as e:
        logger.error(f"Error listing profiles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/preferences")
async def update_preferences(user_id: str, preferences: Dict[str, Any]):
    """Update user preferences"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Get existing profile
        profile_data = profiles_storage[user_id]
        profile = UserProfile(**profile_data)
        
        # Update preferences
        profile.preferences.update(preferences)
        profile.updated_at = datetime.now().isoformat()
        
        # Store updated profile
        profiles_storage[user_id] = profile.dict()
        
        return {
            "message": "Preferences updated successfully",
            "preferences": profile.preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/preferences")
async def get_preferences(user_id: str):
    """Get user preferences"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = profiles_storage[user_id]
        profile = UserProfile(**profile_data)
        
        return {
            "user_id": user_id,
            "preferences": profile.preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/reset-preferences")
async def reset_preferences(user_id: str):
    """Reset user preferences to defaults"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Get existing profile
        profile_data = profiles_storage[user_id]
        profile = UserProfile(**profile_data)
        
        # Reset to default preferences
        default_preferences = {
            "bass_preference": 0.0,
            "treble_preference": 0.0,
            "vocal_clarity": 0.0,
            "soundstage_width": 0.5,
            "height_preference": 0.5,
            "depth_preference": 0.5,
            "music_genre": "general",
            "listening_environment": "car",
            "speaker_count": 2,
            "subwoofer_present": False,
            "amplifier_power": 50,
            "cabin_size": "medium"
        }
        
        profile.preferences = default_preferences
        profile.updated_at = datetime.now().isoformat()
        
        # Store updated profile
        profiles_storage[user_id] = profile.dict()
        
        return {
            "message": "Preferences reset to defaults",
            "preferences": profile.preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/recommendations")
async def get_recommendations(user_id: str):
    """Get personalized recommendations based on user profile"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = profiles_storage[user_id]
        profile = UserProfile(**profile_data)
        preferences = profile.preferences
        
        # Generate recommendations based on preferences
        recommendations = []
        
        # Bass recommendations
        if preferences.get("bass_preference", 0) > 0.5:
            recommendations.append({
                "type": "bass_enhancement",
                "priority": "medium",
                "message": "Consider adding a subwoofer for enhanced bass response",
                "action": "add_subwoofer"
            })
        
        # Treble recommendations
        if preferences.get("treble_preference", 0) > 0.5:
            recommendations.append({
                "type": "treble_enhancement",
                "priority": "low",
                "message": "High-frequency drivers may need positioning adjustment",
                "action": "adjust_tweeter_position"
            })
        
        # Soundstage recommendations
        if preferences.get("soundstage_width", 0.5) < 0.3:
            recommendations.append({
                "type": "stereo_imaging",
                "priority": "high",
                "message": "Speaker positioning needs adjustment for wider soundstage",
                "action": "adjust_speaker_position"
            })
        
        # Cabin size recommendations
        cabin_size = preferences.get("cabin_size", "medium")
        if cabin_size == "small":
            recommendations.append({
                "type": "acoustic_treatment",
                "priority": "medium",
                "message": "Small cabin may benefit from acoustic damping materials",
                "action": "add_acoustic_treatment"
            })
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/export")
async def export_profile(user_id: str):
    """Export user profile to JSON file"""
    try:
        if user_id not in profiles_storage:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = profiles_storage[user_id]
        
        # Create export directory if it doesn't exist
        export_dir = "exports"
        os.makedirs(export_dir, exist_ok=True)
        
        # Export profile
        export_filename = f"{export_dir}/profile_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(export_filename, 'w') as f:
            json.dump(profile_data, f, indent=2)
        
        return {
            "message": "Profile exported successfully",
            "filename": export_filename,
            "exported_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/import")
async def import_profile(user_id: str, profile_data: Dict[str, Any]):
    """Import user profile from JSON data"""
    try:
        # Validate profile data
        required_fields = ["user_id", "name", "preferences", "created_at", "updated_at"]
        for field in required_fields:
            if field not in profile_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Create profile object
        profile = UserProfile(**profile_data)
        
        # Store profile
        profiles_storage[user_id] = profile.dict()
        
        return {
            "message": "Profile imported successfully",
            "profile": profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

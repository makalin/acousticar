"""
WebSocket API Routes
Handles real-time audio streaming and analysis
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import asyncio
import logging
import json
import numpy as np
from datetime import datetime

from core.acoustic_analyzer import AcousticAnalyzer
from core.eq_generator import EQGenerator
from core.soundstage_optimizer import SoundstageOptimizer

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize core components
acoustic_analyzer = AcousticAnalyzer()
eq_generator = EQGenerator()
soundstage_optimizer = SoundstageOptimizer()

class ConnectionManager:
    """Manages WebSocket connections for real-time audio processing"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_data: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str = None):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Initialize connection data
        self.connection_data[websocket] = {
            "client_id": client_id or f"client_{len(self.active_connections)}",
            "connected_at": datetime.now().isoformat(),
            "audio_buffer": [],
            "analysis_enabled": True,
            "eq_enabled": False,
            "soundstage_enabled": False,
            "user_preferences": {}
        }
        
        logger.info(f"Client {self.connection_data[websocket]['client_id']} connected")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.active_connections:
            client_id = self.connection_data.get(websocket, {}).get("client_id", "unknown")
            self.active_connections.remove(websocket)
            if websocket in self.connection_data:
                del self.connection_data[websocket]
            logger.info(f"Client {client_id} disconnected")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
            self.disconnect(websocket)
    
    async def send_json_message(self, data: Dict[str, Any], websocket: WebSocket):
        """Send JSON message to specific client"""
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            logger.error(f"Error sending JSON message to client: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: str):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                self.disconnect(connection)
    
    async def broadcast_json(self, data: Dict[str, Any]):
        """Broadcast JSON data to all connected clients"""
        message = json.dumps(data)
        await self.broadcast(message)

# Global connection manager
manager = ConnectionManager()

@router.websocket("/audio-stream")
async def audio_stream_websocket(websocket: WebSocket, client_id: str = None):
    """WebSocket endpoint for real-time audio streaming and analysis"""
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive audio data from client
            data = await websocket.receive_text()
            
            try:
                audio_data = json.loads(data)
                await process_audio_data(websocket, audio_data)
            except json.JSONDecodeError:
                # Handle non-JSON messages (commands)
                await handle_command(websocket, data)
            except Exception as e:
                logger.error(f"Error processing audio data: {e}")
                await manager.send_json_message({
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def process_audio_data(websocket: WebSocket, audio_data: Dict[str, Any]):
    """Process incoming audio data"""
    connection_data = manager.connection_data.get(websocket, {})
    
    if not connection_data.get("analysis_enabled", True):
        return
    
    try:
        # Extract audio samples
        samples = audio_data.get("samples", [])
        if not samples:
            return
        
        # Convert to numpy array
        audio_array = np.array(samples, dtype=np.float32)
        
        # Store in buffer
        connection_data["audio_buffer"].append(audio_array)
        
        # Keep only last 10 seconds of audio
        max_buffer_size = 10 * 44100  # 10 seconds at 44.1kHz
        total_samples = sum(len(buf) for buf in connection_data["audio_buffer"])
        if total_samples > max_buffer_size:
            # Remove oldest samples
            while total_samples > max_buffer_size and connection_data["audio_buffer"]:
                removed = connection_data["audio_buffer"].pop(0)
                total_samples -= len(removed)
        
        # Perform real-time analysis
        analysis_result = await acoustic_analyzer.analyze_realtime({
            "samples": audio_array.tolist(),
            "timestamp": audio_data.get("timestamp", datetime.now().isoformat())
        })
        
        # Send analysis results
        await manager.send_json_message({
            "type": "analysis_result",
            "data": analysis_result,
            "timestamp": datetime.now().isoformat()
        }, websocket)
        
        # Apply EQ if enabled
        if connection_data.get("eq_enabled", False):
            eq_profile = connection_data.get("eq_profile")
            if eq_profile:
                processed_audio = await eq_generator.apply_eq_to_audio(audio_array, eq_profile)
                
                # Send processed audio back
                await manager.send_json_message({
                    "type": "processed_audio",
                    "samples": processed_audio.tolist(),
                    "timestamp": datetime.now().isoformat()
                }, websocket)
        
        # Apply soundstage optimization if enabled
        if connection_data.get("soundstage_enabled", False):
            soundstage_profile = connection_data.get("soundstage_profile")
            if soundstage_profile:
                optimized_audio = await soundstage_optimizer.apply_soundstage_optimization(
                    audio_array, soundstage_profile
                )
                
                # Send optimized audio back
                await manager.send_json_message({
                    "type": "optimized_audio",
                    "samples": optimized_audio.tolist(),
                    "timestamp": datetime.now().isoformat()
                }, websocket)
        
    except Exception as e:
        logger.error(f"Error processing audio data: {e}")
        await manager.send_json_message({
            "type": "error",
            "message": f"Audio processing error: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }, websocket)

async def handle_command(websocket: WebSocket, command: str):
    """Handle non-JSON commands from client"""
    connection_data = manager.connection_data.get(websocket, {})
    
    try:
        if command == "ping":
            await manager.send_json_message({
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        elif command == "get_status":
            await manager.send_json_message({
                "type": "status",
                "data": {
                    "client_id": connection_data.get("client_id"),
                    "connected_at": connection_data.get("connected_at"),
                    "analysis_enabled": connection_data.get("analysis_enabled", True),
                    "eq_enabled": connection_data.get("eq_enabled", False),
                    "soundstage_enabled": connection_data.get("soundstage_enabled", False),
                    "buffer_size": len(connection_data.get("audio_buffer", [])),
                    "active_connections": len(manager.active_connections)
                },
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        elif command == "toggle_analysis":
            connection_data["analysis_enabled"] = not connection_data.get("analysis_enabled", True)
            await manager.send_json_message({
                "type": "analysis_toggled",
                "enabled": connection_data["analysis_enabled"],
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        elif command == "clear_buffer":
            connection_data["audio_buffer"] = []
            await manager.send_json_message({
                "type": "buffer_cleared",
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        else:
            await manager.send_json_message({
                "type": "error",
                "message": f"Unknown command: {command}",
                "timestamp": datetime.now().isoformat()
            }, websocket)
    
    except Exception as e:
        logger.error(f"Error handling command: {e}")
        await manager.send_json_message({
            "type": "error",
            "message": f"Command error: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }, websocket)

@router.websocket("/control")
async def control_websocket(websocket: WebSocket, client_id: str = None):
    """WebSocket endpoint for control commands"""
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                command_data = json.loads(data)
                await handle_control_command(websocket, command_data)
            except json.JSONDecodeError:
                await manager.send_json_message({
                    "type": "error",
                    "message": "Invalid JSON command",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
            except Exception as e:
                logger.error(f"Error handling control command: {e}")
                await manager.send_json_message({
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.now().isoformat()
                }, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Control WebSocket error: {e}")
        manager.disconnect(websocket)

async def handle_control_command(websocket: WebSocket, command_data: Dict[str, Any]):
    """Handle control commands from client"""
    connection_data = manager.connection_data.get(websocket, {})
    command_type = command_data.get("type")
    
    try:
        if command_type == "set_preferences":
            preferences = command_data.get("preferences", {})
            connection_data["user_preferences"] = preferences
            
            await manager.send_json_message({
                "type": "preferences_updated",
                "preferences": preferences,
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        elif command_type == "enable_eq":
            eq_profile_data = command_data.get("eq_profile")
            if eq_profile_data:
                # Convert to EQProfile object
                from core.eq_generator import EQProfile
                eq_profile = EQProfile(
                    name=eq_profile_data["name"],
                    frequency_bands=eq_profile_data["frequency_bands"],
                    gains=eq_profile_data["gains"],
                    q_factors=eq_profile_data["q_factors"],
                    filter_types=eq_profile_data["filter_types"],
                    user_preferences=eq_profile_data["user_preferences"],
                    acoustic_compensation=eq_profile_data["acoustic_compensation"]
                )
                
                connection_data["eq_profile"] = eq_profile
                connection_data["eq_enabled"] = True
                
                await manager.send_json_message({
                    "type": "eq_enabled",
                    "profile_name": eq_profile.name,
                    "timestamp": datetime.now().isoformat()
                }, websocket)
        
        elif command_type == "disable_eq":
            connection_data["eq_enabled"] = False
            connection_data["eq_profile"] = None
            
            await manager.send_json_message({
                "type": "eq_disabled",
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        elif command_type == "enable_soundstage":
            soundstage_profile_data = command_data.get("soundstage_profile")
            if soundstage_profile_data:
                # Convert to SoundstageProfile object
                from core.soundstage_optimizer import SoundstageProfile
                soundstage_profile = SoundstageProfile(
                    stereo_width=soundstage_profile_data["stereo_width"],
                    center_image_strength=soundstage_profile_data["center_image_strength"],
                    depth_perception=soundstage_profile_data["depth_perception"],
                    height_perception=soundstage_profile_data["height_perception"],
                    left_right_balance=soundstage_profile_data["left_right_balance"],
                    front_back_positioning=soundstage_profile_data["front_back_positioning"],
                    spatial_coherence=soundstage_profile_data["spatial_coherence"],
                    crosstalk_compensation=soundstage_profile_data["crosstalk_compensation"],
                    hrtf_compensation=soundstage_profile_data["hrtf_compensation"]
                )
                
                connection_data["soundstage_profile"] = soundstage_profile
                connection_data["soundstage_enabled"] = True
                
                await manager.send_json_message({
                    "type": "soundstage_enabled",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
        
        elif command_type == "disable_soundstage":
            connection_data["soundstage_enabled"] = False
            connection_data["soundstage_profile"] = None
            
            await manager.send_json_message({
                "type": "soundstage_disabled",
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        elif command_type == "get_connection_info":
            await manager.send_json_message({
                "type": "connection_info",
                "data": {
                    "client_id": connection_data.get("client_id"),
                    "connected_at": connection_data.get("connected_at"),
                    "analysis_enabled": connection_data.get("analysis_enabled", True),
                    "eq_enabled": connection_data.get("eq_enabled", False),
                    "soundstage_enabled": connection_data.get("soundstage_enabled", False),
                    "user_preferences": connection_data.get("user_preferences", {}),
                    "active_connections": len(manager.active_connections)
                },
                "timestamp": datetime.now().isoformat()
            }, websocket)
        
        else:
            await manager.send_json_message({
                "type": "error",
                "message": f"Unknown command type: {command_type}",
                "timestamp": datetime.now().isoformat()
            }, websocket)
    
    except Exception as e:
        logger.error(f"Error handling control command: {e}")
        await manager.send_json_message({
            "type": "error",
            "message": f"Control command error: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }, websocket)

@router.get("/connections")
async def get_connection_info():
    """Get information about active connections"""
    return {
        "active_connections": len(manager.active_connections),
        "connections": [
            {
                "client_id": data.get("client_id"),
                "connected_at": data.get("connected_at"),
                "analysis_enabled": data.get("analysis_enabled", True),
                "eq_enabled": data.get("eq_enabled", False),
                "soundstage_enabled": data.get("soundstage_enabled", False)
            }
            for data in manager.connection_data.values()
        ],
        "timestamp": datetime.now().isoformat()
    }

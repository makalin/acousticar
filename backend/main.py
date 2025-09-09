"""
AcoustiCar Backend API
Main FastAPI application for acoustic analysis and audio optimization
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import asyncio
import json
from typing import List, Dict, Any
import logging

from api.routes import audio, profiles, analysis, websocket
from core.acoustic_analyzer import AcousticAnalyzer
from core.eq_generator import EQGenerator
from core.soundstage_optimizer import SoundstageOptimizer
from models.database import init_db
from config.settings import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AcoustiCar API",
    description="AI-Powered Car Audio Optimization API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core components
acoustic_analyzer = AcousticAnalyzer()
eq_generator = EQGenerator()
soundstage_optimizer = SoundstageOptimizer()

# Include API routes
app.include_router(audio.router, prefix="/api/audio", tags=["audio"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove disconnected connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive audio data from client
            data = await websocket.receive_text()
            audio_data = json.loads(data)
            
            # Process audio data
            analysis_result = await acoustic_analyzer.analyze_realtime(audio_data)
            
            # Send analysis results back
            await manager.send_personal_message(
                json.dumps(analysis_result), 
                websocket
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.on_event("startup")
async def startup_event():
    """Initialize database and load models on startup"""
    await init_db()
    await acoustic_analyzer.load_models()
    await eq_generator.load_models()
    await soundstage_optimizer.load_models()
    logger.info("AcoustiCar backend started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("AcoustiCar backend shutting down")

@app.get("/")
async def root():
    return {
        "message": "AcoustiCar API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

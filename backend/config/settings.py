"""
Configuration Settings
Handles application configuration and environment variables
"""

import os
from typing import Optional, Dict, Any
from pydantic import BaseSettings, Field
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings"""
    
    # Application settings
    app_name: str = "AcoustiCar API"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # Server settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Database settings
    database_url: str = Field(default="sqlite:///./acousticar.db", env="DATABASE_URL")
    database_echo: bool = Field(default=False, env="DATABASE_ECHO")
    
    # Audio processing settings
    sample_rate: int = Field(default=44100, env="SAMPLE_RATE")
    buffer_size: int = Field(default=1024, env="BUFFER_SIZE")
    max_audio_duration: int = Field(default=300, env="MAX_AUDIO_DURATION")  # 5 minutes
    
    # Analysis settings
    analysis_window_size: int = Field(default=4096, env="ANALYSIS_WINDOW_SIZE")
    analysis_hop_length: int = Field(default=1024, env="ANALYSIS_HOP_LENGTH")
    fft_size: int = Field(default=4096, env="FFT_SIZE")
    
    # EQ settings
    eq_bands: int = Field(default=31, env="EQ_BANDS")
    eq_frequency_range: tuple = (20, 20000)  # Hz
    max_eq_gain: float = Field(default=12.0, env="MAX_EQ_GAIN")  # dB
    min_eq_gain: float = Field(default=-12.0, env="MIN_EQ_GAIN")  # dB
    
    # Soundstage settings
    hrtf_enabled: bool = Field(default=True, env="HRTF_ENABLED")
    crosstalk_compensation: bool = Field(default=True, env="CROSSTALK_COMPENSATION")
    spatial_enhancement: bool = Field(default=True, env="SPATIAL_ENHANCEMENT")
    
    # WebSocket settings
    websocket_ping_interval: int = Field(default=30, env="WEBSOCKET_PING_INTERVAL")
    websocket_ping_timeout: int = Field(default=10, env="WEBSOCKET_PING_TIMEOUT")
    max_websocket_connections: int = Field(default=100, env="MAX_WEBSOCKET_CONNECTIONS")
    
    # CORS settings
    cors_origins: list = Field(default=["http://localhost:3000", "http://localhost:3001"], env="CORS_ORIGINS")
    cors_allow_credentials: bool = Field(default=True, env="CORS_ALLOW_CREDENTIALS")
    cors_allow_methods: list = Field(default=["*"], env="CORS_ALLOW_METHODS")
    cors_allow_headers: list = Field(default=["*"], env="CORS_ALLOW_HEADERS")
    
    # Security settings
    secret_key: str = Field(default="your-secret-key-here", env="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    
    # File upload settings
    max_file_size: int = Field(default=50 * 1024 * 1024, env="MAX_FILE_SIZE")  # 50MB
    allowed_audio_formats: list = Field(default=["wav", "mp3", "flac", "aac", "ogg", "m4a"], env="ALLOWED_AUDIO_FORMATS")
    upload_directory: str = Field(default="uploads", env="UPLOAD_DIRECTORY")
    
    # Logging settings
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: Optional[str] = Field(default=None, env="LOG_FILE")
    log_format: str = Field(default="%(asctime)s - %(name)s - %(levelname)s - %(message)s", env="LOG_FORMAT")
    
    # Performance settings
    max_concurrent_analyses: int = Field(default=10, env="MAX_CONCURRENT_ANALYSES")
    analysis_timeout: int = Field(default=30, env="ANALYSIS_TIMEOUT")  # seconds
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")  # seconds
    
    # Model settings
    model_directory: str = Field(default="models", env="MODEL_DIRECTORY")
    model_cache_size: int = Field(default=100, env="MODEL_CACHE_SIZE")
    model_loading_timeout: int = Field(default=60, env="MODEL_LOADING_TIMEOUT")  # seconds
    
    # Audio device settings
    audio_device_index: Optional[int] = Field(default=None, env="AUDIO_DEVICE_INDEX")
    audio_channels: int = Field(default=2, env="AUDIO_CHANNELS")
    audio_format: str = Field(default="int16", env="AUDIO_FORMAT")
    
    # Real-time processing settings
    real_time_enabled: bool = Field(default=True, env="REAL_TIME_ENABLED")
    real_time_buffer_size: int = Field(default=1024, env="REAL_TIME_BUFFER_SIZE")
    real_time_latency: float = Field(default=0.1, env="REAL_TIME_LATENCY")  # seconds
    
    # Monitoring settings
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    health_check_interval: int = Field(default=30, env="HEALTH_CHECK_INTERVAL")  # seconds
    
    # Development settings
    reload: bool = Field(default=False, env="RELOAD")
    workers: int = Field(default=1, env="WORKERS")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Global settings instance
_settings: Optional[Settings] = None

def get_settings() -> Settings:
    """Get application settings"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

def update_settings(**kwargs) -> None:
    """Update settings with new values"""
    global _settings
    if _settings is None:
        _settings = Settings()
    
    for key, value in kwargs.items():
        if hasattr(_settings, key):
            setattr(_settings, key, value)
        else:
            logger.warning(f"Unknown setting: {key}")

def get_setting(key: str, default: Any = None) -> Any:
    """Get specific setting value"""
    settings = get_settings()
    return getattr(settings, key, default)

def validate_settings() -> bool:
    """Validate settings configuration"""
    try:
        settings = get_settings()
        
        # Validate required settings
        if not settings.secret_key or settings.secret_key == "your-secret-key-here":
            logger.warning("Using default secret key. Please set SECRET_KEY environment variable.")
        
        # Validate audio settings
        if settings.sample_rate not in [44100, 48000, 96000]:
            logger.warning(f"Unusual sample rate: {settings.sample_rate}")
        
        if settings.buffer_size <= 0:
            raise ValueError("Buffer size must be positive")
        
        # Validate file upload settings
        if settings.max_file_size <= 0:
            raise ValueError("Max file size must be positive")
        
        # Validate performance settings
        if settings.max_concurrent_analyses <= 0:
            raise ValueError("Max concurrent analyses must be positive")
        
        logger.info("Settings validation passed")
        return True
        
    except Exception as e:
        logger.error(f"Settings validation failed: {e}")
        return False

def get_audio_settings() -> Dict[str, Any]:
    """Get audio-specific settings"""
    settings = get_settings()
    return {
        "sample_rate": settings.sample_rate,
        "buffer_size": settings.buffer_size,
        "channels": settings.audio_channels,
        "format": settings.audio_format,
        "device_index": settings.audio_device_index,
        "max_duration": settings.max_audio_duration
    }

def get_analysis_settings() -> Dict[str, Any]:
    """Get analysis-specific settings"""
    settings = get_settings()
    return {
        "window_size": settings.analysis_window_size,
        "hop_length": settings.analysis_hop_length,
        "fft_size": settings.fft_size,
        "max_concurrent": settings.max_concurrent_analyses,
        "timeout": settings.analysis_timeout
    }

def get_websocket_settings() -> Dict[str, Any]:
    """Get WebSocket-specific settings"""
    settings = get_settings()
    return {
        "ping_interval": settings.websocket_ping_interval,
        "ping_timeout": settings.websocket_ping_timeout,
        "max_connections": settings.max_websocket_connections
    }

def get_cors_settings() -> Dict[str, Any]:
    """Get CORS-specific settings"""
    settings = get_settings()
    return {
        "origins": settings.cors_origins,
        "allow_credentials": settings.cors_allow_credentials,
        "allow_methods": settings.cors_allow_methods,
        "allow_headers": settings.cors_allow_headers
    }

# Environment-specific configurations
def get_development_settings() -> Settings:
    """Get development-specific settings"""
    settings = Settings()
    settings.debug = True
    settings.reload = True
    settings.log_level = "DEBUG"
    settings.cors_origins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]
    return settings

def get_production_settings() -> Settings:
    """Get production-specific settings"""
    settings = Settings()
    settings.debug = False
    settings.reload = False
    settings.log_level = "INFO"
    settings.workers = 4
    settings.max_websocket_connections = 1000
    return settings

def get_test_settings() -> Settings:
    """Get test-specific settings"""
    settings = Settings()
    settings.debug = True
    settings.database_url = "sqlite:///./test_acousticar.db"
    settings.log_level = "WARNING"
    settings.max_concurrent_analyses = 1
    return settings

# Initialize settings based on environment
def initialize_settings(environment: str = "development") -> Settings:
    """Initialize settings based on environment"""
    global _settings
    
    if environment == "development":
        _settings = get_development_settings()
    elif environment == "production":
        _settings = get_production_settings()
    elif environment == "test":
        _settings = get_test_settings()
    else:
        _settings = Settings()
    
    # Validate settings
    if not validate_settings():
        logger.warning("Settings validation failed, using defaults")
    
    return _settings

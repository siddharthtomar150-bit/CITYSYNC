import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "CITYSYNC"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"

    # Security
    SECRET_KEY: str = "citysync-super-secret-jwt-key-for-hackathon-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./citysync.db"

    # Simulation engine
    SIMULATION_INTERVAL_SECONDS: int = 4
    SIMULATION_AUTO_START: bool = True

    # Server & CORS
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]

    # Paths
    FRONTEND_DIR: Path = BASE_DIR / "frontend"

settings = Settings()

from pydantic_settings import BaseSettings
from typing import List
import os


def _find_env_file() -> str:
    """Walk up from backend/ to find the root .env file."""
    current = os.path.dirname(os.path.abspath(__file__))
    for _ in range(4):
        candidate = os.path.join(current, ".env")
        if os.path.isfile(candidate):
            return candidate
        current = os.path.dirname(current)
    return ".env"  # fallback


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str = ""
    MONGODB_DB_NAME: str = "taskmanager"

    # JWT
    SECRET_KEY: str = "T@skM@n4g3r$ecr3tKey!2026#Ultra$ecure&L0ng"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Frontend
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000/api/v1"

    # Server
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 3000

    # App
    APP_NAME: str = "Team Task Manager"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = _find_env_file()
        extra = "ignore"


settings = Settings()

from functools import lru_cache
import os


class Settings:
    def __init__(self) -> None:
        self.app_env = os.getenv("APP_ENV", "local")
        self.api_host = os.getenv("API_HOST", "0.0.0.0")
        self.api_port = int(os.getenv("API_PORT", "8000"))
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://hub:hub@localhost:5432/hub",
        )
        origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
        self.cors_origins = [origin.strip() for origin in origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

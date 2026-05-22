from functools import lru_cache
import os


class Settings:
    def __init__(self) -> None:
        self.app_env = os.getenv("APP_ENV", "local")
        self.api_host = os.getenv("API_HOST", "0.0.0.0")
        self.api_port = int(os.getenv("API_PORT", "8000"))
        self.api_host_port = int(os.getenv("API_HOST_PORT", "8010"))
        self.web_host_port = int(os.getenv("WEB_HOST_PORT", "5180"))
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://hub:hub@localhost:5432/hub",
        )
        default_origins = (
            f"http://localhost:{self.web_host_port},"
            "http://localhost:5173,"
            "http://localhost:5174"
        )
        origins = os.getenv("CORS_ORIGINS", default_origins)
        self.cors_origins = [origin.strip() for origin in origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

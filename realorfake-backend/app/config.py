from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_env: Literal["development", "production"] = "development"
    app_name: str = "realorfake-backend"
    app_version: str = "0.1.0"
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Model
    model_path: str = "models/best_model.pth"
    model_arch: Literal["baseline_cnn", "efficientnet_b0", "vit_b_16"] = "vit_b_16"
    model_device: Literal["auto", "cpu", "cuda"] = "auto"
    model_input_size: int = 224

    # Limits
    max_upload_mb: int = 10
    allowed_mime_types: str = "image/jpeg,image/png,image/webp"
    request_timeout_s: int = 30

    # URL fetch
    url_fetch_timeout_s: int = 10
    url_fetch_max_mb: int = 10
    url_fetch_user_agent: str = "RealOrFake/0.1"

    # Report
    report_output_dir: str = "/tmp/realorfake-reports"

    # Public URL
    public_app_url: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_mime_types_set(self) -> set[str]:
        return {m.strip() for m in self.allowed_mime_types.split(",") if m.strip()}


settings = Settings()

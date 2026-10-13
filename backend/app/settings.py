"""Load backend/.env once at startup and expose typed settings."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BACKEND_DIR.parent
ENV_FILE = BACKEND_DIR / ".env"


def _load_env() -> None:
    load_dotenv(ENV_FILE, override=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    tuberium_runner: Literal["fake", "claude"] = "fake"
    anthropic_api_key: SecretStr | None = None
    tuberium_default_model: str = ""
    tuberium_max_run_cost_usd: float = 1.0
    tuberium_max_daily_cost_usd: float = 5.0
    tuberium_workspaces_dir: str = "./workspaces"
    tuberium_allowed_origin: str = "http://localhost:5173"
    tuberium_trading_mode: Literal["paper", "live"] = "paper"
    tuberium_max_daily_trade_usd: float = 1000.0
    broker_api_key: SecretStr | None = None
    broker_api_secret: SecretStr | None = None
    google_client_id: str = ""
    google_client_secret: SecretStr | None = None

    @field_validator("tuberium_runner", mode="before")
    @classmethod
    def normalize_runner(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @property
    def workspaces_path(self) -> Path:
        """The workspaces folder. A relative TUBERIUM_WORKSPACES_DIR counts from the repo root."""
        path = Path(self.tuberium_workspaces_dir)
        return path if path.is_absolute() else (REPO_DIR / path).resolve()

    def validate_runner_key(self) -> None:
        if self.tuberium_runner != "claude":
            return
        key = self.anthropic_api_key
        if key is None or not key.get_secret_value().strip():
            raise RuntimeError(
                "TUBERIUM_RUNNER is set to 'claude' but ANTHROPIC_API_KEY is empty. "
                "Add your key to backend/.env or set TUBERIUM_RUNNER=fake."
            )


@lru_cache
def get_settings() -> Settings:
    _load_env()
    settings = Settings()
    settings.validate_runner_key()
    return settings

"""Central configuration loaded from environment variables."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the project root (the parent of this file's folder).
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")


class Config:
    """Application-wide settings."""

    # --- App identity ---
    APP_NAME = "FridgeChef"
    APP_VERSION = "2.0"
    APP_URL = "https://github.com/PacktPublishing/Claude-Code-in-Action"

    # --- OpenRouter ---
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

    # Free models on OpenRouter (verified July 2026)
    IMAGE_RECOGNITION_MODEL = "google/gemma-4-26b-a4b-it:free"
    RECIPE_GENERATION_MODEL = "openai/gpt-oss-20b:free"
    REQUEST_TIMEOUT = 120

    # --- Image upload ---
    ALLOWED_EXTENSIONS = ("jpg", "jpeg", "png", "webp")
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
    IMAGE_MAX_DIMENSION = 1024

    # --- Paths ---
    ROOT = _ROOT
    DATA_DIR = _ROOT / "data"
    DB_PATH = _ROOT / "recipes.db"
    USERS_PATH = _ROOT / "users.json"
    PROFILES_PATH = _ROOT / "user_profiles.json"
    SAVED_RECIPES_PATH = _ROOT / "saved_recipes.json"

    @classmethod
    def validate(cls) -> None:
        """Fail fast if the API key is missing."""
        if not cls.OPENROUTER_API_KEY or cls.OPENROUTER_API_KEY.startswith("your-api-key"):
            raise RuntimeError(
                "OPENROUTER_API_KEY is not set. Copy .env.example to .env and "
                "paste your OpenRouter key."
            )
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)

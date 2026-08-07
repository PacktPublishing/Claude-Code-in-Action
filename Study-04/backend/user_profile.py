"""Per-user profiles and saved recipes for the Step 3 app."""
from __future__ import annotations

import json
from datetime import datetime

from .config import Config
from .recipe_generator import Recipe


class UserProfileManager:
    """Stores profile settings and saved recipes in JSON files."""

    def __init__(self, profiles_path: str | None = None, recipes_path: str | None = None) -> None:
        self.profiles_path = str(profiles_path or Config.PROFILES_PATH)
        self.recipes_path = str(recipes_path or Config.SAVED_RECIPES_PATH)
        self.profiles: dict[str, dict] = self._load(self.profiles_path)
        self.saved: dict[str, list] = self._load(self.recipes_path)

    @staticmethod
    def _load(path: str) -> dict:
        try:
            with open(path, encoding="utf-8") as handle:
                return json.load(handle)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _write(self, path: str, data: dict) -> None:
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=False)

    # ----------------------------- profile ----------------------------- #
    def get_profile(self, email: str) -> dict:
        return self.profiles.get(
            email,
            {
                "nickname": email.split("@")[0],
                "skill_level": "Beginner",
                "household_size": 2,
                "favorite_cuisine": "Any",
                "dietary": [],
                "allergies": "",
            },
        )

    def save_profile(self, email: str, profile: dict) -> None:
        self.profiles[email] = profile
        self._write(self.profiles_path, self.profiles)

    # -------------------------- saved recipes -------------------------- #
    def save_recipe(self, email: str, recipe: Recipe) -> str:
        entries = self.saved.setdefault(email, [])
        recipe_id = f"r{len(entries) + 1:04d}"
        entries.append(
            {
                "id": recipe_id,
                "saved_at": datetime.now().isoformat(timespec="seconds"),
                "cooked": False,
                "rating": 0,
                **recipe.to_dict(),
            }
        )
        self._write(self.recipes_path, self.saved)
        return recipe_id

    def list_saved(self, email: str) -> list[dict]:
        return list(reversed(self.saved.get(email, [])))

    def update_saved(self, email: str, recipe_id: str, **changes) -> None:
        for entry in self.saved.get(email, []):
            if entry["id"] == recipe_id:
                entry.update(changes)
                break
        self._write(self.recipes_path, self.saved)

    def delete_saved(self, email: str, recipe_id: str) -> None:
        entries = self.saved.get(email, [])
        self.saved[email] = [e for e in entries if e["id"] != recipe_id]
        self._write(self.recipes_path, self.saved)

    def stats(self, email: str) -> dict:
        entries = self.saved.get(email, [])
        cooked = [e for e in entries if e.get("cooked")]
        rated = [e["rating"] for e in entries if e.get("rating")]
        return {
            "saved": len(entries),
            "cooked": len(cooked),
            "avg_rating": round(sum(rated) / len(rated), 1) if rated else 0,
        }

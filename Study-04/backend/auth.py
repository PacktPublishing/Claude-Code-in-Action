"""Simple file-backed authentication for the Step 3 app."""
from __future__ import annotations

import hashlib
import json
import secrets
from datetime import datetime

from .config import Config

DEMO_EMAIL = "demo@fridgechef.app"
DEMO_PASSWORD = "demo1234"


def _hash(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


class AuthManager:
    """Registers and authenticates users against a JSON file."""

    def __init__(self, path: str | None = None) -> None:
        self.path = str(path or Config.USERS_PATH)
        self.users: dict[str, dict] = self._load()

    def _load(self) -> dict[str, dict]:
        try:
            with open(self.path, encoding="utf-8") as handle:
                return json.load(handle)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _save(self) -> None:
        with open(self.path, "w", encoding="utf-8") as handle:
            json.dump(self.users, handle, indent=2, ensure_ascii=False)

    def sign_up(self, email: str, password: str, nickname: str = "") -> tuple[bool, str]:
        email = email.strip().lower()
        if not email or "@" not in email:
            return False, "Please enter a valid email address."
        if len(password) < 6:
            return False, "The password must be at least 6 characters."
        if email in self.users:
            return False, "That email is already registered."

        salt = secrets.token_hex(8)
        self.users[email] = {
            "salt": salt,
            "password": _hash(password, salt),
            "nickname": nickname or email.split("@")[0],
            "created_at": datetime.now().isoformat(timespec="seconds"),
        }
        self._save()
        return True, "Account created. You can log in now."

    def log_in(self, email: str, password: str) -> tuple[bool, str]:
        email = email.strip().lower()
        user = self.users.get(email)
        if not user or _hash(password, user["salt"]) != user["password"]:
            return False, "Email or password is incorrect."
        return True, user["nickname"]

    def ensure_demo_account(self) -> tuple[str, str]:
        """Create the demo account on first use and return its credentials."""
        if DEMO_EMAIL not in self.users:
            self.sign_up(DEMO_EMAIL, DEMO_PASSWORD, nickname="Demo User")
        return DEMO_EMAIL, DEMO_PASSWORD

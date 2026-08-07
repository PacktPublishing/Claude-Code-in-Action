"""SQLite storage for generated recipes."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime

from .config import Config
from .recipe_generator import Recipe


class RecipeDatabase:
    """Stores and queries generated recipes."""

    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = str(db_path or Config.DB_PATH)
        self._create_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _create_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS recipes (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    title        TEXT NOT NULL,
                    cuisine      TEXT,
                    difficulty   TEXT,
                    time_minutes INTEGER,
                    servings     INTEGER,
                    ingredients  TEXT,
                    steps        TEXT,
                    tip          TEXT,
                    created_at   TEXT NOT NULL
                )
                """
            )

    def save(self, recipe: Recipe) -> int:
        """Insert a recipe and return its row id."""
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO recipes
                    (title, cuisine, difficulty, time_minutes, servings,
                     ingredients, steps, tip, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    recipe.title,
                    recipe.cuisine,
                    recipe.difficulty,
                    recipe.time_minutes,
                    recipe.servings,
                    json.dumps(recipe.ingredients, ensure_ascii=False),
                    json.dumps(recipe.steps, ensure_ascii=False),
                    recipe.tip,
                    datetime.now().isoformat(timespec="seconds"),
                ),
            )
            return int(cursor.lastrowid)

    def list_recipes(self, cuisine: str = "", max_time: int = 0) -> list[dict]:
        """Return saved recipes, newest first, with optional filters."""
        query = "SELECT * FROM recipes WHERE 1=1"
        params: list = []
        if cuisine and cuisine != "Any":
            query += " AND cuisine = ?"
            params.append(cuisine)
        if max_time:
            query += " AND time_minutes <= ?"
            params.append(max_time)
        query += " ORDER BY id DESC"

        with self._connect() as conn:
            rows = conn.execute(query, params).fetchall()

        results = []
        for row in rows:
            item = dict(row)
            item["ingredients"] = json.loads(item["ingredients"] or "[]")
            item["steps"] = json.loads(item["steps"] or "[]")
            results.append(item)
        return results

    def count(self) -> int:
        with self._connect() as conn:
            return int(conn.execute("SELECT COUNT(*) FROM recipes").fetchone()[0])

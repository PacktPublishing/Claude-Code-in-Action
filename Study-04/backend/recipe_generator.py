"""Recipe generation on top of the OpenRouter text model."""
from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict

from .config import Config
from .openrouter_client import OpenRouterClient


@dataclass
class Recipe:
    """A single generated recipe."""

    title: str
    cuisine: str = ""
    difficulty: str = ""
    time_minutes: int = 0
    servings: int = 2
    calories: int = 0
    ingredients: list[str] = field(default_factory=list)
    steps: list[str] = field(default_factory=list)
    tip: str = ""

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "Recipe":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class RecipeGenerator:
    """Turns a list of ingredients into structured recipes."""

    def __init__(self, client: OpenRouterClient | None = None) -> None:
        self.client = client or OpenRouterClient()
        self.model = Config.RECIPE_GENERATION_MODEL

    def generate(
        self,
        ingredients: list[str],
        *,
        cuisine: str = "Any",
        difficulty: str = "Easy",
        max_time: int = 30,
        servings: int = 2,
        count: int = 2,
    ) -> list[Recipe]:
        """Ask the model for `count` recipes and parse them."""
        if not ingredients:
            return []

        prompt = (
            f"Create {count} recipes using mainly these ingredients: "
            f"{', '.join(ingredients)}.\n\n"
            f"Constraints: {cuisine} cuisine, {difficulty} difficulty, "
            f"ready in {max_time} minutes or less, {servings} servings.\n"
            "Assume salt, pepper, oil, and water are always available.\n"
            "Write in plain English only, with no characters from other "
            "alphabets. Give every ingredient a normal cooking measurement "
            "such as '2 carrots, sliced' or '1 tbsp olive oil'.\n\n"
            "Answer with this exact format for each recipe and nothing else:\n\n"
            "### RECIPE\n"
            "TITLE: <dish name>\n"
            "CUISINE: <cuisine>\n"
            "DIFFICULTY: <Easy|Medium|Hard>\n"
            "TIME: <minutes as a number>\n"
            "SERVINGS: <number>\n"
            "CALORIES: <estimated kcal per serving as a number>\n"
            "INGREDIENTS:\n- <item with amount>\n- <item with amount>\n"
            "STEPS:\n1. <step>\n2. <step>\n"
            "TIP: <one short tip>\n"
        )

        raw = self.client.chat(
            [{"role": "user", "content": prompt}],
            model=self.model,
            max_tokens=3500,
        )
        return self._parse(raw)

    @staticmethod
    def _parse(raw: str) -> list[Recipe]:
        """Parse the model's plain-text answer into Recipe objects."""
        blocks = [b.strip() for b in re.split(r"#{2,3}\s*RECIPE", raw) if b.strip()]
        recipes: list[Recipe] = []

        for block in blocks:
            title = _field(block, "TITLE")
            if not title:
                continue
            recipe = Recipe(
                title=title,
                cuisine=_field(block, "CUISINE"),
                difficulty=_field(block, "DIFFICULTY"),
                time_minutes=_int(_field(block, "TIME")),
                servings=_int(_field(block, "SERVINGS")) or 2,
                calories=_int(_field(block, "CALORIES")),
                ingredients=_list(block, "INGREDIENTS"),
                steps=_list(block, "STEPS"),
                tip=_field(block, "TIP"),
            )
            recipes.append(recipe)

        return recipes


# --------------------------------------------------------------------- #
# small parsing helpers
# --------------------------------------------------------------------- #
def clean_text(text: str) -> str:
    """Drop stray characters that free models occasionally emit.

    A single hallucinated CJK glyph in the middle of an English recipe looks
    like a bug to the reader, so anything outside the Latin range is removed
    and the leftover spacing is tidied up.
    """
    for fancy, plain in (
        ("‐", "-"), ("‑", "-"), ("‒", "-"), ("–", "-"), ("—", "-"),
        ("‘", "'"), ("’", "'"), ("“", '"'), ("”", '"'),
        ("½", "1/2"), ("¼", "1/4"), ("¾", "3/4"), ("°", " degrees "),
    ):
        text = text.replace(fancy, plain)
    text = re.sub(r"[^\x20-\x7EÀ-ɏ]", "", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([,.;:])", r"\1", text)
    return text.strip()


def _field(block: str, name: str) -> str:
    match = re.search(rf"^{name}:\s*(.+)$", block, re.MULTILINE)
    return clean_text(match.group(1).strip().strip("*")) if match else ""


def _int(text: str) -> int:
    match = re.search(r"\d+", text or "")
    return int(match.group()) if match else 0


def _list(block: str, name: str) -> list[str]:
    match = re.search(rf"^{name}:\s*$(.*?)(?=^[A-Z]+:|\Z)", block, re.MULTILINE | re.DOTALL)
    if not match:
        return []
    items = []
    for line in match.group(1).splitlines():
        line = line.strip()
        if not line:
            continue
        line = re.sub(r"^[-*•]\s*", "", line)
        line = re.sub(r"^\d+[.)]\s*", "", line)
        line = clean_text(line.strip("*_`"))
        if line:
            items.append(line)
    return items

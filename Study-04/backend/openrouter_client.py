"""Thin client for the OpenRouter chat-completions API."""
from __future__ import annotations

import base64
from typing import Any

import requests

from .config import Config


class OpenRouterError(RuntimeError):
    """Raised when the OpenRouter API returns an error."""


class OpenRouterClient:
    """Sends chat and vision requests to OpenRouter."""

    def __init__(self) -> None:
        Config.validate()
        self.api_key = Config.OPENROUTER_API_KEY
        self.base_url = Config.OPENROUTER_BASE_URL

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": Config.APP_URL,
            "X-Title": Config.APP_NAME,
        }

    def chat(
        self,
        messages: list[dict[str, Any]],
        model: str,
        max_tokens: int = 1200,
        temperature: float = 0.3,
    ) -> str:
        """Send messages to a model and return the assistant text.

        Free models drift into stray characters at high temperatures, so the
        default is deliberately low.
        """
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
                timeout=Config.REQUEST_TIMEOUT,
            )
        except requests.RequestException as exc:
            raise OpenRouterError(f"Could not reach OpenRouter: {exc}") from exc

        if response.status_code == 401:
            raise OpenRouterError("Invalid API key. Check OPENROUTER_API_KEY in your .env file.")
        if response.status_code == 429:
            raise OpenRouterError("Free-tier limit reached. Wait a moment and try again.")
        if not response.ok:
            raise OpenRouterError(f"OpenRouter returned {response.status_code}: {response.text[:200]}")

        payload = response.json()
        choices = payload.get("choices") or []
        if not choices:
            raise OpenRouterError("The model returned an empty response.")
        return (choices[0]["message"].get("content") or "").strip()

    def test_connection(self) -> str:
        """One-line smoke test used by the sidebar button.

        The recipe model is a reasoning model, so it spends some of the token
        budget on internal reasoning. Keep the budget generous even for a
        one-word answer.
        """
        return self.chat(
            [{"role": "user", "content": "Reply with the single word: ready."}],
            model=Config.RECIPE_GENERATION_MODEL,
            max_tokens=200,
        )

    def recognize_ingredients(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
        """Ask the vision model to list the ingredients it can see."""
        encoded = base64.b64encode(image_bytes).decode()
        prompt = (
            "You are looking at a photo of the inside of a refrigerator. "
            "List the food ingredients you can identify, grouped by category "
            "(Vegetables, Fruits, Dairy & Eggs, Meat & Seafood, Condiments, Beverages). "
            "Use this exact format, one category per block:\n\n"
            "## Category\n- ingredient\n- ingredient\n\n"
            "Rules:\n"
            "- Use the common English name of the food, one to three words "
            "(for example: carrots, spring onion, cheddar cheese).\n"
            "- Skip anything you cannot name confidently. Never write vague "
            "entries such as 'unknown item', 'pink liquid' or 'container of food'.\n"
            "- Only list categories that actually have items.\n"
            "- Plain English only. No commentary, no notes, no other alphabets."
        )
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
                    },
                ],
            }
        ]
        return self.chat(
            messages,
            model=Config.IMAGE_RECOGNITION_MODEL,
            max_tokens=800,
            temperature=0.2,
        )

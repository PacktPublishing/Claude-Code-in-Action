"""Smoke test for the OpenRouter API.

Verifies that both the image and text models configured in backend.config
are reachable and returning content.

Usage:
    python openrouter_example.py
"""
import base64
import json
import sys
from pathlib import Path

import requests

from backend.config import Config


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/PacktPublishing/Claude-Code-in-Action",
        "X-Title": "FridgeChef Smoke Test",
    }


def test_text() -> str:
    """Send a plain text prompt to the recipe model."""
    r = requests.post(
        f"{Config.OPENROUTER_BASE_URL}/chat/completions",
        headers=_headers(),
        json={
            "model": Config.RECIPE_GENERATION_MODEL,
            "messages": [{"role": "user", "content": "Reply with the single word: pong."}],
            "max_tokens": 200,
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def test_image(image_path: Path) -> str:
    """Send an image to the recognition model and get a short caption."""
    b64 = base64.b64encode(image_path.read_bytes()).decode()
    mime = "image/jpeg" if image_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"
    r = requests.post(
        f"{Config.OPENROUTER_BASE_URL}/chat/completions",
        headers=_headers(),
        json={
            "model": Config.IMAGE_RECOGNITION_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "In one short sentence, describe what is in this image."},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                    ],
                }
            ],
            "max_tokens": 80,
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def main() -> int:
    Config.validate()
    print(f"Text model: {Config.RECIPE_GENERATION_MODEL}")
    print(f"Image model: {Config.IMAGE_RECOGNITION_MODEL}\n")

    print("Testing text generation...")
    try:
        text_reply = test_text()
        print(f"  Reply: {text_reply}\n")
    except Exception as e:
        print(f"  FAILED: {e}\n")
        return 1

    print("Testing image recognition...")
    sample = Config.ROOT / "sample_fridge.jpg"
    if not sample.exists():
        print(f"  SKIPPED: {sample} not found.")
        return 0
    try:
        caption = test_image(sample)
        print(f"  Caption: {caption}\n")
    except Exception as e:
        print(f"  FAILED: {e}\n")
        return 1

    print("Both models worked successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())

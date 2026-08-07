"""Validation and preprocessing for uploaded fridge photos."""
from __future__ import annotations

import io

from PIL import Image

from .config import Config
from .recipe_generator import clean_text


class ImageProcessor:
    """Validates uploads and prepares them for the vision model."""

    @staticmethod
    def validate(uploaded_file) -> tuple[bool, str]:
        """Return (is_valid, message) for a Streamlit UploadedFile."""
        if uploaded_file is None:
            return False, "No file selected."

        extension = uploaded_file.name.rsplit(".", 1)[-1].lower()
        if extension not in Config.ALLOWED_EXTENSIONS:
            allowed = ", ".join(Config.ALLOWED_EXTENSIONS).upper()
            return False, f"Unsupported format. Please upload one of: {allowed}."

        size = getattr(uploaded_file, "size", None)
        if size is None:
            size = len(uploaded_file.getvalue())
        if size > Config.MAX_IMAGE_SIZE:
            limit_mb = Config.MAX_IMAGE_SIZE // (1024 * 1024)
            return False, f"File is too large. The limit is {limit_mb} MB."

        return True, "Image uploaded successfully."

    @staticmethod
    def prepare(uploaded_file) -> tuple[bytes, str]:
        """Downscale the image if needed and return (bytes, mime_type)."""
        raw = uploaded_file.getvalue()
        image = Image.open(io.BytesIO(raw))

        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        longest = max(image.size)
        if longest > Config.IMAGE_MAX_DIMENSION:
            scale = Config.IMAGE_MAX_DIMENSION / longest
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.LANCZOS)

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=88)
        return buffer.getvalue(), "image/jpeg"


def parse_ingredients(markdown_text: str) -> dict[str, list[str]]:
    """Turn the model's markdown answer into {category: [ingredient, ...]}."""
    result: dict[str, list[str]] = {}
    current = "Other"

    for line in markdown_text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            current = clean_text(line.lstrip("#").strip().rstrip(":")) or "Other"
            result.setdefault(current, [])
        elif line.startswith(("-", "*", "•")):
            item = clean_text(line.lstrip("-*• ").strip().strip("*_`"))
            if item:
                result.setdefault(current, []).append(item)

    return {k: v for k, v in result.items() if v}

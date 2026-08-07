"""FridgeChef - Step 1: recognize ingredients in a fridge photo."""
from pathlib import Path

import streamlit as st

from backend.config import Config
from backend.image_service import ImageProcessor, parse_ingredients
from backend.openrouter_client import OpenRouterClient, OpenRouterError
from ui import apply_theme, card, category_grid, steps_strip

SAMPLE_PHOTO = Path(__file__).with_name("sample_fridge.jpg")

# the categories the vision prompt asks the model to sort ingredients into
CATEGORIES = [
    "Vegetables", "Fruits", "Dairy & Eggs",
    "Meat & Seafood", "Condiments", "Beverages",
]

apply_theme("FridgeChef - Step 1", "Turn a photo of your fridge into an ingredient list")


def sidebar() -> None:
    with st.sidebar:
        st.markdown("### 🍳 FridgeChef")
        st.caption("Step 1 - Ingredient recognition")
        st.divider()
        st.markdown(f"**Vision model**  \n`{Config.IMAGE_RECOGNITION_MODEL}`")
        st.caption("A free model on OpenRouter. No credit card required.")
        st.divider()
        if st.button("Test API connection", use_container_width=True):
            try:
                st.success(f"Connected. The model replied: {OpenRouterClient().test_connection()}")
            except OpenRouterError as exc:
                st.error(str(exc))


def photo_bytes() -> tuple[bytes, str] | None:
    """Return the photo to analyse, either the upload or the bundled sample."""
    uploaded = st.session_state.get("upload")
    if uploaded is not None:
        ok, message = ImageProcessor.validate(uploaded)
        if not ok:
            st.error(message)
            return None
        return uploaded.getvalue(), uploaded.name
    if st.session_state.get("sample_selected") and SAMPLE_PHOTO.exists():
        return SAMPLE_PHOTO.read_bytes(), SAMPLE_PHOTO.name
    return None


def recognize(raw: bytes) -> None:
    with st.spinner("The AI is looking inside your fridge..."):
        try:
            image_bytes, mime = ImageProcessor.prepare(_Buffer(raw))
            answer = OpenRouterClient().recognize_ingredients(image_bytes, mime)
            st.session_state["ingredients"] = parse_ingredients(answer)
        except OpenRouterError as exc:
            st.session_state["error"] = str(exc)


class _Buffer:
    """Minimal stand-in so `ImageProcessor.prepare` also accepts raw bytes."""

    def __init__(self, data: bytes) -> None:
        self._data = data

    def getvalue(self) -> bytes:
        return self._data


def main() -> None:
    sidebar()

    photo = photo_bytes()

    # Before anything is chosen the screen explains itself; once a photo is in
    # play the hint gives way to the photo and the result.
    if photo is None:
        steps_strip([
            ("Upload", "A photo of your open fridge."),
            ("Recognize", "A free vision model reads it."),
            ("Collect", "Ingredients, grouped and ready."),
        ])

    # the uploader spans the full width so it stays on one line
    drop, sample = st.columns([3, 1], gap="medium")
    with drop:
        st.file_uploader(
            "Choose a photo",
            type=list(Config.ALLOWED_EXTENSIONS),
            label_visibility="collapsed",
            key="upload",
        )
    with sample:
        if st.session_state.get("upload") is None and SAMPLE_PHOTO.exists():
            if st.button("Use the sample photo", use_container_width=True):
                st.session_state["sample_selected"] = True
                st.rerun()

    left, right = st.columns([1, 1.5], gap="medium")

    with left:
        card("1. Your fridge photo")
        if photo is None:
            st.caption(
                "Nothing selected yet. Use **Browse files** above, or start "
                "from the sample photo."
            )
        else:
            st.image(photo[0])
            if st.button("Recognize ingredients", type="primary", use_container_width=True):
                recognize(photo[0])
                st.rerun()

    with right:
        card("2. What the AI found")

        if error := st.session_state.pop("error", None):
            st.error(error)

        ingredients = st.session_state.get("ingredients")
        if not ingredients:
            st.caption("The model sorts whatever it can name into these categories:")
            st.markdown(
                "<ul class='fc-list'>"
                + "".join(f"<li>{name}</li>" for name in CATEGORIES)
                + "</ul>",
                unsafe_allow_html=True,
            )
            return

        total = sum(len(items) for items in ingredients.values())
        st.caption(f"**{total} ingredients** across **{len(ingredients)} categories**")
        category_grid(ingredients)

        st.download_button(
            "Download as text",
            data="\n".join(
                f"{category}: {', '.join(items)}" for category, items in ingredients.items()
            ),
            file_name="ingredients.txt",
            use_container_width=True,
        )


if __name__ == "__main__":
    main()

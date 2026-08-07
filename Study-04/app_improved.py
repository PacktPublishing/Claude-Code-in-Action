"""FridgeChef - the version the Chapter 7 agent team produced.

Three sub-agents worked over the Step 3 app:

* code-bug-analyzer found that the same photo was sent to the vision model
  again on every rerun, and that recipes could be requested with an empty
  ingredient list.
* performance-optimizer cached the recognition result against the image
  itself, so re-running the page costs nothing.
* ux-design-advisor replaced the sidebar menu with one guided flow, added a
  no-signup entry point, and put an estimated calorie count on every recipe.
"""
import hashlib

import streamlit as st

from backend.auth import AuthManager
from backend.config import Config
from backend.image_service import ImageProcessor, parse_ingredients
from backend.openrouter_client import OpenRouterClient, OpenRouterError
from backend.recipe_generator import RecipeGenerator
from backend.user_profile import UserProfileManager
from ui import apply_theme, card, category_grid, recipe_card, steps_strip

apply_theme("FridgeChef", "From a fridge photo to dinner, in three steps")

CUISINES = ["Any", "Korean", "Italian", "Japanese", "Mexican", "Indian", "American"]
DIFFICULTIES = ["Easy", "Medium", "Hard"]
GUEST = "guest"


@st.cache_resource
def get_auth() -> AuthManager:
    return AuthManager()


@st.cache_resource
def get_profiles() -> UserProfileManager:
    return UserProfileManager()


@st.cache_resource
def get_client() -> OpenRouterClient:
    """One client for the whole session instead of one per request."""
    return OpenRouterClient()


@st.cache_data(show_spinner=False, max_entries=8)
def recognize_cached(image_hash: str, image_bytes: bytes, mime: str) -> dict[str, list[str]]:
    """Recognize a photo once and remember the answer.

    The hash is what Streamlit keys the cache on, so uploading the same photo
    twice never spends a second API call.
    """
    del image_hash  # only used as the cache key
    return parse_ingredients(get_client().recognize_ingredients(image_bytes, mime))


# --------------------------------------------------------------------- #
# entry screen
# --------------------------------------------------------------------- #
def entry_screen() -> None:
    _, middle, _ = st.columns([1, 2, 1])
    with middle:
        card("Welcome to FridgeChef", "Sign in to keep your recipes, or look around first.")
        if st.button("Try it out (without logging in)", type="primary", use_container_width=True):
            st.session_state["user"] = GUEST
            st.session_state["nickname"] = "Guest"
            st.rerun()

        with st.expander("Log in to save your recipes"):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            if st.button("Log in", use_container_width=True):
                ok, message = get_auth().log_in(email, password)
                if ok:
                    st.session_state["user"] = email.strip().lower()
                    st.session_state["nickname"] = message
                    st.rerun()
                else:
                    st.error(message)

    st.write("")
    steps_strip([
        ("Upload", "A photo of your open fridge."),
        ("Recognize", "The AI names what it can see."),
        ("Cook", "Recipes sized to your time and appetite."),
    ])


# --------------------------------------------------------------------- #
# the guided flow
# --------------------------------------------------------------------- #
def section_photo() -> bytes | None:
    card("1. Your fridge photo", "JPG, JPEG, PNG or WEBP, up to 10 MB.")
    uploaded = st.file_uploader(
        "Choose a photo", type=list(Config.ALLOWED_EXTENSIONS), label_visibility="collapsed"
    )
    if uploaded is None:
        st.caption("Nothing selected yet. Use **Browse files** above to pick a photo.")
        return None

    ok, message = ImageProcessor.validate(uploaded)
    if not ok:
        st.error(message)
        return None

    st.image(uploaded.getvalue())
    if st.button("Start ingredient recognition", type="primary", use_container_width=True):
        with st.spinner("The AI is looking inside your fridge..."):
            try:
                image_bytes, mime = ImageProcessor.prepare(uploaded)
                digest = hashlib.sha256(image_bytes).hexdigest()
                st.session_state["groups"] = recognize_cached(digest, image_bytes, mime)
            except OpenRouterError as exc:
                st.session_state["error"] = str(exc)
        st.rerun()
    return uploaded.getvalue()


def section_ingredients() -> list[str]:
    card("2. What the AI found", "Check the list before you cook. You can add anything it missed.")

    if error := st.session_state.pop("error", None):
        st.error(error)

    groups: dict[str, list[str]] = st.session_state.get("groups", {})
    if not groups:
        st.caption("The recognized ingredients will appear here.")
        return []

    category_grid(groups)
    items = [item for values in groups.values() for item in values]

    extra = st.text_input("Add anything the camera missed", placeholder="e.g. spring onion")
    if extra.strip():
        items += [part.strip() for part in extra.split(",") if part.strip()]
    st.caption(f"**{len(items)} ingredients** ready to cook with")
    return items


def section_recipes(email: str, ingredients: list[str]) -> None:
    card("3. Your recipes", "Set the style and the time you have, then let the model cook.")

    c1, c2, c3, c4 = st.columns(4)
    cuisine = c1.selectbox("Cuisine", CUISINES)
    difficulty = c2.selectbox("Difficulty", DIFFICULTIES)
    max_time = c3.slider("Max time (min)", 10, 90, 30, step=5)
    servings = c4.slider("Servings", 1, 6, 2)

    # the reviewer flagged that this used to be clickable with nothing to cook
    disabled = not ingredients
    if st.button("Generate recipe", type="primary", use_container_width=True, disabled=disabled):
        with st.spinner("Writing recipes..."):
            try:
                st.session_state["recipes"] = RecipeGenerator(get_client()).generate(
                    ingredients,
                    cuisine=cuisine,
                    difficulty=difficulty,
                    max_time=max_time,
                    servings=servings,
                )
            except OpenRouterError as exc:
                st.error(str(exc))
    if disabled:
        st.caption("Recognize a photo first, and this button will wake up.")

    for index, recipe in enumerate(st.session_state.get("recipes", [])):
        recipe_card(
            recipe.title,
            [
                recipe.cuisine,
                recipe.difficulty,
                f"{recipe.time_minutes} min" if recipe.time_minutes else "",
                f"{recipe.calories} kcal per serving" if recipe.calories else "",
            ],
            recipe.ingredients,
            recipe.steps,
            recipe.tip,
        )
        if email == GUEST:
            st.caption("Log in to save this recipe.")
        elif st.button("Save", key=f"save_{index}", use_container_width=True):
            get_profiles().save_recipe(email, recipe)
            st.success("Saved to your recipes.")


def main() -> None:
    if "user" not in st.session_state:
        entry_screen()
        return

    email = st.session_state["user"]
    with st.sidebar:
        st.markdown("### 🍳 FridgeChef")
        st.caption(f"Signed in as **{st.session_state.get('nickname', email)}**")
        st.divider()
        st.markdown(f"**Vision model**  \n`{Config.IMAGE_RECOGNITION_MODEL}`")
        st.markdown(f"**Recipe model**  \n`{Config.RECIPE_GENERATION_MODEL}`")
        st.divider()
        if st.button("Start over", use_container_width=True):
            st.session_state.clear()
            st.rerun()

    left, right = st.columns([1, 1.35], gap="medium")
    with left:
        section_photo()
    with right:
        ingredients = section_ingredients()

    section_recipes(email, ingredients)


if __name__ == "__main__":
    main()

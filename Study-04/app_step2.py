"""FridgeChef - Step 2: edit ingredients and generate recipes."""
import streamlit as st

from backend.config import Config
from backend.database import RecipeDatabase
from backend.image_service import ImageProcessor, parse_ingredients
from backend.openrouter_client import OpenRouterClient, OpenRouterError
from backend.recipe_generator import RecipeGenerator
from ui import apply_theme, card, category_grid, recipe_card, steps_strip

apply_theme("FridgeChef - Step 2", "From the ingredients you have to a recipe you can cook tonight")

CUISINES = ["Any", "Korean", "Italian", "Japanese", "Mexican", "Indian", "American"]
DIFFICULTIES = ["Easy", "Medium", "Hard"]


@st.cache_resource
def get_database() -> RecipeDatabase:
    return RecipeDatabase()


def sidebar() -> None:
    with st.sidebar:
        st.markdown("### 🍳 FridgeChef")
        st.caption("Step 2 - Recipe generation")
        st.divider()
        st.markdown(
            f"**Vision model**  \n`{Config.IMAGE_RECOGNITION_MODEL}`\n\n"
            f"**Recipe model**  \n`{Config.RECIPE_GENERATION_MODEL}`"
        )
        st.divider()
        st.metric("Recipes in database", get_database().count())
        if st.button("Test API connection", use_container_width=True):
            try:
                st.success(f"Connected. Model replied: {OpenRouterClient().test_connection()}")
            except OpenRouterError as exc:
                st.error(str(exc))


def tab_recognize() -> None:
    card("Upload a fridge photo", "The AI names what it can see, so you do not have to type it in.")
    uploaded = st.file_uploader(
        "Choose a photo", type=list(Config.ALLOWED_EXTENSIONS), label_visibility="collapsed"
    )
    if uploaded is None:
        return

    ok, message = ImageProcessor.validate(uploaded)
    if not ok:
        st.error(message)
        return

    left, right = st.columns(2, gap="large")
    with left:
        st.image(uploaded, use_container_width=True)
        if st.button("Recognize ingredients", type="primary", use_container_width=True):
            with st.spinner("The AI is looking at your fridge..."):
                try:
                    image_bytes, mime = ImageProcessor.prepare(uploaded)
                    answer = OpenRouterClient().recognize_ingredients(image_bytes, mime)
                    parsed = parse_ingredients(answer)
                    st.session_state["ingredients"] = [i for items in parsed.values() for i in items]
                    st.session_state["ingredient_groups"] = parsed
                except OpenRouterError as exc:
                    st.error(str(exc))

    with right:
        groups = st.session_state.get("ingredient_groups", {})
        if not groups:
            st.info("The recognized ingredients will appear here.")
        else:
            category_grid(groups)


def tab_edit() -> None:
    card("Edit your ingredient list", "Add anything the camera missed, remove anything you ran out of.")
    ingredients: list[str] = st.session_state.setdefault("ingredients", [])

    col_add, col_clear = st.columns([3, 1])
    with col_add:
        new_item = st.text_input("Add an ingredient", placeholder="e.g. spring onion")
    with col_clear:
        st.write("")
        if st.button("Clear all", use_container_width=True):
            st.session_state["ingredients"] = []
            st.rerun()

    if new_item and st.button("Add", type="primary"):
        if new_item not in ingredients:
            ingredients.append(new_item)
        st.rerun()

    if not ingredients:
        st.info("No ingredients yet. Recognize a photo first, or add items by hand.")
        return

    st.write(f"**{len(ingredients)} ingredients**")
    for index, item in enumerate(ingredients):
        row_text, row_button = st.columns([6, 1])
        row_text.write(f"{index + 1}. {item}")
        if row_button.button("Remove", key=f"remove_{index}"):
            ingredients.pop(index)
            st.rerun()


def tab_generate() -> None:
    card("Generate recipes", "Set the style and the time you have, then let the model write the recipes.")
    ingredients: list[str] = st.session_state.get("ingredients", [])
    if not ingredients:
        st.info("Add some ingredients first on the previous tabs.")
        return

    st.caption("Using: " + ", ".join(ingredients[:12]) + ("..." if len(ingredients) > 12 else ""))

    c1, c2, c3, c4 = st.columns(4)
    cuisine = c1.selectbox("Cuisine", CUISINES)
    difficulty = c2.selectbox("Difficulty", DIFFICULTIES)
    max_time = c3.slider("Max time (min)", 10, 90, 30, step=5)
    servings = c4.slider("Servings", 1, 6, 2)

    if st.button("Generate recipes", type="primary", use_container_width=True):
        with st.spinner("Writing recipes..."):
            try:
                recipes = RecipeGenerator().generate(
                    ingredients,
                    cuisine=cuisine,
                    difficulty=difficulty,
                    max_time=max_time,
                    servings=servings,
                )
                database = get_database()
                for recipe in recipes:
                    database.save(recipe)
                st.session_state["recipes"] = recipes
            except OpenRouterError as exc:
                st.error(str(exc))
            else:
                # Re-run so the sidebar recipe count reflects the new rows.
                st.rerun()

    for recipe in st.session_state.get("recipes", []):
        recipe_card(
            recipe.title,
            [
                recipe.cuisine,
                recipe.difficulty,
                f"{recipe.time_minutes} min" if recipe.time_minutes else "",
                f"{recipe.servings} servings",
            ],
            recipe.ingredients,
            recipe.steps,
            recipe.tip,
        )


def tab_saved() -> None:
    card("Recipes in the database", "Everything generated so far, stored in a local SQLite file.")
    database = get_database()

    c1, c2 = st.columns(2)
    cuisine = c1.selectbox("Filter by cuisine", CUISINES, key="filter_cuisine")
    max_time = c2.slider("Max time (min)", 0, 90, 0, step=5, key="filter_time")

    rows = database.list_recipes(cuisine=cuisine, max_time=max_time)
    if not rows:
        st.info("No recipes stored yet. Generate a few on the previous tab.")
        return

    for row in rows:
        with st.expander(f"{row['title']} · {row['cuisine'] or 'Any'} · {row['time_minutes']} min"):
            st.write(", ".join(row["ingredients"]))
            for number, step in enumerate(row["steps"], start=1):
                st.write(f"{number}. {step}")


def main() -> None:
    sidebar()

    steps_strip([
        ("Recognize", "The AI reads your photo."),
        ("Adjust", "Fix the ingredient list."),
        ("Cook", "Get two matching recipes."),
    ])

    recognize, edit, generate, saved = st.tabs(
        ["Ingredient recognition", "Edit ingredients", "Recipe generation", "Recipe list"]
    )
    with recognize:
        tab_recognize()
    with edit:
        tab_edit()
    with generate:
        tab_generate()
    with saved:
        tab_saved()

    st.divider()
    st.caption(f"{Config.APP_NAME} v{Config.APP_VERSION} - Step 2")


if __name__ == "__main__":
    main()

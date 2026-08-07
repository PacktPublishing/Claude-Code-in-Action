"""FridgeChef - Step 3: accounts, saved recipes, and a personal dashboard."""
import pandas as pd
import streamlit as st

from backend.auth import AuthManager
from backend.config import Config
from backend.image_service import ImageProcessor, parse_ingredients
from backend.openrouter_client import OpenRouterClient, OpenRouterError
from backend.recipe_generator import Recipe, RecipeGenerator
from backend.user_profile import UserProfileManager
from ui import apply_theme, card, category_grid, recipe_card, steps_strip

apply_theme("FridgeChef", "Your personal recipe assistant")

CUISINES = ["Any", "Korean", "Italian", "Japanese", "Mexican", "Indian", "American"]
DIFFICULTIES = ["Easy", "Medium", "Hard"]
DIETARY = ["Vegetarian", "Vegan", "Low carb", "High protein", "Gluten free"]


@st.cache_resource
def get_auth() -> AuthManager:
    return AuthManager()


@st.cache_resource
def get_profiles() -> UserProfileManager:
    return UserProfileManager()


# --------------------------------------------------------------------- #
# login
# --------------------------------------------------------------------- #
def login_screen() -> None:
    _, middle, _ = st.columns([1, 2, 1])
    with middle:
        login_tab, signup_tab = st.tabs(["Log in", "Sign up"])

        with login_tab:
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_password")
            if st.button("Log in", type="primary", use_container_width=True):
                ok, message = get_auth().log_in(email, password)
                if ok:
                    st.session_state["user"] = email.strip().lower()
                    st.session_state["nickname"] = message
                    st.rerun()
                else:
                    st.error(message)

            st.caption("Just exploring? Use the demo account.")
            if st.button("Use demo account", use_container_width=True):
                demo_email, demo_password = get_auth().ensure_demo_account()
                ok, message = get_auth().log_in(demo_email, demo_password)
                if ok:
                    st.session_state["user"] = demo_email
                    st.session_state["nickname"] = message
                    st.rerun()

        with signup_tab:
            new_email = st.text_input("Email", key="signup_email")
            new_nickname = st.text_input("Nickname", key="signup_nickname")
            new_password = st.text_input("Password", type="password", key="signup_password")
            if st.button("Create account", type="primary", use_container_width=True):
                ok, message = get_auth().sign_up(new_email, new_password, new_nickname)
                (st.success if ok else st.error)(message)

    st.write("")
    steps_strip([
        ("Snap", "The AI names what is in your fridge."),
        ("Cook", "Recipes match your taste and your time."),
        ("Keep", "Save and rate the ones that worked."),
    ])


# --------------------------------------------------------------------- #
# pages
# --------------------------------------------------------------------- #
def page_dashboard(email: str) -> None:
    profiles = get_profiles()
    stats = profiles.stats(email)

    card("My cooking dashboard", "Everything you have saved, at a glance.")
    c1, c2, c3 = st.columns(3)
    c1.metric("Saved recipes", stats["saved"])
    c2.metric("Recipes cooked", stats["cooked"])
    c3.metric("Average rating", stats["avg_rating"] or "-")

    saved = profiles.list_saved(email)
    if not saved:
        st.info("No saved recipes yet. Generate one on the **Create recipe** page and save it.")
        return

    counts: dict[str, int] = {}
    for entry in saved:
        key = entry.get("cuisine") or "Any"
        counts[key] = counts.get(key, 0) + 1

    left, right = st.columns(2, gap="large")
    with left:
        st.markdown("**Recipes by cuisine**")
        st.bar_chart(pd.DataFrame({"recipes": counts}), color="#FF6B35", height=190)
    with right:
        st.markdown("**Recently saved**")
        for entry in saved[:5]:
            st.write(f"- {entry['title']}  ·  {entry['saved_at'][:10]}")


def page_recognize() -> None:
    card("Recognize ingredients", "Upload a fridge photo and let the AI name what it sees.")
    uploaded = st.file_uploader(
        "Upload a fridge photo", type=list(Config.ALLOWED_EXTENSIONS), label_visibility="collapsed"
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
        if groups:
            category_grid(groups)


def page_create(email: str) -> None:
    card("Create a recipe", "Turn the ingredients you have into something you can cook tonight.")
    ingredients = st.session_state.get("ingredients", [])
    if not ingredients:
        st.info("Recognize a fridge photo first, or type ingredients below.")
        typed = st.text_input("Ingredients (comma separated)")
        if typed:
            ingredients = [item.strip() for item in typed.split(",") if item.strip()]
            st.session_state["ingredients"] = ingredients
    if not ingredients:
        return

    st.caption("Using: " + ", ".join(ingredients[:12]))
    profile = get_profiles().get_profile(email)

    c1, c2, c3 = st.columns(3)
    cuisine = c1.selectbox("Cuisine", CUISINES, index=CUISINES.index(profile.get("favorite_cuisine", "Any")))
    difficulty = c2.selectbox("Difficulty", DIFFICULTIES)
    max_time = c3.slider("Max time (min)", 10, 90, 30, step=5)

    if st.button("Generate recipes", type="primary", use_container_width=True):
        with st.spinner("Writing recipes..."):
            try:
                st.session_state["recipes"] = RecipeGenerator().generate(
                    ingredients,
                    cuisine=cuisine,
                    difficulty=difficulty,
                    max_time=max_time,
                    servings=profile.get("household_size", 2),
                )
            except OpenRouterError as exc:
                st.error(str(exc))

    for index, recipe in enumerate(st.session_state.get("recipes", [])):
        recipe_card(
            recipe.title,
            [recipe.cuisine, recipe.difficulty, f"{recipe.time_minutes} min"],
            recipe.ingredients,
            recipe.steps,
            recipe.tip,
        )
        if st.button("Save to my recipes", key=f"save_{index}", use_container_width=True):
            recipe_id = get_profiles().save_recipe(email, recipe)
            st.success(f"Saved as {recipe_id}. Open **My recipes** to see it.")


def page_my_recipes(email: str) -> None:
    card("My recipes", "Rate them, mark them cooked, and keep the ones that worked.")
    profiles = get_profiles()
    saved = profiles.list_saved(email)
    if not saved:
        st.info("Nothing saved yet.")
        return

    # A list, not a stack of full recipes: the point of this page is rating and
    # tracking, so those controls sit next to each title and the recipe itself
    # stays folded away until you want it.
    for entry in saved:
        head, rate_col, cook_col = st.columns([4, 2, 1.4], gap="medium")
        with head:
            meta = " &middot; ".join(
                str(p) for p in [
                    entry.get("cuisine"),
                    entry.get("difficulty"),
                    f"{entry.get('time_minutes', 0)} min",
                    f"saved {entry['saved_at'][:10]}",
                ] if p
            )
            st.markdown(
                f"<div class='fc-row'><b>{entry['title']}</b><span>{meta}</span></div>",
                unsafe_allow_html=True,
            )
        with rate_col:
            rating = st.slider(
                "Rating", 0, 5, int(entry.get("rating", 0)), key=f"rate_{entry['id']}"
            )
            if rating != entry.get("rating", 0):
                profiles.update_saved(email, entry["id"], rating=rating)
        with cook_col:
            st.write("")
            if entry.get("cooked"):
                st.success("Cooked")
            elif st.button("Mark as cooked", key=f"cook_{entry['id']}", use_container_width=True):
                profiles.update_saved(email, entry["id"], cooked=True)
                st.rerun()

        with st.expander("Show the recipe"):
            left, right = st.columns(2)
            left.markdown("**Ingredients**")
            for item in entry.get("ingredients", []):
                left.write(f"- {item}")
            right.markdown("**Steps**")
            for number, step in enumerate(entry.get("steps", []), start=1):
                right.write(f"{number}. {step}")


def page_profile(email: str) -> None:
    card("Profile", "Your preferences shape every recipe the AI writes for you.")
    profiles = get_profiles()
    profile = profiles.get_profile(email)

    with st.form("profile_form"):
        nickname = st.text_input("Nickname", profile.get("nickname", ""))
        c1, c2 = st.columns(2)
        skill = c1.selectbox(
            "Cooking level",
            ["Beginner", "Intermediate", "Advanced"],
            index=["Beginner", "Intermediate", "Advanced"].index(profile.get("skill_level", "Beginner")),
        )
        household = c2.slider("Household size", 1, 8, int(profile.get("household_size", 2)))
        favorite = st.selectbox(
            "Favorite cuisine", CUISINES, index=CUISINES.index(profile.get("favorite_cuisine", "Any"))
        )
        dietary = st.multiselect("Dietary preferences", DIETARY, default=profile.get("dietary", []))
        allergies = st.text_input("Allergies", profile.get("allergies", ""))

        if st.form_submit_button("Save profile", type="primary", use_container_width=True):
            profiles.save_profile(
                email,
                {
                    "nickname": nickname,
                    "skill_level": skill,
                    "household_size": household,
                    "favorite_cuisine": favorite,
                    "dietary": dietary,
                    "allergies": allergies,
                },
            )
            st.success("Profile saved.")


# --------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------- #
def main() -> None:
    if "user" not in st.session_state:
        login_screen()
        return

    email = st.session_state["user"]
    nickname = st.session_state.get("nickname", email)

    with st.sidebar:
        st.markdown("### 🍳 FridgeChef")
        st.caption(f"Signed in as **{nickname}**")
        st.divider()
        page = st.radio(
            "Go to",
            ["Dashboard", "Recognize ingredients", "Create recipe", "My recipes", "Profile"],
            label_visibility="collapsed",
        )
        st.divider()
        if st.button("Log out", use_container_width=True):
            st.session_state.clear()
            st.rerun()

    if page == "Dashboard":
        page_dashboard(email)
    elif page == "Recognize ingredients":
        page_recognize()
    elif page == "Create recipe":
        page_create(email)
    elif page == "My recipes":
        page_my_recipes(email)
    else:
        page_profile(email)

    st.divider()
    st.caption(f"{Config.APP_NAME} v{Config.APP_VERSION} - Step 3")


if __name__ == "__main__":
    main()

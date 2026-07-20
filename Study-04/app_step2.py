"""
FridgeChef - Step 2: Recipe Generation System
Enhanced Streamlit application with recipe generation
"""
import streamlit as st
import time
import json
import pandas as pd
from datetime import datetime
import uuid

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor
from backend.recipe_generator import RecipeGenerator
from backend.ingredient_manager import IngredientManager
from backend.database import RecipeDatabase

# Page configuration
st.set_page_config(
    page_title="FridgeChef - Recipe Generation System",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'processing' not in st.session_state:
    st.session_state.processing = False
if 'generated_recipes' not in st.session_state:
    st.session_state.generated_recipes = None
if 'ingredient_manager' not in st.session_state:
    st.session_state.ingredient_manager = IngredientManager()
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if 'db' not in st.session_state:
    st.session_state.db = RecipeDatabase()

def main():
    """Main application function"""

    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        st.error(f"Configuration error: {e}")
        st.stop()

    # Header
    st.title("🍳 FridgeChef - Step 2")
    st.subheader("AI-Powered Recipe Generation System")

    # Create tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "📷 Ingredient Recognition",
        "✏️ Edit Ingredients",
        "🍽️ Recipe Generation",
        "📚 Recipe List"
    ])

    with tab1:
        ingredient_recognition_tab()

    with tab2:
        ingredient_editing_tab()

    with tab3:
        recipe_generation_tab()

    with tab4:
        recipe_list_tab()

    # Sidebar
    with st.sidebar:
        sidebar_content()

def ingredient_recognition_tab():
    """Tab for ingredient recognition from image"""
    st.header("Recognize Ingredients from a Fridge Photo")

    col1, col2 = st.columns([1, 1])

    with col1:
        # File uploader
        uploaded_file = st.file_uploader(
            "Choose a photo of your fridge",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False,
            help="Please upload a photo that clearly shows the inside of your fridge"
        )

        if uploaded_file is not None:
            st.image(uploaded_file, caption="Uploaded image", use_container_width=True)

            processor = ImageProcessor()
            is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                st.error(error_msg)
            else:
                st.success("✅ Image uploaded successfully")

                if st.button("🔍 Start Ingredient Recognition", type="primary", use_container_width=True):
                    recognize_ingredients(uploaded_file)

    with col2:
        st.subheader("Recognized Ingredients")

        if st.session_state.recognized_ingredients:
            display_recognized_ingredients(st.session_state.recognized_ingredients)
        else:
            st.info("Upload an image and start ingredient recognition")

def ingredient_editing_tab():
    """Tab for editing ingredients"""
    st.header("Edit and Manage Ingredients")

    manager = st.session_state.ingredient_manager

    # Load ingredients if available
    if st.session_state.recognized_ingredients:
        ingredients = st.session_state.recognized_ingredients.get('ingredients', {})
        if ingredients and not manager.get_ingredients():
            manager.set_ingredients(ingredients)

    # Current ingredients display
    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Current Ingredient List")

        current_ingredients = manager.get_ingredients()

        if current_ingredients:
            for category, items in current_ingredients.items():
                with st.expander(f"**{category}** ({len(items)} items)", expanded=True):
                    for idx, item in enumerate(items):
                        col_item, col_btn = st.columns([4, 1])

                        with col_item:
                            # Editable text input
                            new_value = st.text_input(
                                f"Ingredient {idx+1}",
                                value=item,
                                key=f"edit_{category}_{idx}",
                                label_visibility="collapsed"
                            )

                            if new_value != item:
                                manager.update_ingredient(category, item, new_value)
                                st.rerun()

                        with col_btn:
                            if st.button("❌", key=f"del_{category}_{idx}"):
                                manager.remove_ingredient(category, item)
                                st.rerun()
        else:
            st.info("No ingredients yet. Upload an image or add them manually.")

    with col2:
        st.subheader("Add Ingredient")

        # Category selection
        category = st.selectbox(
            "Category",
            ["vegetables", "meat", "seafood", "dairy", "condiments", "grains", "fruits", "other"]
        )

        # Ingredient input with autocomplete
        ingredient_name = st.text_input("Ingredient name", key="new_ingredient")

        # Show suggestions
        if ingredient_name:
            suggestions = manager.get_suggestions(ingredient_name, category)
            if suggestions:
                st.caption("Suggestions:")
                for sugg in suggestions[:5]:
                    if st.button(sugg, key=f"sugg_{sugg}"):
                        ingredient_name = sugg

        quantity = st.text_input("Quantity (optional)", key="new_quantity")

        if st.button("➕ Add Ingredient", type="primary", use_container_width=True):
            if ingredient_name:
                if manager.add_ingredient(category, ingredient_name, quantity):
                    st.success(f"'{ingredient_name}' added")
                    st.rerun()
                else:
                    st.warning("This ingredient already exists")

        # Statistics
        st.divider()
        st.subheader("📊 Statistics")
        stats = manager.get_statistics()
        st.metric("Total Ingredients", stats['total_ingredients'])
        st.metric("Categories", stats['total_categories'])

        # Validation
        validation = manager.validate_ingredients()
        if not validation['valid']:
            for error in validation['errors']:
                st.error(error)
        for warning in validation['warnings']:
            st.warning(warning)

def recipe_generation_tab():
    """Tab for recipe generation"""
    st.header("Recipe Generation")

    manager = st.session_state.ingredient_manager
    current_ingredients = manager.get_ingredients()

    if not current_ingredients:
        st.warning("Please recognize or add ingredients first")
        return

    # Display current ingredients summary
    with st.expander("View Available Ingredients", expanded=False):
        for category, items in current_ingredients.items():
            st.write(f"**{category}**: {', '.join(items)}")

    # Recipe preferences
    st.subheader("Recipe Settings")

    col1, col2, col3 = st.columns(3)

    with col1:
        difficulty = st.select_slider(
            "Difficulty",
            options=["Easy", "Normal", "Hard"],
            value="Normal"
        )

    with col2:
        cooking_time = st.slider(
            "Max cooking time (min)",
            min_value=10,
            max_value=120,
            value=30,
            step=10
        )

    with col3:
        servings = st.number_input(
            "Servings",
            min_value=1,
            max_value=10,
            value=4
        )

    # Additional preferences
    col1, col2 = st.columns(2)

    with col1:
        cuisine = st.selectbox(
            "Cuisine Type",
            ["Korean", "Chinese", "Japanese", "Western", "Southeast Asian", "Fusion"]
        )

    with col2:
        diet_restrictions = st.multiselect(
            "Dietary Restrictions",
            ["Vegetarian", "Vegan", "Gluten-Free", "Low-Sodium", "Low-Sugar"]
        )

    # Generate button
    if st.button("🍳 Generate Recipes", type="primary", use_container_width=True):
        generate_recipes(current_ingredients, {
            'difficulty': difficulty,
            'cooking_time': f"within {cooking_time} minutes",
            'servings': servings,
            'cuisine': cuisine,
            'diet_restrictions': diet_restrictions
        })

    # Display generated recipes
    if st.session_state.generated_recipes:
        display_generated_recipes(st.session_state.generated_recipes)

def recipe_list_tab():
    """Tab for viewing saved recipes"""
    st.header("Saved Recipes")

    db = st.session_state.db

    # Filters
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        filter_cuisine = st.selectbox(
            "Cuisine Type",
            ["All", "Korean", "Chinese", "Japanese", "Western"]
        )

    with col2:
        filter_difficulty = st.selectbox(
            "Difficulty",
            ["All", "Easy", "Normal", "Hard"]
        )

    with col3:
        filter_time = st.slider(
            "Max time (min)",
            10, 120, 60
        )

    with col4:
        sort_by = st.selectbox(
            "Sort by",
            ["Newest", "Match Score", "Time"]
        )

    # Apply filters
    filters = {}
    if filter_cuisine != "All":
        filters['cuisine'] = filter_cuisine
    if filter_difficulty != "All":
        filters['difficulty'] = filter_difficulty
    filters['max_time'] = filter_time

    # Get recipes
    recipes = db.get_recipes(filters)

    if recipes:
        # Display recipes in grid
        cols = st.columns(3)
        for idx, recipe in enumerate(recipes):
            with cols[idx % 3]:
                display_recipe_card(recipe)
    else:
        st.info("No saved recipes yet")

def sidebar_content():
    """Sidebar content"""
    st.header("ℹ️ FridgeChef Step 2")

    st.info(
        "**New features:**\n"
        "• Recipe generation with the DeepSeek model\n"
        "• Ingredient editing and management\n"
        "• Recipe filtering and search\n"
        "• Database storage"
    )

    # API Test
    if st.button("🔌 Test API Connection"):
        with st.spinner("Checking connection..."):
            client = OpenRouterClient()
            if client.test_connection():
                st.success("✅ API connection successful!")
            else:
                st.error("❌ API connection failed")

    # Database stats
    st.divider()
    st.subheader("📊 Database")

    db = st.session_state.db
    recipes = db.get_recipes()
    st.metric("Saved Recipes", len(recipes))

    recent_sessions = db.get_recent_sessions(3)
    if recent_sessions:
        st.subheader("Recent Activity")
        for session in recent_sessions:
            st.caption(f"• {session['created_at'][:16]}")

def recognize_ingredients(uploaded_file):
    """Recognize ingredients from uploaded image"""
    st.session_state.processing = True

    try:
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        if not image_base64:
            st.error("An error occurred while processing the image")
            return

        client = OpenRouterClient()

        with st.spinner("Recognizing ingredients... (may take up to 30 seconds)"):
            result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result
            st.success(f"✅ Recognized {result.get('total_items', 0)} ingredients!")
            st.balloons()
        else:
            st.error(f"Ingredient recognition failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        st.error(f"An error occurred: {str(e)}")

    finally:
        st.session_state.processing = False
        st.rerun()

def generate_recipes(ingredients, preferences):
    """Generate recipes based on ingredients"""
    generator = RecipeGenerator()

    with st.spinner("Generating recipes... (may take up to 30 seconds)"):
        result = generator.generate_recipes(ingredients, preferences)

    if result.get('status') == 'success':
        st.session_state.generated_recipes = result
        st.success(f"✅ Generated {len(result['recipes'])} recipes!")

        # Save to database
        db = st.session_state.db
        for recipe in result['recipes']:
            db.save_recipe(recipe)

        # Save session
        db.save_session({
            'session_id': st.session_state.session_id,
            'ingredients': ingredients,
            'recipes': result['recipes']
        })

        st.balloons()
    else:
        st.error(f"Recipe generation failed: {result.get('error', 'Unknown error')}")

def display_recognized_ingredients(result):
    """Display recognized ingredients"""
    ingredients = result.get('ingredients', {})

    if not ingredients:
        st.warning("No ingredients were recognized")
        return

    for category, items in ingredients.items():
        if items:
            st.subheader(f"**{category}**")
            cols = st.columns(2)
            for idx, item in enumerate(items):
                with cols[idx % 2]:
                    st.write(f"• {item}")

def display_generated_recipes(result):
    """Display generated recipes"""
    st.divider()
    st.subheader("Generated Recipes")

    recipes = result.get('recipes', [])

    for idx, recipe in enumerate(recipes, 1):
        with st.expander(f"**{idx}. {recipe['name']}**", expanded=(idx == 1)):
            col1, col2 = st.columns([2, 1])

            with col1:
                # Recipe details
                st.write(f"**Difficulty:** {recipe.get('difficulty', 'Normal')}")
                st.write(f"**Cooking time:** {recipe.get('time', 30)} min")
                st.write(f"**Servings:** {recipe.get('servings', 4)}")
                st.write(f"**Calories:** {recipe.get('calories', 0)}kcal")

                # Ingredients
                st.write("\n**Ingredients:**")
                for ing in recipe.get('ingredients', []):
                    st.write(f"• {ing['name']}: {ing.get('amount', '')}")

                # Steps
                st.write("\n**Cooking Instructions:**")
                for i, step in enumerate(recipe.get('steps', []), 1):
                    st.write(f"{i}. {step}")

                # Tips
                if recipe.get('tips'):
                    st.write(f"\n**💡 Tip:** {recipe['tips']}")

            with col2:
                # Match score
                st.metric("Match Score", f"{recipe.get('match_score', 0)}%")

                # Save button
                if st.button(f"💾 Save", key=f"save_{idx}"):
                    st.success("Recipe saved!")

                # Export
                recipe_json = json.dumps(recipe, ensure_ascii=False, indent=2)
                st.download_button(
                    "📄 Export JSON",
                    data=recipe_json,
                    file_name=f"recipe_{recipe['name']}.json",
                    mime="application/json",
                    key=f"export_{idx}"
                )

def display_recipe_card(recipe):
    """Display a recipe card"""
    with st.container():
        st.subheader(recipe['name'])
        st.caption(f"⏱️ {recipe.get('cooking_time', 30)} min | ⭐ {recipe.get('difficulty', 'Normal')}")
        st.caption(f"🔥 {recipe.get('calories', 0)}kcal | 👥 {recipe.get('servings', 4)} servings")

        if st.button("View Details", key=f"view_{recipe['id']}"):
            st.write("Viewing recipe details...")

if __name__ == "__main__":
    main()
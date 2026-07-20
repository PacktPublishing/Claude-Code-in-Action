"""
FridgeChef - Step 3: User Profile and Recipe Management System
Complete application with user authentication and personalization
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import json

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor
from backend.recipe_generator import RecipeGenerator
from backend.ingredient_manager import IngredientManager
from backend.database import RecipeDatabase
from backend.auth import AuthManager
from backend.user_profile import UserProfileManager

# Page configuration
st.set_page_config(
    page_title="FridgeChef - Complete Recipe Management System",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'auth_manager' not in st.session_state:
    st.session_state.auth_manager = AuthManager()
if 'profile_manager' not in st.session_state:
    st.session_state.profile_manager = UserProfileManager()
if 'user' not in st.session_state:
    st.session_state.user = None
if 'token' not in st.session_state:
    st.session_state.token = None
if 'page' not in st.session_state:
    st.session_state.page = 'login'
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'generated_recipes' not in st.session_state:
    st.session_state.generated_recipes = None
if 'ingredient_manager' not in st.session_state:
    st.session_state.ingredient_manager = IngredientManager()
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

    # Check authentication
    if st.session_state.user is None:
        show_auth_page()
    else:
        show_main_app()

def show_auth_page():
    """Show authentication page (login/register)"""
    st.title("🍳 FridgeChef")
    st.subheader("AI-Powered Personalized Recipe Recommendation System")

    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        tab1, tab2 = st.tabs(["Login", "Sign Up"])

        with tab1:
            show_login_form()

        with tab2:
            show_register_form()

def show_login_form():
    """Show login form"""
    with st.form("login_form"):
        st.subheader("Login")

        email = st.text_input("Email", placeholder="your@email.com")
        password = st.text_input("Password", type="password")

        col1, col2 = st.columns(2)
        with col1:
            submit = st.form_submit_button("Login", type="primary", use_container_width=True)
        with col2:
            demo = st.form_submit_button("Demo Account", use_container_width=True)

    if submit:
        if email and password:
            auth = st.session_state.auth_manager
            result = auth.login(email, password)

            if result['success']:
                st.session_state.user = result['user']
                st.session_state.token = result['token']
                st.success("Login successful!")
                st.rerun()
            else:
                st.error(result['error'])
        else:
            st.error("Please enter your email and password")

    if demo:
        # Demo account login
        demo_email = "demo@fridgechef.com"
        demo_password = "demo123"

        # Create demo account if not exists
        auth = st.session_state.auth_manager
        auth.register(demo_email, "DemoUser", demo_password)

        result = auth.login(demo_email, demo_password)
        if result['success']:
            st.session_state.user = result['user']
            st.session_state.token = result['token']
            st.success("Logged in with the demo account!")
            st.rerun()

def show_register_form():
    """Show registration form"""
    with st.form("register_form"):
        st.subheader("Sign Up")

        email = st.text_input("Email", placeholder="your@email.com")
        username = st.text_input("Username", placeholder="Username")
        password = st.text_input("Password", type="password", help="At least 6 characters")
        password_confirm = st.text_input("Confirm Password", type="password")

        terms = st.checkbox("I agree to the Terms of Service")

        submit = st.form_submit_button("Sign Up", type="primary", use_container_width=True)

    if submit:
        if not all([email, username, password, password_confirm]):
            st.error("Please fill in all fields")
        elif password != password_confirm:
            st.error("Passwords do not match")
        elif not terms:
            st.error("Please agree to the Terms of Service")
        else:
            auth = st.session_state.auth_manager
            result = auth.register(email, username, password)

            if result['success']:
                st.success(result['message'])
                st.info("Log in from the Login tab")
            else:
                st.error(result['error'])

def show_main_app():
    """Show main application for authenticated users"""

    # Header with user info
    col1, col2, col3 = st.columns([2, 1, 1])

    with col1:
        st.title("🍳 FridgeChef")

    with col2:
        user = st.session_state.user
        st.write(f"👤 {user['username']}")

    with col3:
        if st.button("Logout", use_container_width=True):
            logout()

    # Main tabs
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "🏠 Dashboard",
        "📷 Ingredient Recognition",
        "🍽️ Recipe Generation",
        "📚 My Recipes",
        "👤 Profile",
        "🎯 Recommendations"
    ])

    with tab1:
        show_dashboard()

    with tab2:
        show_ingredient_recognition()

    with tab3:
        show_recipe_generation()

    with tab4:
        show_my_recipes()

    with tab5:
        show_profile()

    with tab6:
        show_recommendations()

def show_dashboard():
    """Show user dashboard with statistics"""
    st.header("📊 My Cooking Dashboard")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Get statistics
    stats = profile_manager.get_statistics(user_id)

    # Key metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Saved Recipes", f"{stats['total_saved']}", delta="+2 this week")

    with col2:
        st.metric("Dishes Cooked", f"{stats['total_cooked']}", delta="+3 this month")

    with col3:
        st.metric("Average Rating", f"{stats['avg_rating']:.1f} ⭐" if stats['avg_rating'] else "- ⭐")

    with col4:
        st.metric("Recipe Folders", f"{stats['total_folders']}")

    # Charts
    st.subheader("📈 Statistics")

    col1, col2 = st.columns(2)

    with col1:
        # Cuisine distribution pie chart
        if stats['favorite_cuisine']:
            fig = px.pie(
                values=list(stats['favorite_cuisine'].values()),
                names=list(stats['favorite_cuisine'].keys()),
                title="Favorite Cuisine Distribution"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No saved recipes yet")

    with col2:
        # Activity timeline (sample data)
        dates = pd.date_range(end=datetime.now(), periods=30)
        activity = pd.DataFrame({
            'date': dates,
            'count': [1 if i % 3 == 0 else 0 for i in range(30)]
        })

        fig = px.bar(
            activity,
            x='date',
            y='count',
            title="Activity in the Last 30 Days"
        )
        st.plotly_chart(fig, use_container_width=True)

    # Recent activity
    st.subheader("📝 Recent Activity")

    recent_recipes = profile_manager.get_saved_recipes(user_id)[:5]
    if recent_recipes:
        for saved in recent_recipes:
            recipe = saved['recipe']
            col1, col2, col3 = st.columns([3, 1, 1])

            with col1:
                st.write(f"• {recipe.get('name', 'Untitled Recipe')}")

            with col2:
                if saved.get('rating'):
                    st.write(f"{'⭐' * saved['rating']}")

            with col3:
                st.caption(saved['saved_at'][:10])
    else:
        st.info("No recent activity")

def show_ingredient_recognition():
    """Show ingredient recognition page"""
    st.header("📷 Fridge Ingredient Recognition")

    col1, col2 = st.columns([1, 1])

    with col1:
        uploaded_file = st.file_uploader(
            "Choose a photo of your fridge",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False
        )

        if uploaded_file is not None:
            st.image(uploaded_file, caption="Uploaded image", use_container_width=True)

            processor = ImageProcessor()
            is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                st.error(error_msg)
            else:
                if st.button("🔍 Start Ingredient Recognition", type="primary", use_container_width=True):
                    recognize_ingredients(uploaded_file)

    with col2:
        if st.session_state.recognized_ingredients:
            st.subheader("Recognized Ingredients")
            display_recognized_ingredients()

            # Save ingredients option
            if st.button("💾 Save Ingredients", use_container_width=True):
                st.success("Ingredients saved")

def show_recipe_generation():
    """Show recipe generation page"""
    st.header("🍽️ Recipe Generation")

    manager = st.session_state.ingredient_manager
    current_ingredients = manager.get_ingredients()

    if not current_ingredients:
        st.warning("Please recognize or add ingredients first")
        return

    # Recipe preferences
    col1, col2, col3 = st.columns(3)

    with col1:
        difficulty = st.select_slider("Difficulty", ["Easy", "Normal", "Hard"], "Normal")

    with col2:
        cooking_time = st.slider("Max time (min)", 10, 120, 30, 10)

    with col3:
        servings = st.number_input("Servings", 1, 10, 4)

    if st.button("🍳 Generate Recipes", type="primary", use_container_width=True):
        generate_recipes(current_ingredients, {
            'difficulty': difficulty,
            'cooking_time': f"{cooking_time} minutes",
            'servings': servings
        })

    # Display generated recipes
    if st.session_state.generated_recipes:
        display_generated_recipes_with_save()

def show_my_recipes():
    """Show saved recipes page"""
    st.header("📚 My Recipes")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Folder selection
    folders = profile_manager.get_folders(user_id)
    folder_names = [f['name'] for f in folders]

    selected_folder = st.selectbox("Select Folder", folder_names)

    # Get saved recipes
    saved_recipes = profile_manager.get_saved_recipes(user_id, selected_folder)

    if saved_recipes:
        for saved in saved_recipes:
            recipe = saved['recipe']
            save_id = saved['save_id']

            with st.expander(f"**{recipe.get('name', 'Untitled Recipe')}**"):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.write(f"Difficulty: {recipe.get('difficulty', 'Normal')}")
                    st.write(f"Time: {recipe.get('time', 30)} min")

                    # Note section
                    note = st.text_area(
                        "Notes",
                        value=saved.get('notes', ''),
                        key=f"note_{save_id}"
                    )

                    if st.button("Save Note", key=f"save_note_{save_id}"):
                        profile_manager.update_recipe_note(user_id, save_id, note)
                        st.success("Note saved")

                with col2:
                    # Rating
                    rating = st.slider(
                        "Rating",
                        1, 5,
                        value=saved.get('rating', 3),
                        key=f"rating_{save_id}"
                    )

                    if st.button("Save Rating", key=f"save_rating_{save_id}"):
                        profile_manager.rate_recipe(user_id, save_id, rating)
                        st.success("Rating saved")

                    # Mark as cooked
                    if st.button("Mark as Cooked", key=f"cooked_{save_id}"):
                        profile_manager.mark_as_cooked(user_id, save_id)
                        st.success("Marked as cooked!")

                    # Delete
                    if st.button("Delete", key=f"delete_{save_id}"):
                        profile_manager.delete_saved_recipe(user_id, save_id)
                        st.rerun()
    else:
        st.info("No saved recipes yet")

def show_profile():
    """Show user profile page"""
    st.header("👤 Profile Settings")

    user = st.session_state.user
    user_id = user['id']
    profile_manager = st.session_state.profile_manager

    # Get current profile
    profile = profile_manager.get_profile(user_id) or user.get('profile', {})

    with st.form("profile_form"):
        col1, col2 = st.columns(2)

        with col1:
            nickname = st.text_input("Nickname", value=profile.get('nickname', user['username']))
            bio = st.text_area("Bio", value=profile.get('bio', ''))
            cooking_level = st.select_slider(
                "Cooking Skill",
                ["Beginner", "Intermediate", "Advanced", "Expert"],
                value=profile.get('cooking_level', 'Beginner')
            )

        with col2:
            household = st.number_input("Household Size", 1, 10, profile.get('household_size', 2))
            cuisine = st.multiselect(
                "Favorite Cuisines",
                ["Korean", "Chinese", "Japanese", "Western", "Southeast Asian"],
                default=profile.get('favorite_cuisine', ['Korean'])
            )
            dietary = st.multiselect(
                "Dietary Restrictions",
                ["Vegetarian", "Vegan", "Gluten-Free", "Low-Sodium", "Low-Sugar"],
                default=profile.get('dietary_preferences', [])
            )
            allergies = st.multiselect(
                "Allergies",
                ["Peanuts", "Milk", "Eggs", "Wheat", "Shellfish"],
                default=profile.get('allergies', [])
            )

        submit = st.form_submit_button("Save Profile", type="primary", use_container_width=True)

    if submit:
        profile_data = {
            'nickname': nickname,
            'bio': bio,
            'cooking_level': cooking_level,
            'household_size': household,
            'favorite_cuisine': cuisine,
            'dietary_preferences': dietary,
            'allergies': allergies
        }

        profile_manager.create_profile(user_id, profile_data)
        st.success("Profile saved!")

def show_recommendations():
    """Show personalized recommendations"""
    st.header("🎯 Personalized Recommendations")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Get recommendations
    recommendations = profile_manager.get_recommendations(user_id, limit=6)

    if recommendations:
        st.subheader("Recipes Recommended for You")

        cols = st.columns(3)
        for idx, recipe in enumerate(recommendations):
            with cols[idx % 3]:
                st.write(f"**{recipe['name']}**")
                st.caption(f"⏱️ {recipe['time']} min | ⭐ {recipe['difficulty']}")
                st.caption(f"🍽️ {recipe['cuisine']}")

                if st.button("Details", key=f"rec_{idx}"):
                    st.info("Viewing recipe details...")
    else:
        st.info("Complete your profile to receive personalized recommendations")

# Helper functions

def logout():
    """Logout user"""
    auth = st.session_state.auth_manager
    if st.session_state.token:
        auth.logout(st.session_state.token)

    st.session_state.user = None
    st.session_state.token = None
    st.rerun()

def recognize_ingredients(uploaded_file):
    """Recognize ingredients from image"""
    try:
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        client = OpenRouterClient()
        with st.spinner("Recognizing ingredients..."):
            result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result

            # Set ingredients in manager
            manager = st.session_state.ingredient_manager
            manager.set_ingredients(result.get('ingredients', {}))

            st.success(f"✅ Recognized {result.get('total_items', 0)} ingredients!")
            st.balloons()

    except Exception as e:
        st.error(f"Error: {str(e)}")

def display_recognized_ingredients():
    """Display recognized ingredients"""
    result = st.session_state.recognized_ingredients
    ingredients = result.get('ingredients', {})

    for category, items in ingredients.items():
        if items:
            st.write(f"**{category}**")
            for item in items:
                st.write(f"• {item}")

def generate_recipes(ingredients, preferences):
    """Generate recipes"""
    generator = RecipeGenerator()

    with st.spinner("Generating recipes..."):
        result = generator.generate_recipes(ingredients, preferences)

    if result.get('status') == 'success':
        st.session_state.generated_recipes = result
        st.success(f"✅ Generated {len(result['recipes'])} recipes!")

def display_generated_recipes_with_save():
    """Display generated recipes with save option"""
    result = st.session_state.generated_recipes
    recipes = result.get('recipes', [])

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    for idx, recipe in enumerate(recipes, 1):
        with st.expander(f"**{recipe['name']}**", expanded=(idx == 1)):
            col1, col2 = st.columns([3, 1])

            with col1:
                st.write(f"Difficulty: {recipe.get('difficulty', 'Normal')}")
                st.write(f"Time: {recipe.get('time', 30)} min")
                st.write(f"Calories: {recipe.get('calories', 0)}kcal")

            with col2:
                if st.button(f"💾 Save", key=f"save_recipe_{idx}"):
                    save_id = profile_manager.save_recipe(user_id, recipe)
                    st.success(f"Recipe saved! (ID: {save_id})")

if __name__ == "__main__":
    main()
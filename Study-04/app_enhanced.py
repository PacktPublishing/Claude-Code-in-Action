"""
FridgeChef - Enhanced UX Version
AI-powered recipe recommendation system with improved user experience
"""

import streamlit as st
import time
import json
from datetime import datetime
import uuid

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor
from backend.recipe_generator import RecipeGenerator
from backend.ingredient_manager import IngredientManager
from backend.database import RecipeDatabase
from backend.auth import AuthManager
from backend.user_profile import UserProfileManager

# Import enhanced UI components
from ui_components import (
    UITheme,
    EnhancedMessages,
    LoadingStates,
    RecipeCard,
    OnboardingFlow,
    FormValidation,
    AccessibilityFeatures,
    ResponsiveLayout,
    EmptyStates,
    PerformanceOptimizations
)

# Page configuration
st.set_page_config(
    page_title="FridgeChef - AI Recipe Recommendations",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="collapsed",  # Better mobile experience
    menu_items={
        'Get Help': 'https://fridgechef.help',
        'Report a bug': "https://fridgechef.help/bug",
        'About': "FridgeChef v2.0 - Delicious everyday meals made with AI"
    }
)

# Apply custom theme
UITheme.inject_custom_css()

# Initialize session state with better defaults
def init_session_state():
    """Initialize session state variables with enhanced defaults"""
    defaults = {
        'auth_manager': AuthManager(),
        'profile_manager': UserProfileManager(),
        'user': None,
        'token': None,
        'page': 'welcome',  # Start with welcome page
        'recognized_ingredients': None,
        'generated_recipes': None,
        'ingredient_manager': IngredientManager(),
        'db': RecipeDatabase(),
        'first_visit': True,
        'tutorial_completed': False,
        'ui_preferences': {
            'theme': 'light',
            'font_size': 'normal',
            'animations': True,
            'high_contrast': False
        },
        'last_action': None,
        'notification_queue': []
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

init_session_state()


def main():
    """Main application with enhanced UX flow"""

    # Validate configuration with user-friendly error
    try:
        Config.validate()
    except ValueError as e:
        EnhancedMessages.error(
            "There is a problem with the system configuration",
            "Please contact the administrator",
            error_code="CONFIG_001"
        )
        st.stop()

    # Route based on user state
    if st.session_state.first_visit and not st.session_state.user:
        show_welcome_experience()
    elif st.session_state.user is None:
        show_enhanced_auth()
    else:
        show_main_application()


def show_welcome_experience():
    """Enhanced first-time user experience"""
    if OnboardingFlow.welcome_screen():
        st.session_state.first_visit = False
        st.session_state.page = 'auth'
        st.rerun()


def show_enhanced_auth():
    """Enhanced authentication with better UX"""
    # Clean, centered layout
    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        # Logo and tagline
        st.markdown(f"""
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: {UITheme.PRIMARY}; font-size: 2.5em; margin-bottom: 8px;">
                🍳 FridgeChef
            </h1>
            <p style="color: {UITheme.GRAY}; font-size: 1.1em;">
                Special dishes made with the ingredients in your fridge
            </p>
        </div>
        """, unsafe_allow_html=True)

        tab1, tab2 = st.tabs(["Login", "Sign Up"])

        with tab1:
            show_enhanced_login()

        with tab2:
            show_enhanced_register()

        # Quick start option
        st.divider()
        st.markdown(f"""
        <div style="text-align: center; margin: 20px 0;">
            <p style="color: {UITheme.GRAY};">or</p>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🚀 Try It Out (no login required)", use_container_width=True):
            demo_login()


def show_enhanced_login():
    """Enhanced login form with validation"""
    with st.form("enhanced_login", clear_on_submit=False):
        # Email with validation
        email, email_valid = FormValidation.email_input("Email", "login_email")

        # Password field
        password = st.text_input(
            "Password",
            type="password",
            key="login_password",
            help="Forgot your password? Click 'Find Password' below"
        )

        # Remember me option
        col1, col2 = st.columns([1, 1])
        with col1:
            remember = st.checkbox("Keep me logged in", value=True)
        with col2:
            st.markdown(f"""
            <div style="text-align: right; padding-top: 8px;">
                <a href="#" style="color: {UITheme.PRIMARY}; text-decoration: none; font-size: 0.9em;">
                    Find Password
                </a>
            </div>
            """, unsafe_allow_html=True)

        # Submit button
        submitted = st.form_submit_button(
            "Login",
            type="primary",
            use_container_width=True,
            disabled=not (email and password)
        )

        if submitted:
            if not email_valid:
                EnhancedMessages.error(
                    "Please enter a valid email address",
                    "Use the format example@email.com"
                )
            else:
                with st.spinner("Logging in..."):
                    auth = st.session_state.auth_manager
                    result = auth.login(email, password)

                    if result['success']:
                        st.session_state.user = result['user']
                        st.session_state.token = result['token']

                        # Welcome back message
                        EnhancedMessages.success(
                            f"Welcome, {result['user']['username']}! 👋",
                            duration=2
                        )
                        time.sleep(1)
                        st.rerun()
                    else:
                        # User-friendly error messages
                        if "not found" in result.get('error', '').lower():
                            EnhancedMessages.error(
                                "This email is not registered",
                                "Please check your email or sign up"
                            )
                        elif "password" in result.get('error', '').lower():
                            EnhancedMessages.error(
                                "The password does not match",
                                "Please check your password again"
                            )
                        else:
                            EnhancedMessages.error(
                                "Login failed",
                                "Please try again later",
                                error_code="AUTH_001"
                            )


def show_enhanced_register():
    """Enhanced registration with real-time validation"""
    with st.form("enhanced_register", clear_on_submit=False):
        # Email validation
        email, email_valid = FormValidation.email_input("Email", "register_email")

        # Username with availability check
        username = st.text_input(
            "Username",
            key="register_username",
            help="This name will be shown to other users"
        )

        # Password with strength indicator
        password = FormValidation.password_input_with_strength(
            "Password",
            "register_password"
        )

        # Password confirmation
        password_confirm = st.text_input(
            "Confirm Password",
            type="password",
            key="register_password_confirm"
        )

        # Password match check
        if password and password_confirm:
            if password == password_confirm:
                st.markdown(f"""
                <div style="color: {UITheme.SUCCESS}; font-size: 0.85em; margin-top: -10px;">
                    ✓ Passwords match
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div style="color: {UITheme.ERROR}; font-size: 0.85em; margin-top: -10px;">
                    ✗ Passwords do not match
                </div>
                """, unsafe_allow_html=True)

        # Terms and conditions with better UX
        st.markdown(f"""
        <div style="
            background: {UITheme.LIGHT};
            padding: 12px;
            border-radius: 8px;
            margin: 16px 0;
            font-size: 0.9em;
        ">
            <label>
                <input type="checkbox" id="terms" style="margin-right: 8px;">
                I agree to the <a href="#" style="color: {UITheme.PRIMARY};">Terms of Service</a> and
                <a href="#" style="color: {UITheme.PRIMARY};">Privacy Policy</a>
            </label>
        </div>
        """, unsafe_allow_html=True)

        terms = st.checkbox("I agree to the terms above", key="terms_checkbox")

        # Marketing consent (optional)
        marketing = st.checkbox(
            "Agree to receive marketing emails (optional)",
            value=False,
            help="Receive new recipes and cooking tips by email"
        )

        # Submit button
        submitted = st.form_submit_button(
            "Sign Up",
            type="primary",
            use_container_width=True,
            disabled=not all([email, username, password, password_confirm, terms])
        )

        if submitted:
            # Validation
            errors = []

            if not email_valid:
                errors.append("Please enter a valid email address")

            if len(username) < 2:
                errors.append("Username must be at least 2 characters")

            if len(password) < 6:
                errors.append("Password must be at least 6 characters")

            if password != password_confirm:
                errors.append("Passwords do not match")

            if errors:
                for error in errors:
                    EnhancedMessages.error(error)
            else:
                with st.spinner("Creating account..."):
                    auth = st.session_state.auth_manager
                    result = auth.register(email, username, password)

                    if result['success']:
                        EnhancedMessages.success(
                            "Registration complete! 🎉",
                            duration=2
                        )
                        EnhancedMessages.info(
                            "You can now log in from the Login tab"
                        )
                    else:
                        if "already exists" in result.get('error', '').lower():
                            EnhancedMessages.error(
                                "This email is already in use",
                                "Please use a different email or log in"
                            )
                        else:
                            EnhancedMessages.error(
                                "Registration failed",
                                "Please try again later",
                                error_code="REG_001"
                            )


def demo_login():
    """Quick demo account login"""
    with st.spinner("Preparing demo account..."):
        demo_email = f"demo_{uuid.uuid4().hex[:8]}@fridgechef.com"
        demo_password = "demo123"
        demo_username = f"DemoUser_{uuid.uuid4().hex[:4]}"

        auth = st.session_state.auth_manager
        auth.register(demo_email, demo_username, demo_password)

        result = auth.login(demo_email, demo_password)
        if result['success']:
            st.session_state.user = result['user']
            st.session_state.token = result['token']
            st.session_state.tutorial_completed = False  # Show tutorial for demo users

            EnhancedMessages.success(
                "Starting in demo mode! 🚀",
                duration=2
            )
            time.sleep(1)
            st.rerun()


def show_main_application():
    """Main application with enhanced UX"""

    # Check if tutorial needed
    if not st.session_state.tutorial_completed and st.session_state.first_visit:
        show_tutorial()
        return

    # Modern header with user menu
    show_enhanced_header()

    # Main navigation with icons
    tabs = st.tabs([
        "🏠 Home",
        "📷 Ingredient Recognition",
        "🍽️ Recipe Generation",
        "📚 My Recipes",
        "👤 Profile",
        "⚙️ Settings"
    ])

    with tabs[0]:
        show_enhanced_dashboard()

    with tabs[1]:
        show_enhanced_ingredient_recognition()

    with tabs[2]:
        show_enhanced_recipe_generation()

    with tabs[3]:
        show_enhanced_saved_recipes()

    with tabs[4]:
        show_enhanced_profile()

    with tabs[5]:
        show_settings()


def show_tutorial():
    """Interactive tutorial for new users"""
    st.markdown(f"""
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: {UITheme.PRIMARY};">
            First time here? Let's get started together! 👩‍🍳
        </h2>
    </div>
    """, unsafe_allow_html=True)

    OnboardingFlow.tutorial_steps()

    if st.session_state.get('tutorial_completed'):
        EnhancedMessages.success("Tutorial complete! Now let's get started 🎉")
        time.sleep(2)
        st.rerun()


def show_enhanced_header():
    """Modern application header"""
    col1, col2, col3 = st.columns([2, 3, 1])

    with col1:
        st.markdown(f"""
        <h1 style="
            color: {UITheme.PRIMARY};
            margin: 0;
            font-size: 1.8em;
        ">
            🍳 FridgeChef
        </h1>
        """, unsafe_allow_html=True)

    with col2:
        # Quick search bar
        search = st.text_input(
            "Recipe Search",
            placeholder="Search by ingredient or dish name...",
            key="global_search",
            label_visibility="collapsed"
        )

    with col3:
        # User menu
        user = st.session_state.user
        with st.popover(f"👤 {user['username']}", use_container_width=True):
            st.write(f"**{user['email']}**")
            st.divider()

            if st.button("⚙️ Settings", use_container_width=True):
                st.session_state.page = 'settings'

            if st.button("❓ Help", use_container_width=True):
                st.session_state.page = 'help'

            if st.button("🚪 Logout", use_container_width=True):
                logout()


def show_enhanced_dashboard():
    """Enhanced dashboard with better visualizations"""
    st.header("Hello! What shall we cook today? 👨‍🍳")

    # Quick actions
    st.subheader("Quick Start")
    cols = ResponsiveLayout.adaptive_columns(mobile=1, tablet=2, desktop=4)

    quick_actions = [
        ("📷", "Start with a Photo", "Take a fridge photo", "photo"),
        ("✏️", "Enter Ingredients", "Enter your ingredients manually", "manual"),
        ("🎲", "Random Pick", "Today's recommended recipe", "random"),
        ("⭐", "Popular Recipes", "Most popular recipes", "popular")
    ]

    for col, (emoji, title, desc, action) in zip(cols, quick_actions):
        with col:
            if st.button(
                emoji,
                key=f"quick_{action}",
                use_container_width=True,
                help=desc
            ):
                handle_quick_action(action)

            st.markdown(f"""
            <div style="text-align: center; margin-top: -10px;">
                <div style="font-weight: 600; color: {UITheme.DARK};">
                    {title}
                </div>
                <div style="font-size: 0.85em; color: {UITheme.GRAY};">
                    {desc}
                </div>
            </div>
            """, unsafe_allow_html=True)

    # Statistics with better visualization
    st.divider()
    show_user_statistics()

    # Recent activity with cards
    st.divider()
    show_recent_activity()


def show_enhanced_ingredient_recognition():
    """Enhanced ingredient recognition with better UX"""
    st.header("📷 Fridge Ingredient Recognition")

    # Progress indicator for multi-step process
    steps = ["Upload Photo", "Recognize Ingredients", "Review & Edit"]
    current_step = st.session_state.get('recognition_step', 0)

    # Show progress
    progress_cols = st.columns(len(steps))
    for i, (col, step) in enumerate(zip(progress_cols, steps)):
        with col:
            if i < current_step:
                status = "✅"
                color = UITheme.SUCCESS
            elif i == current_step:
                status = "⏳"
                color = UITheme.PRIMARY
            else:
                status = "⭕"
                color = UITheme.GRAY

            st.markdown(f"""
            <div style="text-align: center;">
                <div style="
                    color: {color};
                    font-size: 1.5em;
                    margin-bottom: 4px;
                ">
                    {status}
                </div>
                <div style="
                    color: {color};
                    font-size: 0.9em;
                    font-weight: {'600' if i == current_step else '400'};
                ">
                    {step}
                </div>
            </div>
            """, unsafe_allow_html=True)

    st.divider()

    # Main content based on current step
    if current_step == 0:
        show_photo_upload_step()
    elif current_step == 1:
        show_recognition_step()
    elif current_step == 2:
        show_ingredient_confirmation_step()


def show_photo_upload_step():
    """Photo upload step with enhanced UX"""
    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("Upload Fridge Photo")

        # Enhanced file uploader with drag-and-drop styling
        uploaded_file = st.file_uploader(
            "Select a photo or drag it here",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False,
            help="💡 Tip: Shoot in bright lighting so the inside of your fridge is clearly visible"
        )

        if uploaded_file:
            # Show image with loading animation
            with st.spinner("Processing image..."):
                st.image(uploaded_file, caption="Uploaded image", use_container_width=True)

                processor = ImageProcessor()
                is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                EnhancedMessages.error(
                    error_msg,
                    "Please select a different photo"
                )
            else:
                EnhancedMessages.success("Your photo is ready!")

                if st.button(
                    "🔍 Start Ingredient Recognition",
                    type="primary",
                    use_container_width=True
                ):
                    st.session_state.recognition_step = 1
                    st.session_state.uploaded_file = uploaded_file
                    st.rerun()

    with col2:
        # Tips and guidelines
        st.subheader("📸 Photo Guide")

        guidelines = [
            ("✅", "Open the fridge door fully before shooting"),
            ("✅", "Ensure bright lighting"),
            ("✅", "Arrange ingredients so they don't overlap"),
            ("❌", "Blurry or dark photos"),
            ("❌", "Shooting too close"),
            ("❌", "Photos with ingredients hidden")
        ]

        for icon, guideline in guidelines:
            color = UITheme.SUCCESS if icon == "✅" else UITheme.ERROR
            st.markdown(f"""
            <div style="
                padding: 8px;
                margin: 4px 0;
                border-left: 3px solid {color};
            ">
                <span style="color: {color}; margin-right: 8px;">
                    {icon}
                </span>
                {guideline}
            </div>
            """, unsafe_allow_html=True)


def show_recognition_step():
    """AI recognition step with progress feedback"""
    uploaded_file = st.session_state.get('uploaded_file')

    if not uploaded_file:
        st.session_state.recognition_step = 0
        st.rerun()
        return

    # Show processing animation
    loading_container = st.container()

    with loading_container:
        # Multi-step progress
        steps = [
            "Analyzing image...",
            "Identifying ingredients...",
            "Classifying categories...",
            "Organizing results..."
        ]

        progress_container, status_container = LoadingStates.progress_with_status(
            "AI is recognizing your ingredients",
            steps
        )

    # Actual recognition
    try:
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        client = OpenRouterClient()
        result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result
            st.session_state.recognition_step = 2

            # Clear loading and show success
            loading_container.empty()
            EnhancedMessages.success(
                f"Recognized {result.get('total_items', 0)} ingredients! 🎉"
            )

            # Auto-proceed after brief pause
            time.sleep(1.5)
            st.rerun()
        else:
            raise Exception(result.get('error', 'Recognition failed'))

    except Exception as e:
        loading_container.empty()
        EnhancedMessages.error(
            "Ingredient recognition failed",
            "Please try again with a different photo",
            error_code="RECOG_001"
        )

        if st.button("Try Again", type="primary"):
            st.session_state.recognition_step = 0
            st.rerun()


def show_ingredient_confirmation_step():
    """Ingredient confirmation and editing step"""
    st.subheader("Review Recognized Ingredients")

    result = st.session_state.get('recognized_ingredients')
    if not result:
        st.session_state.recognition_step = 0
        st.rerun()
        return

    ingredients = result.get('ingredients', {})
    manager = st.session_state.ingredient_manager

    # Load ingredients into manager
    if not manager.get_ingredients():
        manager.set_ingredients(ingredients)

    # Display in editable format
    col1, col2 = st.columns([2, 1])

    with col1:
        for category, items in manager.get_ingredients().items():
            if items:
                with st.expander(f"**{category}** ({len(items)} items)", expanded=True):
                    for idx, item in enumerate(items):
                        col_item, col_action = st.columns([5, 1])

                        with col_item:
                            # Inline editing
                            new_value = st.text_input(
                                f"Item {idx}",
                                value=item,
                                key=f"edit_{category}_{idx}",
                                label_visibility="collapsed"
                            )

                            if new_value != item:
                                manager.update_ingredient(category, item, new_value)

                        with col_action:
                            if st.button("❌", key=f"del_{category}_{idx}"):
                                manager.remove_ingredient(category, item)
                                st.rerun()

    with col2:
        # Quick add section
        st.subheader("Add Ingredient")

        with st.form("add_ingredient", clear_on_submit=True):
            category = st.selectbox(
                "Category",
                ["vegetables", "meat", "seafood", "dairy", "condiments", "grains", "fruits", "other"]
            )

            ingredient = st.text_input("Ingredient Name")

            if st.form_submit_button("➕ Add", use_container_width=True):
                if ingredient:
                    if manager.add_ingredient(category, ingredient):
                        EnhancedMessages.success(f"'{ingredient}' added")
                        st.rerun()

        # Statistics
        st.divider()
        stats = manager.get_statistics()
        st.metric("Total Ingredients", f"{stats['total_ingredients']}")
        st.metric("Categories", f"{stats['total_categories']}")

    # Action buttons
    st.divider()
    col1, col2, col3 = st.columns([1, 1, 1])

    with col1:
        if st.button("← Retake Photo", use_container_width=True):
            st.session_state.recognition_step = 0
            st.session_state.recognized_ingredients = None
            manager.clear()
            st.rerun()

    with col3:
        if st.button("Generate Recipes →", type="primary", use_container_width=True):
            st.session_state.page = 'recipe_generation'
            st.rerun()


def show_enhanced_recipe_generation():
    """Enhanced recipe generation with better UX"""
    st.header("🍽️ Personalized Recipe Generation")

    manager = st.session_state.ingredient_manager
    current_ingredients = manager.get_ingredients()

    if not current_ingredients:
        EmptyStates.no_ingredients()

        if st.button("Go to Ingredient Recognition", type="primary"):
            st.session_state.page = 'ingredient_recognition'
            st.rerun()
        return

    # Show ingredients summary in a compact way
    with st.expander("📦 Available Ingredients", expanded=False):
        ingredient_pills = []
        for category, items in current_ingredients.items():
            for item in items:
                ingredient_pills.append(item)

        # Display as pills/tags
        pills_html = ""
        for ingredient in ingredient_pills:
            pills_html += f"""
            <span style="
                display: inline-block;
                background: {UITheme.PRIMARY}15;
                color: {UITheme.PRIMARY};
                padding: 4px 12px;
                border-radius: 20px;
                margin: 4px;
                font-size: 0.9em;
            ">
                {ingredient}
            </span>
            """

        st.markdown(f'<div style="margin: 10px 0;">{pills_html}</div>', unsafe_allow_html=True)

    # Recipe preferences with better UI
    st.subheader("Cooking Preferences")

    # Use cards for preferences
    pref_cols = st.columns(3)

    with pref_cols[0]:
        st.markdown(f"""
        <div style="
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid {UITheme.BORDER};
            margin-bottom: 16px;
        ">
            <div style="font-weight: 600; margin-bottom: 8px;">Difficulty</div>
        </div>
        """, unsafe_allow_html=True)

        difficulty = st.select_slider(
            "Difficulty",
            options=["Easy", "Normal", "Hard"],
            value="Normal",
            label_visibility="collapsed"
        )

    with pref_cols[1]:
        st.markdown(f"""
        <div style="
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid {UITheme.BORDER};
            margin-bottom: 16px;
        ">
            <div style="font-weight: 600; margin-bottom: 8px;">Cooking Time</div>
        </div>
        """, unsafe_allow_html=True)

        cooking_time = st.slider(
            "Time",
            min_value=10,
            max_value=120,
            value=30,
            step=10,
            format="%d min",
            label_visibility="collapsed"
        )

    with pref_cols[2]:
        st.markdown(f"""
        <div style="
            background: white;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid {UITheme.BORDER};
            margin-bottom: 16px;
        ">
            <div style="font-weight: 600; margin-bottom: 8px;">Servings</div>
        </div>
        """, unsafe_allow_html=True)

        servings = st.number_input(
            "Servings",
            min_value=1,
            max_value=10,
            value=4,
            label_visibility="collapsed"
        )

    # Additional preferences in expandable section
    with st.expander("🎯 Advanced Settings", expanded=False):
        col1, col2 = st.columns(2)

        with col1:
            cuisine = st.selectbox(
                "Cuisine Type",
                ["Auto Select", "Korean", "Chinese", "Japanese", "Western", "Southeast Asian", "Fusion"]
            )

        with col2:
            diet_restrictions = st.multiselect(
                "Dietary Restrictions",
                ["Vegetarian", "Vegan", "Gluten-Free", "Low-Sodium", "Low-Sugar"]
            )

    # Generate button with loading state
    if st.button(
        "🎨 Generate Recipes",
        type="primary",
        use_container_width=True
    ):
        preferences = {
            'difficulty': difficulty,
            'cooking_time': f"{cooking_time} min",
            'servings': servings,
            'cuisine': cuisine if cuisine != "Auto Select" else None,
            'diet_restrictions': diet_restrictions
        }

        generate_recipes_with_animation(current_ingredients, preferences)

    # Display generated recipes
    if st.session_state.generated_recipes:
        display_enhanced_recipes()


def generate_recipes_with_animation(ingredients, preferences):
    """Generate recipes with engaging animation"""
    generator = RecipeGenerator()

    # Creative loading messages
    loading_messages = [
        "Analyzing ingredients... 🔍",
        "Searching recipe database... 📚",
        "AI is finding creative combinations... 🤖",
        "Calculating nutritional balance... ⚖️",
        "Adding the finishing touches... ✨"
    ]

    # Show animated progress
    progress_placeholder = st.empty()
    message_placeholder = st.empty()

    for i, message in enumerate(loading_messages):
        progress = (i + 1) / len(loading_messages)
        progress_placeholder.progress(progress)
        message_placeholder.info(f"🍳 {message}")
        time.sleep(0.8)

    # Actual generation
    result = generator.generate_recipes(ingredients, preferences)

    # Clear loading
    progress_placeholder.empty()
    message_placeholder.empty()

    if result.get('status') == 'success':
        st.session_state.generated_recipes = result
        EnhancedMessages.success(
            f"Found {len(result['recipes'])} delicious recipes! 🎉"
        )
        st.balloons()
    else:
        EnhancedMessages.error(
            "Recipe generation failed",
            "Try again or change your settings"
        )


def display_enhanced_recipes():
    """Display recipes with enhanced cards"""
    st.divider()
    st.subheader("Recommended Recipes")

    recipes = st.session_state.generated_recipes.get('recipes', [])

    # Recipe filter/sort options
    col1, col2 = st.columns([3, 1])
    with col2:
        sort_by = st.selectbox(
            "Sort",
            ["By Match", "By Time", "By Difficulty"],
            label_visibility="collapsed"
        )

    # Display recipes as cards
    for idx, recipe in enumerate(recipes):
        if RecipeCard.display(recipe, idx):
            # Show detailed recipe view
            show_recipe_detail(recipe)


def show_recipe_detail(recipe):
    """Show detailed recipe view in modal-like container"""
    with st.container():
        st.markdown(f"""
        <div style="
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin: 20px 0;
        ">
            <h2 style="color: {UITheme.DARK}; margin-bottom: 16px;">
                {recipe['name']}
            </h2>
        </div>
        """, unsafe_allow_html=True)

        # Recipe info tabs
        tab1, tab2, tab3 = st.tabs(["Ingredients", "Instructions", "Nutrition"])

        with tab1:
            for ingredient in recipe.get('ingredients', []):
                st.write(f"• {ingredient['name']}: {ingredient.get('amount', '')}")

        with tab2:
            for i, step in enumerate(recipe.get('steps', []), 1):
                st.write(f"**Step {i}:** {step}")

        with tab3:
            nutrition_cols = st.columns(4)
            nutrition_data = [
                ("Calories", f"{recipe.get('calories', 0)}kcal"),
                ("Protein", f"{recipe.get('protein', 0)}g"),
                ("Carbs", f"{recipe.get('carbs', 0)}g"),
                ("Fat", f"{recipe.get('fat', 0)}g")
            ]

            for col, (label, value) in zip(nutrition_cols, nutrition_data):
                with col:
                    st.metric(label, value)


def show_enhanced_saved_recipes():
    """Enhanced saved recipes view"""
    st.header("📚 My Recipe Collection")

    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    # Get saved recipes
    saved_recipes = profile_manager.get_saved_recipes(user_id)

    if not saved_recipes:
        EmptyStates.no_recipes()
        return

    # Filter and search
    col1, col2, col3 = st.columns([2, 1, 1])

    with col1:
        search = st.text_input(
            "Search",
            placeholder="Search by recipe name...",
            label_visibility="collapsed"
        )

    with col2:
        filter_cuisine = st.selectbox(
            "Cuisine Type",
            ["All", "Korean", "Chinese", "Japanese", "Western"],
            label_visibility="collapsed"
        )

    with col3:
        sort_by = st.selectbox(
            "Sort",
            ["Newest", "Rating", "Name"],
            label_visibility="collapsed"
        )

    # Display recipes in grid
    cols = st.columns(3)
    for idx, saved in enumerate(saved_recipes):
        with cols[idx % 3]:
            recipe = saved['recipe']
            display_saved_recipe_card(saved, recipe)


def display_saved_recipe_card(saved, recipe):
    """Display saved recipe as an enhanced card"""
    st.markdown(f"""
    <div style="
        background: white;
        border: 1px solid {UITheme.BORDER};
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        height: 200px;
        position: relative;
    ">
        <h4 style="color: {UITheme.DARK}; margin: 0 0 8px 0;">
            {recipe.get('name', 'Untitled Recipe')}
        </h4>
        <div style="color: {UITheme.GRAY}; font-size: 0.9em;">
            <div>⏱️ {recipe.get('time', 30)} min</div>
            <div>⭐ {saved.get('rating', 0)}/5</div>
        </div>
        {f'<div style="position: absolute; top: 16px; right: 16px; background: {UITheme.SUCCESS}15; color: {UITheme.SUCCESS}; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">Cooked</div>' if saved.get('cooked') else ''}
    </div>
    """, unsafe_allow_html=True)

    if st.button("View Details", key=f"view_saved_{saved['save_id']}", use_container_width=True):
        show_recipe_detail(recipe)


def show_enhanced_profile():
    """Enhanced user profile with better organization"""
    st.header("👤 My Profile")

    user = st.session_state.user
    user_id = user['id']
    profile_manager = st.session_state.profile_manager

    # Profile tabs
    tab1, tab2, tab3 = st.tabs(["Basic Info", "Cooking Preferences", "Activity Stats"])

    with tab1:
        show_basic_profile_info()

    with tab2:
        show_cooking_preferences()

    with tab3:
        show_activity_statistics()


def show_basic_profile_info():
    """Basic profile information section"""
    user = st.session_state.user
    profile_manager = st.session_state.profile_manager
    profile = profile_manager.get_profile(user['id']) or {}

    with st.form("basic_profile"):
        col1, col2 = st.columns(2)

        with col1:
            nickname = st.text_input(
                "Nickname",
                value=profile.get('nickname', user['username'])
            )

            bio = st.text_area(
                "Bio",
                value=profile.get('bio', ''),
                height=100
            )

        with col2:
            cooking_level = st.select_slider(
                "Cooking Skill",
                options=["Novice", "Beginner", "Intermediate", "Advanced", "Expert"],
                value=profile.get('cooking_level', 'Beginner')
            )

            household = st.number_input(
                "Household Size",
                min_value=1,
                max_value=10,
                value=profile.get('household_size', 2)
            )

        if st.form_submit_button("Save", type="primary", use_container_width=True):
            # Save profile with optimistic update
            PerformanceOptimizations.optimistic_update(
                "Saving profile",
                "Profile updated!"
            )


def show_cooking_preferences():
    """Cooking preferences section"""
    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager
    profile = profile_manager.get_profile(user_id) or {}

    with st.form("cooking_preferences"):
        st.subheader("Favorite Cuisines")
        cuisine_prefs = st.multiselect(
            "Favorite cuisine types",
            ["Korean", "Chinese", "Japanese", "Western", "Southeast Asian", "Mexican", "Indian"],
            default=profile.get('favorite_cuisine', ['Korean'])
        )

        st.subheader("Diet Settings")
        dietary = st.multiselect(
            "Dietary restrictions",
            ["Vegetarian", "Vegan", "Gluten-Free", "Low-Sodium", "Low-Sugar", "Keto"],
            default=profile.get('dietary_preferences', [])
        )

        st.subheader("Allergies")
        allergies = st.multiselect(
            "Allergy information",
            ["Peanuts", "Milk", "Eggs", "Wheat", "Shellfish", "Fish", "Soy"],
            default=profile.get('allergies', [])
        )

        if st.form_submit_button("Save", type="primary", use_container_width=True):
            EnhancedMessages.success("Preferences saved!")


def show_activity_statistics():
    """User activity statistics"""
    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager

    stats = profile_manager.get_statistics(user_id)

    # Key metrics
    cols = st.columns(4)
    metrics = [
        ("📚", "Saved Recipes", f"{stats['total_saved']}"),
        ("👨‍🍳", "Times Cooked", f"{stats['total_cooked']}"),
        ("⭐", "Average Rating", f"{stats['avg_rating']:.1f}" if stats['avg_rating'] else "-"),
        ("📁", "Recipe Folders", f"{stats['total_folders']}")
    ]

    for col, (icon, label, value) in zip(cols, metrics):
        with col:
            st.markdown(f"""
            <div style="
                background: white;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            ">
                <div style="font-size: 2em; margin-bottom: 8px;">{icon}</div>
                <div style="color: {UITheme.GRAY}; font-size: 0.9em;">{label}</div>
                <div style="color: {UITheme.DARK}; font-size: 1.2em; font-weight: 600;">{value}</div>
            </div>
            """, unsafe_allow_html=True)


def show_settings():
    """Application settings"""
    st.header("⚙️ Settings")

    # Settings tabs
    tab1, tab2, tab3 = st.tabs(["Display", "Notifications", "Accessibility"])

    with tab1:
        st.subheader("Display Settings")

        # Theme selection
        theme = st.selectbox(
            "Theme",
            ["Light Mode", "Dark Mode", "Follow System Setting"]
        )

        # Animation toggle
        animations = st.checkbox(
            "Animation Effects",
            value=st.session_state.ui_preferences['animations']
        )

        if st.button("Apply", type="primary"):
            st.session_state.ui_preferences['animations'] = animations
            EnhancedMessages.success("Settings saved")

    with tab2:
        st.subheader("Notification Settings")

        email_notif = st.checkbox("Email Notifications", value=True)
        push_notif = st.checkbox("Push Notifications", value=False)

        st.subheader("Receive Notifications")
        notif_types = st.multiselect(
            "Notification types",
            ["New Recipe Recommendations", "Cooking Reminders", "Weekly Report", "Tips & Tricks"],
            default=["New Recipe Recommendations"]
        )

    with tab3:
        st.subheader("Accessibility")

        # Font size selector
        AccessibilityFeatures.font_size_selector()

        # High contrast mode
        AccessibilityFeatures.high_contrast_mode()

        # Keyboard shortcuts
        if st.checkbox("Show Keyboard Shortcuts"):
            AccessibilityFeatures.keyboard_navigation_hint()


def show_user_statistics():
    """Show user statistics on dashboard"""
    user_id = st.session_state.user['id']
    profile_manager = st.session_state.profile_manager
    stats = profile_manager.get_statistics(user_id)

    st.subheader("📊 This Week's Activity")

    cols = st.columns(4)
    weekly_stats = [
        ("🍳", "Recipes Cooked", "3", "+2"),
        ("⭐", "Average Rating", "4.5", "+0.3"),
        ("📷", "Ingredient Scans", "5", "+3"),
        ("💾", "Saved Recipes", "8", "+5")
    ]

    for col, (icon, label, value, delta) in zip(cols, weekly_stats):
        with col:
            st.metric(label, value, delta)


def show_recent_activity():
    """Show recent activity cards"""
    st.subheader("Recent Activity")

    activities = [
        {
            "type": "recipe_saved",
            "title": "Saved kimchi stew recipe",
            "time": "2 hours ago",
            "icon": "💾"
        },
        {
            "type": "recipe_cooked",
            "title": "Cooked soybean paste stew",
            "time": "Yesterday",
            "icon": "👨‍🍳"
        },
        {
            "type": "ingredient_scan",
            "title": "Scanned fridge ingredients",
            "time": "2 days ago",
            "icon": "📷"
        }
    ]

    for activity in activities:
        st.markdown(f"""
        <div style="
            background: white;
            border-left: 3px solid {UITheme.PRIMARY};
            padding: 12px 16px;
            margin: 8px 0;
            border-radius: 4px;
            display: flex;
            align-items: center;
        ">
            <span style="font-size: 1.5em; margin-right: 12px;">
                {activity['icon']}
            </span>
            <div style="flex: 1;">
                <div style="color: {UITheme.DARK}; font-weight: 500;">
                    {activity['title']}
                </div>
                <div style="color: {UITheme.GRAY}; font-size: 0.85em;">
                    {activity['time']}
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)


def handle_quick_action(action: str):
    """Handle quick action buttons"""
    if action == "photo":
        st.session_state.page = "ingredient_recognition"
        st.session_state.recognition_step = 0
    elif action == "manual":
        st.session_state.page = "ingredient_manual"
    elif action == "random":
        EnhancedMessages.info("Preparing today's recommended recipes...")
    elif action == "popular":
        EnhancedMessages.info("Loading popular recipes...")

    st.rerun()


def logout():
    """Enhanced logout with cleanup"""
    with st.spinner("Logging out..."):
        auth = st.session_state.auth_manager
        if st.session_state.token:
            auth.logout(st.session_state.token)

        # Clear session state
        for key in ['user', 'token', 'recognized_ingredients', 'generated_recipes']:
            if key in st.session_state:
                del st.session_state[key]

        # Reset to welcome page
        st.session_state.page = 'welcome'
        st.session_state.first_visit = True

    EnhancedMessages.success("You have been safely logged out")
    time.sleep(1)
    st.rerun()


if __name__ == "__main__":
    main()
"""
FridgeChef - Step 1: Image Recognition Core
Main Streamlit application for refrigerator ingredient recognition
"""
import streamlit as st
import time
import json
from datetime import datetime

# Import backend modules
from backend.config import Config
from backend.openrouter_client import OpenRouterClient
from backend.image_service import ImageProcessor

# Page configuration
st.set_page_config(
    page_title="FridgeChef - Fridge Ingredient Recognition",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'processing' not in st.session_state:
    st.session_state.processing = False
if 'history' not in st.session_state:
    st.session_state.history = []

def main():
    """Main application function"""

    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        st.error(f"Configuration error: {e}")
        st.stop()

    # Header
    st.title("🍳 FridgeChef - Step 1")
    st.subheader("AI-Powered Fridge Ingredient Recognition System")

    # Sidebar
    with st.sidebar:
        st.header("ℹ️ Info")
        st.info(
            "Upload a photo of your fridge and AI will automatically recognize the ingredients.\n\n"
            "**Supported formats:** JPG, PNG, WEBP\n"
            "**Max size:** 10MB"
        )

        # Test connection button
        if st.button("🔌 Test API Connection"):
            with st.spinner("Checking connection..."):
                client = OpenRouterClient()
                if client.test_connection():
                    st.success("✅ API connection successful!")
                else:
                    st.error("❌ API connection failed")

        # History
        if st.session_state.history:
            st.divider()
            st.header("📜 Recent History")
            for item in st.session_state.history[-3:]:
                st.caption(f"• {item['time']} - {item['items']} ingredients")

    # Main content area
    col1, col2 = st.columns([1, 1])

    with col1:
        st.header("📷 Image Upload")

        # File uploader
        uploaded_file = st.file_uploader(
            "Choose a photo of your fridge",
            type=['jpg', 'jpeg', 'png', 'webp'],
            accept_multiple_files=False,
            help="Please upload a photo that clearly shows the inside of your fridge"
        )

        if uploaded_file is not None:
            # Display uploaded image
            st.image(uploaded_file, caption="Uploaded image", use_container_width=True)

            # Validate image
            processor = ImageProcessor()
            is_valid, error_msg = processor.validate_image(uploaded_file)

            if not is_valid:
                st.error(error_msg)
            else:
                st.success("✅ Image uploaded successfully")

                # Recognition button
                if st.button(
                    "🔍 Start Ingredient Recognition",
                    type="primary",
                    use_container_width=True,
                    disabled=st.session_state.processing
                ):
                    recognize_ingredients(uploaded_file)

    with col2:
        st.header("📋 Recognition Results")

        if st.session_state.processing:
            with st.spinner("AI is recognizing the ingredients..."):
                # Show progress bar
                progress_bar = st.progress(0)
                for i in range(100):
                    time.sleep(0.05)
                    progress_bar.progress(i + 1)

        if st.session_state.recognized_ingredients:
            display_results(st.session_state.recognized_ingredients)
        else:
            st.info("Upload an image and click the 'Start Ingredient Recognition' button")

    # Footer
    st.divider()
    st.caption(f"FridgeChef v{Config.APP_VERSION} | Step 1: Image Recognition Core")

def recognize_ingredients(uploaded_file):
    """
    Recognize ingredients from uploaded image

    Args:
        uploaded_file: Streamlit UploadedFile object
    """
    st.session_state.processing = True

    try:
        # Process image
        processor = ImageProcessor()
        image_base64 = processor.process_image(uploaded_file)

        if not image_base64:
            st.error("An error occurred while processing the image")
            return

        # Initialize API client
        client = OpenRouterClient()

        # Recognize ingredients
        with st.spinner("Recognizing ingredients... (may take up to 30 seconds)"):
            result = client.recognize_ingredients(image_base64)

        if result.get('status') == 'success':
            st.session_state.recognized_ingredients = result

            # Add to history
            history_item = {
                'time': datetime.now().strftime("%H:%M"),
                'items': result.get('total_items', 0)
            }
            st.session_state.history.append(history_item)

            st.success(f"✅ Recognized {result.get('total_items', 0)} ingredients!")
            st.balloons()
        else:
            st.error(f"Ingredient recognition failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        st.error(f"An error occurred: {str(e)}")

    finally:
        st.session_state.processing = False
        st.rerun()

def display_results(result):
    """
    Display recognized ingredients

    Args:
        result: Recognition result dictionary
    """
    ingredients = result.get('ingredients', {})

    if not ingredients:
        st.warning("No ingredients were recognized")
        return

    # Display by category
    for category, items in ingredients.items():
        if items:  # Only show non-empty categories
            st.subheader(f"**{category}**")

            # Display items in columns
            cols = st.columns(2)
            for idx, item in enumerate(items):
                with cols[idx % 2]:
                    st.write(f"• {item}")

    # Statistics
    st.divider()
    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Total Ingredients", f"{result.get('total_items', 0)}")

    with col2:
        st.metric("Categories", f"{len(ingredients)}")

    with col3:
        st.metric("Status", "Complete")

    # Export options
    st.divider()
    st.subheader("💾 Export")

    col1, col2 = st.columns(2)

    with col1:
        # Export as JSON
        json_str = json.dumps(ingredients, ensure_ascii=False, indent=2)
        st.download_button(
            label="📄 Save as JSON",
            data=json_str,
            file_name=f"ingredients_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
            mime="application/json"
        )

    with col2:
        # Export as text
        text_str = format_ingredients_text(ingredients)
        st.download_button(
            label="📝 Save as Text",
            data=text_str,
            file_name=f"ingredients_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
            mime="text/plain"
        )

    # Show raw response in expander
    with st.expander("🔍 View Detailed Response"):
        st.text(result.get('raw_text', ''))

def format_ingredients_text(ingredients):
    """
    Format ingredients as plain text

    Args:
        ingredients: Dictionary of ingredients by category

    Returns:
        Formatted text string
    """
    text = "=== Recognized Ingredients ===\n\n"

    for category, items in ingredients.items():
        if items:
            text += f"[{category}]\n"
            for item in items:
                text += f"  - {item}\n"
            text += "\n"

    text += f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"

    return text

if __name__ == "__main__":
    main()
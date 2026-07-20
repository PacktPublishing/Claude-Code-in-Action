# PRD Step 1: Core Image Recognition Feature
**Phase 1 - Building the Fridge Ingredient Recognition System**

## 1. Project Overview

### 1.1 Goal
Implement the core feature of a web application where users upload a fridge photo and AI automatically recognizes the ingredients

### 1.2 Scope
- Image upload interface
- Integration with the Llama-4-maverick model via the OpenRouter API
- Ingredient recognition and result display
- Basic web UI

### 1.3 Development Period
5 days (1 week)

### 1.4 Success Metrics
- Image upload success rate of 95% or higher
- Ingredient recognition accuracy of 70% or higher
- Response time within 15 seconds

## 2. Tech Stack

```yaml
Backend:
  - Python 3.9+
  - FastAPI (backend API)
  - Pillow (image processing)
  - python-dotenv (environment variables)

Frontend:
  - Streamlit (web interface)
  - HTML/CSS (styling)

AI/ML:
  - OpenRouter API
  - meta-llama/llama-4-maverick:free

Database:
  - JSON files (temporary storage)
```

## 3. System Architecture

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Streamlit UI  │
└────────┬────────┘
         │
┌────────▼────────┐
│  Image Service  │
└────────┬────────┘
         │
┌────────▼────────┐
│ OpenRouter API  │
│  (Llama-4)      │
└─────────────────┘
```

## 4. Project Structure

```
Study-04/
├── app.py                    # Streamlit main app
├── backend/
│   ├── __init__.py
│   ├── config.py            # Configuration management
│   ├── image_service.py     # Image processing
│   └── openrouter_client.py # API client
├── frontend/
│   ├── components.py        # UI components
│   └── styles.css          # Stylesheet
├── data/
│   └── temp/               # Temporary image storage
├── tests/
│   └── test_images/        # Test images
├── .env                    # API key
├── requirements.txt        # Dependencies
└── README.md              # Documentation
```

## 5. Core Feature Details

### 5.1 Image Upload

#### 5.1.1 UI Component
```python
# Streamlit upload widget
uploaded_file = st.file_uploader(
    "Upload a photo of your fridge",
    type=['jpg', 'jpeg', 'png', 'webp'],
    accept_multiple_files=False
)
```

#### 5.1.2 Image Preprocessing
```python
class ImageProcessor:
    def process_image(self, file):
        # 1. Validate the image
        # 2. Resize (max 1024x1024)
        # 3. Base64 encoding
        # 4. Extract metadata
```

### 5.2 Ingredient Recognition

#### 5.2.1 API Call
```python
class IngredientRecognizer:
    def __init__(self):
        self.client = OpenRouterClient()
        self.model = "meta-llama/llama-4-maverick:free"

    def recognize(self, image_base64):
        prompt = self._create_prompt()
        response = self.client.chat(
            model=self.model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
                ]
            }]
        )
        return self._parse_response(response)
```

#### 5.2.2 Prompt Engineering
```python
RECOGNITION_PROMPT = """
You are analyzing a refrigerator image. Please identify all visible food ingredients.

Instructions:
1. List each ingredient you can clearly see
2. Group similar items together
3. Include approximate quantities when visible
4. Categorize by type (vegetables, fruits, meat, dairy, condiments, etc.)

Output Format:
Category: [Category Name]
- [Ingredient]: [Quantity if visible]

Be specific and accurate. Only list items you're confident about.
"""
```

### 5.3 Result Display

#### 5.3.1 UI Layout
```python
# Result display layout
col1, col2 = st.columns([1, 1])

with col1:
    st.image(uploaded_image, caption="Uploaded image")

with col2:
    st.subheader("Recognized Ingredients")
    for category, items in ingredients.items():
        st.write(f"**{category}**")
        for item in items:
            st.write(f"• {item}")
```

#### 5.3.2 Data Structure
```json
{
  "timestamp": "2025-01-14T10:30:00",
  "image_id": "img_001",
  "ingredients": {
    "vegetables": ["2 onions", "1 carrot", "3 potatoes"],
    "meat": ["300g pork", "200g chicken breast"],
    "dairy": ["1L milk", "100g cheese"],
    "condiments": ["soy sauce", "gochujang", "sesame oil"]
  },
  "confidence": 0.85
}
```

## 6. User Interface

### 6.1 Main Screen Layout

```
┌─────────────────────────────────────┐
│       🍳 FridgeChef - Step 1        │
├─────────────────────────────────────┤
│                                     │
│    📷 Upload Fridge Photo           │
│   ┌─────────────────────┐          │
│   │                     │          │
│   │   [Drop Image Here] │          │
│   │         or          │          │
│   │   [Browse Files]    │          │
│   │                     │          │
│   └─────────────────────┘          │
│                                     │
│   [Start Recognition] button        │
│                                     │
├─────────────────────────────────────┤
│   📋 Recognition Results            │
│   Loading... / Results              │
└─────────────────────────────────────┘
```

### 6.2 State Management

```python
# Streamlit session state
if 'recognized_ingredients' not in st.session_state:
    st.session_state.recognized_ingredients = None
if 'processing' not in st.session_state:
    st.session_state.processing = False
```

## 7. Error Handling

### 7.1 Error Types

| Error Code | Description | User Message |
|----------|------|--------------|
| ERR_IMG_001 | Invalid file format | "Only JPG, PNG, and WEBP formats are supported" |
| ERR_IMG_002 | File size exceeded | "Only files up to 10MB can be uploaded" |
| ERR_API_001 | API connection failure | "Failed to connect to the server. Please try again later" |
| ERR_API_002 | Response timeout | "Processing timed out" |

### 7.2 Error Handling Code

```python
try:
    result = recognize_ingredients(image)
except APIError as e:
    st.error(f"An error occurred: {e.user_message}")
    logging.error(f"API Error: {e}")
except Exception as e:
    st.error("An unexpected error occurred")
    logging.exception("Unexpected error")
```

## 8. Test Plan

### 8.1 Test Cases

| ID | Test Item | Input | Expected Result |
|----|------------|------|-----------|
| T1-01 | Normal image upload | clear_fridge.jpg | 5 or more ingredients recognized |
| T1-02 | Empty fridge | empty_fridge.jpg | "No ingredients found" message |
| T1-03 | Blurry image | blurry.jpg | Some ingredients recognized |
| T1-04 | Large image | large_image.jpg | Processed after automatic resizing |
| T1-05 | Invalid format | document.pdf | Error message displayed |

### 8.2 Performance Testing

- Handle 5 concurrent users
- Measure average response time
- Monitor memory usage

## 9. Security and Privacy

### 9.1 Security Measures
- Manage API keys via environment variables
- Validate uploaded files
- Prevent SQL injection
- Prevent XSS attacks

### 9.2 Privacy Protection
- Uploaded images stored temporarily and automatically deleted
- User data encryption
- No personal information in logs

## 10. Development Schedule

### Day 1: Environment Setup
- [x] Create project structure
- [x] Install dependencies
- [x] Test OpenRouter API integration

### Day 2-3: Core Features
- [ ] Image upload UI
- [ ] Image processing service
- [ ] Llama-4 integration

### Day 4: Integration and Testing
- [ ] Integrate the full flow
- [ ] Error handling
- [ ] Unit tests

### Day 5: Optimization and Deployment
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Documentation

## 11. Risks and Mitigations

### 11.1 Technical Risks

| Risk | Impact | Mitigation |
|--------|--------|----------|
| API response delays | High | Timeout settings, caching |
| Inaccurate image recognition | Medium | Prompt optimization |
| Server overload | Medium | Rate limiting |

### 11.2 Business Risks
- Exceeding free API limits → usage monitoring
- User growth → scalable architecture

## 12. Completion Criteria

### 12.1 Required Features
- ✅ Image upload works
- ✅ Ingredient recognition works
- ✅ Results displayed
- ✅ Error handling

### 12.2 Quality Criteria
- ✅ Response time within 15 seconds
- ✅ Recognition accuracy of 70% or higher
- ✅ Test coverage of 60% or higher

## 13. Preparing for the Next Step

Features to be added in Step 2:
- Recipe generation using the DeepSeek model
- Ingredient editing
- Recipe filtering
- Advanced UI improvements

---

**Document Info**
- Created: 2025-01-14
- Version: 1.0
- Author: System
- Review scheduled: upon completion of Step 1

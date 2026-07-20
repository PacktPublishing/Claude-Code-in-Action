# Step 1 Test Guide

## 🚀 How to Run the Application

### Method 1: Run the batch file (Windows)
```bash
run_step1.bat
```

### Method 2: Run the command directly
```bash
streamlit run app.py
```

When the application starts, your browser opens automatically.
If it does not open automatically, go to the following address:
**http://localhost:8501**

## 📋 Test Scenarios

### Stage 1: Basic Functionality Tests

#### 1.1 Verify the API connection
1. Click the "🔌 Test API Connection" button in the left sidebar
2. Confirm the "✅ API connection successful!" message

#### 1.2 Sample image test
1. Use the provided sample image:
   - `tests/test_images/sample_fridge.jpg`
2. Click the "Choose a fridge photo" button
3. Select and upload the sample image
4. Confirm the image is displayed on screen

### Stage 2: Ingredient Recognition Tests

#### 2.1 Run ingredient recognition
1. After uploading the image, click the "🔍 Start Ingredient Recognition" button
2. Confirm the progress indicator appears while processing
3. Wait about 10-15 seconds

#### 2.2 Check the results
1. The list of recognized ingredients appears in the right panel
2. Confirm the ingredients are grouped by category:
   - Vegetables
   - Meat
   - Dairy
   - Condiments
   - Others

### Stage 3: Additional Feature Tests

#### 3.1 Export results
1. After recognition completes, check the "💾 Export" section at the bottom
2. Click the "📄 Save as JSON" button → downloads a JSON file
3. Click the "📝 Save as Text" button → downloads a TXT file

#### 3.2 View detailed response
1. Click the "🔍 View Detailed Response" expander panel
2. Check the raw response text from the AI model

#### 3.3 Check history
1. Check the "📜 Recent History" section at the bottom of the left sidebar
2. It shows the time and ingredient count of previous recognition runs

## 🖼️ Preparing Test Images

### Provided sample image
- **Location**: `tests/test_images/sample_fridge.jpg`
- **Contents**: A fridge image containing 18 different food ingredients

### Testing with a real fridge photo
1. Take a photo of the inside of your fridge with a smartphone
2. Make sure the lighting is bright and the ingredients are clearly visible
3. JPG, PNG, and WEBP formats are supported
4. Maximum size 10MB

## ✅ Checklist

Verify the following items during testing:

- [ ] Does the application start correctly?
- [ ] Does image upload work?
- [ ] Is ingredient recognition performed?
- [ ] Are results displayed by category?
- [ ] Are statistics displayed?
- [ ] Does the export feature work?
- [ ] Are appropriate messages shown when errors occur?

## 🔍 Expected Results

### Ingredients recognizable in the sample image:
- **Vegetables**: Tomatoes, Lettuce, Onions, Carrots, Broccoli, Cucumber
- **Meat**: Meat, Fish, Chicken
- **Dairy**: Milk, Cheese, Yogurt, Butter
- **Fruits**: Apples, Oranges
- **Others**: Eggs, Kimchi, Juice

## ⚠️ Troubleshooting

### If the application does not start
```bash
# Reinstall packages
py -m pip install streamlit python-dotenv requests Pillow pandas
```

### API connection failure
1. Confirm `OPENROUTER_API_KEY` is set in the `.env` file
2. Check your internet connection

### Image recognition failure
1. Check the image format (JPG, PNG, WEBP)
2. Check the file size (10MB or less)
3. Verify the API key is valid

## 📊 Performance Measurements

- **Image upload**: Instant
- **Ingredient recognition**: 10-15 seconds
- **Result display**: Instant
- **Export**: Instant

## 🎯 Test Completion Criteria

Step 1 testing is complete when all of the following work correctly:
1. ✅ Image upload and display
2. ✅ AI ingredient recognition
3. ✅ Results displayed by category
4. ✅ Data export
5. ✅ Error handling

---

Ready to test!
Run `run_step1.bat` or start with the `streamlit run app.py` command.

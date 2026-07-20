# 🧪 Step 2 Live Test Guide

## 🚀 Current Running Status

### ✅ Application Running
- **Step 2 app**: http://localhost:8502 (running)
- **Status**: Working normally

## 📋 Step-by-Step Test Scenarios

### 🔥 Quick Test (5 minutes)

#### Step 1: Verify access
1. Open a web browser
2. Go to **http://localhost:8502**
3. Confirm the FridgeChef Step 2 page loads

#### Step 2: Recognize ingredients with the sample image
1. Click the **📷 Ingredient Recognition** tab
2. Click "Choose a fridge photo"
3. Select the sample image at the following path:
   ```
   C:\Users\taehj\OneDrive\Desktop\VibeCoding\Study-04\tests\test_images\sample_fridge.jpg
   ```
4. Click "🔍 Start Ingredient Recognition"
5. Wait 10-15 seconds
6. Check the recognized ingredients on the right

#### Step 3: Edit ingredients
1. Click the **✏️ Edit Ingredients** tab
2. Check the list of recognized ingredients
3. Test actions:
   - Click an ingredient to edit it
   - Add a new ingredient with "➕ Add Ingredient" (e.g., "Kimchi")
   - Delete an ingredient with the ❌ button

#### Step 4: Generate recipes ⭐
1. Click the **🍽️ Generate Recipes** tab
2. Adjust the settings:
   - Difficulty: Easy
   - Cooking time: 30 minutes
   - Servings: 4
   - Cuisine: Korean
3. Click "🍳 Generate Recipes"
4. Wait 10-15 seconds
5. Confirm 3 recipes are generated

#### Step 5: Check the results
1. Review each generated recipe:
   - Recipe name
   - Ingredient list
   - Cooking steps
   - Cooking time
2. Click "📄 Export JSON" to download

### 📊 Detailed Test Scenarios

#### A. Ingredient autocomplete test
1. In the **✏️ Edit Ingredients** tab
2. Type "Car" in the ingredient name field
3. Confirm the "Carrot" autocomplete suggestion appears
4. Click the suggested item

#### B. Filtering test
1. In the **📚 Recipe List** tab
2. Apply filters:
   - Cuisine: Korean
   - Difficulty: Easy
   - Maximum time: 30 minutes
3. Check the filtered results

#### C. Database persistence check
1. After generating recipes
2. Check the **📚 Recipe List** tab
3. Confirm the generated recipes appear in the list

### 🎯 Feature Checklist

#### Ingredient Recognition (Tab 1)
- [ ] Image upload succeeds
- [ ] Ingredient recognition runs
- [ ] Classification by category confirmed
- [ ] Total ingredient count displayed

#### Edit Ingredients (Tab 2)
- [ ] Ingredients can be edited
- [ ] Adding an ingredient succeeds
- [ ] Deleting an ingredient succeeds
- [ ] Autocomplete works
- [ ] Statistics update

#### Generate Recipes (Tab 3)
- [ ] Settings can be adjusted
- [ ] Recipe generation succeeds
- [ ] 3 recipes displayed
- [ ] Recipe details confirmed
- [ ] JSON export works

#### Recipe List (Tab 4)
- [ ] Saved recipes displayed
- [ ] Filtering works
- [ ] Sorting confirmed

### 💡 Testing Tips

#### Testing with a real fridge photo
1. Take a photo of the inside of your fridge with a smartphone
2. Transfer the photo to your computer
3. Upload it in the Step 2 app
4. Check the real-world recognition rate

#### Generating recipes with various settings
- **Easy meal**: Difficulty "Easy", time 20 minutes
- **Advanced dish**: Difficulty "Hard", time 60 minutes
- **Large batch**: 10 servings

### 🔍 Expected Results

#### Sample image recognition results
```
Vegetables: Tomatoes, Lettuce, Onions, Carrots, Broccoli, Cucumber
Meat: Meat, Fish, Chicken
Dairy: Milk, Cheese, Yogurt, Butter
Fruits: Apples, Oranges
Others: Eggs, Kimchi, Juice
```

#### Example generated recipes
1. **Spicy Stir-Fried Pork** (Difficulty: Medium, 25 minutes)
2. **Vegetable Stir-Fry** (Difficulty: Easy, 15 minutes)
3. **Kimchi Stew** (Difficulty: Easy, 30 minutes)

### ⚠️ Troubleshooting

#### When recipe generation fails
1. Confirm there are at least 3 ingredients
2. Test the API connection (sidebar)
3. Add ingredients in the Edit Ingredients tab

#### When the page is slow
1. Refresh the browser (F5)
2. Clear the cache
3. Try a different browser

### 📈 Performance Measurement Points

| Task | Expected Time | Check |
|------|----------|------|
| Image upload | Instant | ⏱️ |
| Ingredient recognition | 10-15 seconds | ⏱️ |
| Ingredient editing | Instant | ⏱️ |
| Recipe generation | 10-15 seconds | ⏱️ |
| Data saving | Under 1 second | ⏱️ |

### 🎉 Test Completion Criteria

When all checklist items are complete:
1. Step 2 core features verified
2. DeepSeek model integration confirmed
3. Database operation confirmed
4. UI/UX working normally

---

## 📌 Quick Reference

### Access URL
```
http://localhost:8502
```

### Sample image path
```
C:\Users\taehj\OneDrive\Desktop\VibeCoding\Study-04\tests\test_images\sample_fridge.jpg
```

### Stop command
```bash
# Ctrl+C or
taskkill /F /IM streamlit.exe
```

**Start testing! Open http://localhost:8502 in your browser**

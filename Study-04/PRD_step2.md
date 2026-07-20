# PRD Step 2: Recipe Generation System
**Phase 2 - AI-Based Recipe Recommendation and Generation**

## 1. Project Overview

### 1.1 Goal
Build a system that uses the DeepSeek model to generate and recommend personalized recipes based on the ingredients recognized in Step 1

### 1.2 Scope
- DeepSeek model integration
- Recipe generation algorithm
- Ingredient editing
- Recipe detail view
- Filtering and search

### 1.3 Development Period
7 days (1.5 weeks)

### 1.4 Success Metrics
- Recipe generation success rate of 95% or higher
- Recipe relevance score of 80% or higher
- User satisfaction of 4.0/5.0 or higher

## 2. Tech Stack (Additions)

```yaml
Backend (additions):
  - deepseek/deepseek-chat-v3.1:free
  - SQLite (recipe storage)
  - Pandas (data processing)

Frontend (additions):
  - Streamlit components
  - Plotly (visualization)
  - Bootstrap CSS

Features:
  - Recipe generation engine
  - Ingredient matching algorithm
  - Nutrition information calculation
```

## 3. System Architecture (Extended)

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │
┌────────▼────────┐
│   Streamlit UI  │
└────────┬────────┘
         │
┌────────▼────────────────┐
│   Application Layer      │
├─────────┬───────────────┤
│ Image   │    Recipe     │
│ Service │   Generator   │
└─────────┴───────┬───────┘
                  │
┌─────────────────▼───────┐
│     OpenRouter API      │
├─────────┬───────────────┤
│ Llama-4 │   DeepSeek    │
└─────────┴───────────────┘
```

## 4. Core Feature Details

### 4.1 Recipe Generation Engine

#### 4.1.1 DeepSeek Integration
```python
class RecipeGenerator:
    def __init__(self):
        self.model = "deepseek/deepseek-chat-v3.1:free"
        self.client = OpenRouterClient()

    def generate_recipes(self, ingredients, preferences=None):
        prompt = self._create_recipe_prompt(ingredients, preferences)
        response = self.client.chat(
            model=self.model,
            messages=[{
                "role": "system",
                "content": "You are a professional chef specializing in practical home-cooked dishes."
            }, {
                "role": "user",
                "content": prompt
            }]
        )
        return self._parse_recipes(response)
```

#### 4.1.2 Prompt Template
```python
RECIPE_PROMPT = """
Please recommend 3 practical home-cooked recipes that can be made with the following ingredients.

Ingredients:
{ingredients}

Requirements:
- Difficulty: {difficulty}
- Cooking time: {cooking_time}
- Servings: {servings}

Write each recipe in the following format:

Recipe Name: [dish name]
Difficulty: [Easy/Medium/Hard]
Cooking Time: [minutes]
Servings: [number of servings]

Ingredients:
- [ingredient name]: [amount]

Cooking Instructions:
1. [step-by-step description]
2. ...

Tip: [cooking tip]
Nutrition Info: [calories, protein, carbs, fat]
"""
```

### 4.2 Ingredient Editing

#### 4.2.1 Ingredient Management UI
```python
# Ingredient editing interface
st.subheader("Edit Ingredients")

# Display current ingredients
for idx, ingredient in enumerate(st.session_state.ingredients):
    col1, col2, col3 = st.columns([3, 2, 1])

    with col1:
        # Edit ingredient name
        new_name = st.text_input(f"Ingredient {idx+1}",
                                 value=ingredient['name'],
                                 key=f"ing_{idx}")

    with col2:
        # Edit quantity
        new_qty = st.text_input("Quantity",
                               value=ingredient.get('quantity', ''),
                               key=f"qty_{idx}")

    with col3:
        # Delete button
        if st.button("Delete", key=f"del_{idx}"):
            st.session_state.ingredients.pop(idx)
            st.rerun()

# Add ingredient
if st.button("+ Add Ingredient"):
    st.session_state.ingredients.append({"name": "", "quantity": ""})
```

#### 4.2.2 Ingredient Autocomplete
```python
# Ingredient database
INGREDIENT_DB = {
    "vegetables": ["onion", "carrot", "potato", "radish", "cabbage", ...],
    "meat": ["pork", "beef", "chicken", "duck", ...],
    "seafood": ["mackerel", "salmon", "shrimp", "squid", ...],
    "condiments": ["soy sauce", "gochujang", "doenjang", "sesame oil", ...]
}

def autocomplete_ingredient(partial_name):
    suggestions = []
    for category, items in INGREDIENT_DB.items():
        for item in items:
            if partial_name in item:
                suggestions.append(item)
    return suggestions[:5]
```

### 4.3 Recipe Detail View

#### 4.3.1 Recipe Card UI
```python
def display_recipe_card(recipe):
    with st.container():
        col1, col2 = st.columns([1, 2])

        with col1:
            # Recipe image (placeholder)
            st.image("recipe_placeholder.jpg")

            # Basic info
            st.metric("Difficulty", recipe['difficulty'])
            st.metric("Cooking Time", f"{recipe['time']} min")
            st.metric("Calories", f"{recipe['calories']}kcal")

        with col2:
            st.subheader(recipe['name'])

            # Ingredient list
            with st.expander("View Ingredients"):
                for ing in recipe['ingredients']:
                    st.write(f"• {ing['name']}: {ing['amount']}")

            # Cooking steps
            st.write("**Cooking Instructions:**")
            for i, step in enumerate(recipe['steps'], 1):
                st.write(f"{i}. {step}")

            # Nutrition info
            st.write("**Nutrition Info:**")
            nutrition_df = pd.DataFrame([recipe['nutrition']])
            st.dataframe(nutrition_df)
```

#### 4.3.2 Recipe Data Structure
```json
{
  "id": "recipe_001",
  "name": "Kimchi Stew",
  "difficulty": "Easy",
  "time": 30,
  "servings": 4,
  "calories": 250,
  "ingredients": [
    {"name": "kimchi", "amount": "300g", "available": true},
    {"name": "pork", "amount": "200g", "available": true},
    {"name": "tofu", "amount": "1/2 block", "available": false}
  ],
  "steps": [
    "Cut the pork into bite-sized pieces",
    "Heat sesame oil in a pot and stir-fry the pork",
    "Add the kimchi and stir-fry together",
    "Pour in water and bring to a boil",
    "Add the tofu and green onions to finish"
  ],
  "nutrition": {
    "calories": 250,
    "protein": 18,
    "carbs": 15,
    "fat": 12
  },
  "tips": "Well-fermented kimchi makes it even tastier"
}
```

### 4.4 Filtering and Search

#### 4.4.1 Filter Options
```python
# Sidebar filters
with st.sidebar:
    st.subheader("Recipe Filters")

    # Cuisine type
    cuisine = st.selectbox(
        "Cuisine Type",
        ["All", "Korean", "Chinese", "Western", "Japanese"]
    )

    # Difficulty
    difficulty = st.select_slider(
        "Difficulty",
        options=["Easy", "Medium", "Hard"]
    )

    # Cooking time
    cook_time = st.slider(
        "Max Cooking Time (min)",
        min_value=10,
        max_value=120,
        value=60,
        step=10
    )

    # Calories
    calories = st.slider(
        "Max Calories",
        min_value=100,
        max_value=1000,
        value=500,
        step=50
    )

    # Allergy filter
    allergies = st.multiselect(
        "Ingredients to Exclude (Allergies)",
        ["Peanuts", "Milk", "Eggs", "Wheat", "Shellfish"]
    )
```

#### 4.4.2 Search and Sorting
```python
def search_recipes(query, filters):
    results = []

    # Text search
    if query:
        results = [r for r in all_recipes
                  if query in r['name'] or
                     any(query in ing['name'] for ing in r['ingredients'])]

    # Apply filters
    if filters['cuisine'] != "All":
        results = [r for r in results if r['cuisine'] == filters['cuisine']]

    if filters['difficulty']:
        results = [r for r in results if r['difficulty'] == filters['difficulty']]

    if filters['max_time']:
        results = [r for r in results if r['time'] <= filters['max_time']]

    # Sort
    if filters['sort_by'] == "time":
        results.sort(key=lambda x: x['time'])
    elif filters['sort_by'] == "calories":
        results.sort(key=lambda x: x['calories'])

    return results
```

### 4.5 Recipe Scoring System

#### 4.5.1 Match Score Calculation
```python
def calculate_match_score(recipe, available_ingredients):
    """
    Calculate the match score between a recipe and available ingredients
    """
    total_ingredients = len(recipe['ingredients'])
    matched = 0

    for ing in recipe['ingredients']:
        if ing['name'] in available_ingredients:
            matched += 1

    match_score = (matched / total_ingredients) * 100

    # Bonus points
    if recipe['difficulty'] == "Easy":
        match_score += 5

    if recipe['time'] <= 30:
        match_score += 5

    return min(match_score, 100)
```

## 5. Database Design

### 5.1 SQLite Schema

```sql
-- Recipes table
CREATE TABLE recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    difficulty TEXT,
    cooking_time INTEGER,
    servings INTEGER,
    calories INTEGER,
    cuisine TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingredients table
CREATE TABLE ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT
);

-- Recipe-ingredient relation table
CREATE TABLE recipe_ingredients (
    recipe_id INTEGER,
    ingredient_id INTEGER,
    amount TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- Cooking steps table
CREATE TABLE cooking_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER,
    step_number INTEGER,
    description TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);
```

### 5.2 Data Access Layer

```python
class RecipeDatabase:
    def __init__(self, db_path="recipes.db"):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()

    def save_recipe(self, recipe_data):
        # Recipe save logic
        pass

    def get_recipes(self, filters=None):
        # Recipe retrieval logic
        pass

    def update_recipe(self, recipe_id, updates):
        # Recipe update logic
        pass
```

## 6. UI/UX Improvements

### 6.1 Main Screen Redesign

```
┌──────────────────────────────────────────┐
│         🍳 FridgeChef - Step 2           │
├────────────┬─────────────────────────────┤
│            │                             │
│  Sidebar   │        Main Content         │
│            │                             │
│  [Filters] │  ┌──────┐ ┌──────┐ ┌──────┐│
│  • Cuisine │  │Recipe1│ │Recipe2│ │Recipe3││
│  • Level   │  │  IMG  │ │  IMG  │ │  IMG  ││
│  • Time    │  │ ⭐4.5 │ │ ⭐4.2 │ │ ⭐4.8 ││
│  • Calories│  │ 30min │ │ 45min │ │ 20min ││
│            │  └──────┘ └──────┘ └──────┘│
│  [Edit     │                             │
│  Ingredients] │  [View More Recipes]     │
└────────────┴─────────────────────────────┘
```

### 6.2 Interaction Improvements

```python
# Loading animation
with st.spinner('Generating recipes...'):
    recipes = generate_recipes(ingredients)

# Progress bar
progress_bar = st.progress(0)
for i in range(100):
    progress_bar.progress(i + 1)
    time.sleep(0.01)

# Success message
st.success('Recipes generated successfully!')

# Toast notification
st.toast('Recipe saved', icon='✅')
```

## 7. API Optimization

### 7.1 Caching Strategy

```python
@st.cache_data(ttl=3600)  # 1-hour cache
def get_cached_recipes(ingredients_hash):
    return generate_recipes(ingredients)

# Caching per ingredient combination
def create_ingredients_hash(ingredients):
    sorted_ing = sorted([ing['name'] for ing in ingredients])
    return hashlib.md5(''.join(sorted_ing).encode()).hexdigest()
```

### 7.2 Batch Processing

```python
async def generate_multiple_recipes(ingredient_sets):
    """Generate recipes for multiple ingredient sets concurrently"""
    tasks = []
    for ingredients in ingredient_sets:
        task = asyncio.create_task(
            generate_recipes_async(ingredients)
        )
        tasks.append(task)

    results = await asyncio.gather(*tasks)
    return results
```

## 8. Test Plan

### 8.1 Integration Tests

| ID | Test Item | Scenario | Expected Result |
|----|------------|---------|-----------|
| T2-01 | Recipe generation | Input 5 ingredients | 3 or more recipes |
| T2-02 | Ingredient editing | Add/delete ingredients | Real-time updates |
| T2-03 | Filtering | Korean + within 30 min | Only matching recipes |
| T2-04 | Search | Search "kimchi" | Recipes containing kimchi |
| T2-05 | Caching | Re-request same ingredients | Instant response |

### 8.2 Usability Testing

- A/B testing: layout comparison
- Collect user feedback
- Click heatmap analysis
- Measure session duration

## 9. Performance Targets

### 9.1 Response Time
- Recipe generation: < 10 seconds
- Filtering: < 1 second
- Search: < 0.5 seconds
- Page load: < 3 seconds

### 9.2 Throughput
- Concurrent users: 20
- Requests per hour: 500
- Daily recipe generations: 1000

## 10. Development Schedule

### Day 1-2: DeepSeek Integration
- [ ] Implement API client
- [ ] Write prompt templates
- [ ] Response parsing logic

### Day 3-4: Recipe Generation
- [ ] Implement generation engine
- [ ] Matching algorithm
- [ ] Nutrition information calculation

### Day 5: Ingredient Editing
- [ ] Implement editing UI
- [ ] Autocomplete feature
- [ ] Build ingredient DB

### Day 6: Filtering and Search
- [ ] Filter UI
- [ ] Search logic
- [ ] Sorting

### Day 7: Integration and Optimization
- [ ] Full integration
- [ ] Implement caching
- [ ] Performance testing

## 11. Risk Management

### 11.1 Technical Risks

| Risk | Impact | Mitigation |
|--------|--------|----------|
| Unstable DeepSeek API | High | Retry logic, fallback model |
| Low recipe quality | Medium | Prompt improvements, post-processing |
| DB performance degradation | Low | Indexing, query optimization |

## 12. Completion Criteria

### 12.1 Feature Completion
- ✅ DeepSeek integration complete
- ✅ 3 or more recipes generated
- ✅ Ingredient editing works
- ✅ Filtering/search works

### 12.2 Quality Criteria
- ✅ Recipe relevance of 80% or higher
- ✅ Response time targets met
- ✅ Error rate below 1%

## 13. Preparing for Step 3

Next-step features:
- User profile system
- Recipe saving/bookmarks
- Personalized recommendations
- Social sharing

---

**Document Info**
- Created: 2025-01-14
- Version: 1.0
- Author: System
- Review scheduled: upon completion of Step 2

# PRD - Step 2: Recipe generation

## 1. Goal

Turn the ingredient list from Step 1 into cookable recipes, and keep every generated recipe in a local database.

## 2. Scope

| In scope | Out of scope |
|---|---|
| Editing the ingredient list by hand | User accounts (Step 3) |
| Recipe generation with a text model | Personal saved-recipe folders (Step 3) |
| Cuisine / difficulty / time / servings options | Ratings and cooking history (Step 3) |
| Storing recipes in SQLite | Cloud deployment |

## 3. Technical direction

- **UI**: Streamlit with four tabs - Ingredient recognition, Edit ingredients, Recipe generation, Recipe list
- **Recipe model**: `openai/gpt-oss-20b:free` on OpenRouter
- **Vision model**: unchanged from Step 1, `google/gemma-4-26b-a4b-it:free`
- **Storage**: SQLite file `recipes.db`, created automatically on first run

## 4. Modules added on top of Step 1

```
app_step2.py                    four-tab Streamlit UI
backend/recipe_generator.py     prompt, request, and response parsing
backend/database.py             SQLite schema and queries
```

## 5. Prompt contract

The model is asked to answer in a fixed plain-text shape so the app can parse it without JSON mode:

```
### RECIPE
TITLE: <dish name>
CUISINE: <cuisine>
DIFFICULTY: <Easy|Medium|Hard>
TIME: <minutes>
SERVINGS: <number>
INGREDIENTS:
- <item with amount>
STEPS:
1. <step>
TIP: <one short tip>
```

`RecipeGenerator._parse` splits on `### RECIPE` and reads each field, so a partially malformed answer still yields the recipes that did parse.

## 6. Data model

`recipes` table: `id`, `title`, `cuisine`, `difficulty`, `time_minutes`, `servings`, `ingredients` (JSON), `steps` (JSON), `tip`, `created_at`.

## 7. Behaviour

1. Ingredients recognized in the first tab flow into the editor.
2. The editor supports adding, removing, and clearing items.
3. Generation takes cuisine, difficulty, maximum time, and servings.
4. Every generated recipe is written to SQLite immediately.
5. The recipe list tab filters by cuisine and maximum time.

## 8. Done when

- Recipes generate from an edited ingredient list.
- The sidebar shows a live count of stored recipes.
- Filters on the recipe list tab return the expected rows.

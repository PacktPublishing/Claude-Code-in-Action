# FridgeChef

A Streamlit web app that recognizes ingredients in a fridge photo and generates recipes using free models on OpenRouter.

## Stack

- **Image recognition**: `google/gemma-4-26b-a4b-it:free` (via OpenRouter)
- **Recipe generation**: `openai/gpt-oss-20b:free` (via OpenRouter)
- **UI**: Streamlit
- **Storage**: SQLite (recipes) + JSON files (users, profiles, saved recipes)

## Layout

- `app.py` – Step 1 entry (image recognition only)
- `app_step2.py` – Step 2 entry (adds ingredient editing + recipe generation)
- `app_step3.py` – Step 3 entry (adds login, profile, saved recipes, dashboard)
- `backend/` – shared modules (config, OpenRouter client, image service, recipe generator, ingredient manager, database, auth, user profile)
- `run_step1.bat` / `run_step2.bat` / `run_step3.bat` – launch scripts

## Rules

- Never commit `.env`, `recipes.db`, `users.json`, `user_profiles.json`, or `saved_recipes.json`.
- All new modules go under `backend/` unless they are Streamlit UI code.

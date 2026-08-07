# PRD - Step 1: Ingredient recognition

## 1. Goal

Let a user upload a photo of the inside of their fridge and get back a clean, categorized list of the ingredients the AI can see.

## 2. Scope

| In scope | Out of scope |
|---|---|
| Photo upload and validation | Editing the ingredient list (Step 2) |
| Vision model call through OpenRouter | Recipe generation (Step 2) |
| Categorized ingredient list | User accounts (Step 3) |
| Download the list as text | Saving to a database (Step 2) |

## 3. Technical direction

- **UI**: Streamlit, two columns (upload on the left, result on the right)
- **Vision model**: `google/gemma-4-26b-a4b-it:free` on OpenRouter
- **API key**: read from `.env` through `python-dotenv`, never hard-coded
- **Image handling**: Pillow; downscale the longest side to 1024 px and re-encode as JPEG before sending

## 4. Modules

```
app.py                     Streamlit UI
backend/config.py          settings and model IDs
backend/openrouter_client.py   API calls
backend/image_service.py   validation, resizing, response parsing
```

## 5. Behaviour

1. The user selects a JPG, PNG, or WEBP file up to 10 MB.
2. Invalid files show an inline error and nothing is sent to the API.
3. Pressing **Recognize ingredients** shows a spinner while the request runs.
4. The model answers in markdown; the app parses it into `{category: [ingredient, ...]}`.
5. The result panel shows the category count, the ingredient count, and one expander per category.
6. A **Download as text** button exports the list.

## 6. Errors to handle

| Situation | Message |
|---|---|
| Missing API key | "OPENROUTER_API_KEY is not set..." |
| 401 from OpenRouter | "Invalid API key. Check OPENROUTER_API_KEY in your .env file." |
| 429 from OpenRouter | "Free-tier limit reached. Wait a moment and try again." |
| Unsupported file type | "Unsupported format. Please upload one of: JPG, JPEG, PNG, WEBP." |

## 7. Done when

- A fridge photo produces a categorized ingredient list.
- A **Test API connection** button in the sidebar confirms the key works.
- No API key appears anywhere in the source or in the UI.

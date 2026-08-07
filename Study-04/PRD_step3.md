# PRD - Step 3: Accounts, saved recipes, and a dashboard

## 1. Goal

Give each user their own account, their own saved recipes, and a dashboard that summarizes their cooking.

## 2. Scope

| In scope | Out of scope |
|---|---|
| Sign up, log in, log out | Password reset by email |
| A demo account for quick trials | OAuth or social login |
| Per-user saved recipes with ratings | Sharing recipes between users |
| Profile settings that steer generation | Cloud hosting |
| Dashboard with counts and a chart | Push notifications |

## 3. Technical direction

- **UI**: Streamlit with a sidebar menu - Dashboard, Recognize ingredients, Create recipe, My recipes, Profile
- **Auth**: SHA-256 with a per-user salt, stored in `users.json`
- **Per-user data**: `user_profiles.json` and `saved_recipes.json`
- **Charts**: `st.bar_chart` with pandas, so no extra chart dependency is needed

## 4. Modules added on top of Step 2

```
app_step3.py                Streamlit app with login gate and five pages
backend/auth.py             sign-up, login, demo account
backend/user_profile.py     profiles, saved recipes, statistics
```

## 5. Behaviour

1. Every page except the login screen requires a session.
2. **Use demo account** creates `demo@fridgechef.app` on first click and signs in.
3. The profile page stores cooking level, household size, favorite cuisine, dietary preferences, and allergies.
4. The profile drives the defaults on the **Create recipe** page (servings and cuisine).
5. Saving a recipe assigns an id like `r0001` and records the save date.
6. **My recipes** supports a 0-5 rating and a "mark as cooked" action.
7. The dashboard shows saved count, cooked count, average rating, a recipes-by-cuisine chart, and the five most recent saves.

## 6. Security notes

- Passwords are never stored in plain text.
- `users.json`, `user_profiles.json`, `saved_recipes.json`, and `recipes.db` are all in `.gitignore`.
- The API key stays in `.env`, which is also ignored by git.

## 7. Done when

- A new account can be created, used, and logged out of.
- A generated recipe can be saved, rated, and marked as cooked.
- The dashboard numbers change to match those actions.

# PRD Step 3: User Profile and Recipe Saving System
**Phase 3 - Personalization and Data Management Features**

## 1. Project Overview

### 1.1 Goal
Build a polished web application that creates per-user profiles so users can save and manage their recipes and receive personalized recommendations

### 1.2 Scope
- User authentication system
- Profile management
- Recipe saving/bookmarks
- Personalized recommendation algorithm
- Social sharing
- Dashboard and statistics

### 1.3 Development Period
10 days (2 weeks)

### 1.4 Success Metrics
- Sign-up rate of 30% or higher
- Recipe save rate of 50% or higher
- 100 daily active users (DAU)
- Average of 10 saved recipes per user

## 2. Tech Stack (Final)

```yaml
Backend:
  - Python 3.9+
  - FastAPI
  - SQLAlchemy (ORM)
  - PostgreSQL (production DB)
  - Redis (sessions/cache)
  - Celery (background jobs)

Frontend:
  - Streamlit
  - Streamlit-Authenticator
  - JavaScript (custom components)
  - CSS3 (animations)

Security:
  - JWT (auth tokens)
  - bcrypt (password hashing)
  - OAuth 2.0 (social login)

Cloud:
  - AWS S3 (image storage)
  - CloudFront (CDN)
```

## 3. System Architecture (Final)

```
┌────────────────────────────────┐
│        Web Browser             │
└──────────┬─────────────────────┘
           │
┌──────────▼─────────────────────┐
│     Streamlit Frontend         │
└──────────┬─────────────────────┘
           │
┌──────────▼─────────────────────┐
│      FastAPI Backend           │
├────────────────────────────────┤
│  Auth │ Profile │ Recipe │ AI  │
└──────┬─────────┬────────┬──────┘
       │         │        │
┌──────▼─────────▼────────▼──────┐
│         PostgreSQL             │
└────────────────────────────────┘
       │
┌──────▼─────────────────────────┐
│    Redis Cache & Session       │
└────────────────────────────────┘
```

## 4. User Authentication System

### 4.1 Sign-Up/Login

#### 4.1.1 Sign-Up Flow
```python
class UserRegistration:
    def register(self, user_data):
        # 1. Validate input
        validate_email(user_data['email'])
        validate_password(user_data['password'])

        # 2. Check for duplicates
        if user_exists(user_data['email']):
            raise ValueError("This email is already registered")

        # 3. Hash the password
        hashed_password = bcrypt.hashpw(
            user_data['password'].encode('utf-8'),
            bcrypt.gensalt()
        )

        # 4. Create the user
        user = User(
            email=user_data['email'],
            username=user_data['username'],
            password=hashed_password
        )

        # 5. Send welcome email
        send_welcome_email(user.email)

        return user
```

#### 4.1.2 Login UI
```python
# Streamlit login form
def login_page():
    st.title("🍳 FridgeChef Login")

    with st.form("login_form"):
        email = st.text_input("Email", placeholder="your@email.com")
        password = st.text_input("Password", type="password")
        remember = st.checkbox("Keep me signed in")

        col1, col2 = st.columns(2)
        with col1:
            login_btn = st.form_submit_button("Log In", use_container_width=True)
        with col2:
            signup_btn = st.form_submit_button("Sign Up", use_container_width=True)

    # Social login
    st.divider()
    st.write("Sign in with a social account")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("🔵 Google", use_container_width=True):
            google_login()
    with col2:
        if st.button("🟢 Naver", use_container_width=True):
            naver_login()
    with col3:
        if st.button("🟡 Kakao", use_container_width=True):
            kakao_login()
```

### 4.2 Session Management

#### 4.2.1 JWT Tokens
```python
class TokenManager:
    SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE = timedelta(hours=24)

    @classmethod
    def create_access_token(cls, user_id: int):
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + cls.ACCESS_TOKEN_EXPIRE
        }
        return jwt.encode(payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def verify_token(cls, token: str):
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return payload["user_id"]
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
```

#### 4.2.2 Session State
```python
# Streamlit session management
class SessionManager:
    @staticmethod
    def init_session():
        if 'user' not in st.session_state:
            st.session_state.user = None
        if 'token' not in st.session_state:
            st.session_state.token = None

    @staticmethod
    def login(user, token):
        st.session_state.user = user
        st.session_state.token = token
        st.session_state.login_time = datetime.now()

    @staticmethod
    def logout():
        st.session_state.user = None
        st.session_state.token = None
        st.rerun()

    @staticmethod
    def is_logged_in():
        return st.session_state.user is not None
```

## 5. Profile Management

### 5.1 User Profile

#### 5.1.1 Profile Data Model
```python
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    nickname = Column(String(50))
    bio = Column(Text)
    profile_image = Column(String(255))
    cooking_level = Column(Enum(CookingLevel))
    dietary_preferences = Column(JSON)  # ["vegetarian", "gluten_free"]
    allergies = Column(JSON)  # ["peanuts", "shellfish"]
    favorite_cuisine = Column(JSON)  # ["korean", "italian"]
    household_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

#### 5.1.2 Profile Edit UI
```python
def profile_edit_page():
    st.title("Profile Settings")

    user = st.session_state.user
    profile = get_user_profile(user.id)

    with st.form("profile_form"):
        # Basic info
        col1, col2 = st.columns([1, 2])

        with col1:
            # Profile image
            uploaded_file = st.file_uploader(
                "Profile Photo",
                type=['jpg', 'png'],
                label_visibility="collapsed"
            )
            if uploaded_file:
                st.image(uploaded_file, width=150)

        with col2:
            nickname = st.text_input("Nickname", value=profile.nickname)
            bio = st.text_area("About Me", value=profile.bio, height=100)

        # Cooking info
        st.subheader("Cooking Info")
        cooking_level = st.select_slider(
            "Cooking Skill",
            options=["Beginner", "Intermediate", "Advanced", "Expert"],
            value=profile.cooking_level
        )

        household = st.number_input(
            "Household Size",
            min_value=1,
            max_value=10,
            value=profile.household_size
        )

        # Preferences
        st.subheader("Food Preferences")
        cuisine = st.multiselect(
            "Favorite Cuisines",
            ["Korean", "Chinese", "Japanese", "Western", "Southeast Asian", "Other"],
            default=profile.favorite_cuisine
        )

        dietary = st.multiselect(
            "Dietary Restrictions",
            ["Vegetarian", "Vegan", "Gluten-Free", "Low-Sodium", "Low-Sugar"],
            default=profile.dietary_preferences
        )

        allergies = st.multiselect(
            "Allergies",
            ["Peanuts", "Milk", "Eggs", "Wheat", "Shellfish", "Fish"],
            default=profile.allergies
        )

        if st.form_submit_button("Save", use_container_width=True):
            update_profile(user.id, {
                "nickname": nickname,
                "bio": bio,
                "cooking_level": cooking_level,
                "household_size": household,
                "favorite_cuisine": cuisine,
                "dietary_preferences": dietary,
                "allergies": allergies
            })
            st.success("Profile updated!")
```

## 6. Recipe Saving System

### 6.1 Saving Features

#### 6.1.1 Recipe Bookmarks
```python
class RecipeBookmark:
    @staticmethod
    def save_recipe(user_id: int, recipe_id: int, folder_id: int = None):
        bookmark = SavedRecipe(
            user_id=user_id,
            recipe_id=recipe_id,
            folder_id=folder_id,
            saved_at=datetime.utcnow()
        )
        db.session.add(bookmark)
        db.session.commit()

        # Update save statistics
        update_user_stats(user_id, 'recipes_saved')

        return bookmark

    @staticmethod
    def create_folder(user_id: int, folder_name: str):
        folder = RecipeFolder(
            user_id=user_id,
            name=folder_name,
            created_at=datetime.utcnow()
        )
        db.session.add(folder)
        db.session.commit()
        return folder
```

#### 6.1.2 Recipe Collection UI
```python
def my_recipes_page():
    st.title("My Recipes 📚")

    # Tab menu
    tab1, tab2, tab3, tab4 = st.tabs([
        "Saved Recipes", "Folders", "Recently Viewed", "My Creations"
    ])

    with tab1:
        saved_recipes = get_saved_recipes(st.session_state.user.id)

        # Filter and sort
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            search = st.text_input("🔍 Search Recipes", placeholder="Recipe name or ingredient")
        with col2:
            sort_by = st.selectbox("Sort", ["Newest", "Name", "Rating"])
        with col3:
            view_mode = st.radio("View", ["Cards", "List"], horizontal=True)

        # Display recipes
        if view_mode == "Cards":
            display_recipe_cards(saved_recipes, columns=3)
        else:
            display_recipe_list(saved_recipes)

    with tab2:
        # Folder management
        folders = get_user_folders(st.session_state.user.id)

        col1, col2 = st.columns([3, 1])
        with col1:
            new_folder = st.text_input("Create New Folder")
        with col2:
            if st.button("Add", use_container_width=True):
                create_folder(st.session_state.user.id, new_folder)
                st.rerun()

        # Folder list
        for folder in folders:
            with st.expander(f"📁 {folder.name} ({folder.recipe_count})"):
                folder_recipes = get_folder_recipes(folder.id)
                for recipe in folder_recipes:
                    col1, col2 = st.columns([4, 1])
                    with col1:
                        st.write(f"• {recipe.name}")
                    with col2:
                        if st.button("Delete", key=f"del_{recipe.id}"):
                            remove_from_folder(recipe.id, folder.id)
```

### 6.2 Recipe Notes

#### 6.2.1 Personal Memo Feature
```python
class RecipeNote:
    @staticmethod
    def add_note(user_id: int, recipe_id: int, note: str, rating: int = None):
        recipe_note = UserRecipeNote(
            user_id=user_id,
            recipe_id=recipe_id,
            note=note,
            rating=rating,
            created_at=datetime.utcnow()
        )
        db.session.add(recipe_note)
        db.session.commit()
        return recipe_note

    @staticmethod
    def add_photo(user_id: int, recipe_id: int, photo_url: str):
        photo = UserRecipePhoto(
            user_id=user_id,
            recipe_id=recipe_id,
            photo_url=photo_url,
            uploaded_at=datetime.utcnow()
        )
        db.session.add(photo)
        db.session.commit()
        return photo
```

## 7. Personalized Recommendations

### 7.1 Recommendation Algorithm

#### 7.1.1 Collaborative Filtering
```python
class RecommendationEngine:
    def get_personalized_recipes(self, user_id: int, limit: int = 10):
        # 1. Analyze user profile
        profile = get_user_profile(user_id)
        preferences = profile.dietary_preferences
        allergies = profile.allergies

        # 2. Analyze past behavior
        saved_recipes = get_saved_recipes(user_id)
        viewed_recipes = get_viewed_recipes(user_id)

        # 3. Find similar users
        similar_users = find_similar_users(user_id)

        # 4. Calculate recommendation scores
        recommendations = []
        for recipe in all_recipes:
            score = 0

            # Preference matching
            if recipe.cuisine in profile.favorite_cuisine:
                score += 20

            # Allergy check
            if not any(allergen in recipe.ingredients for allergen in allergies):
                score += 10

            # Similar users' preferences
            if recipe.id in get_popular_among_similar(similar_users):
                score += 15

            # Difficulty matching
            if recipe.difficulty == profile.cooking_level:
                score += 10

            recommendations.append((recipe, score))

        # 5. Return top N
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in recommendations[:limit]]
```

#### 7.1.2 Personalized Recommendation UI
```python
def personalized_recommendations():
    st.header("🎯 Recommended for You")

    user_id = st.session_state.user.id
    recommendations = get_personalized_recipes(user_id)

    # Display recommendation reasons
    for recipe in recommendations:
        with st.container():
            col1, col2, col3 = st.columns([1, 3, 1])

            with col1:
                st.image(recipe.image_url, width=100)

            with col2:
                st.subheader(recipe.name)
                # Recommendation reasons
                reasons = get_recommendation_reasons(recipe, user_id)
                for reason in reasons:
                    st.caption(f"✨ {reason}")

            with col3:
                if st.button("Save", key=f"save_{recipe.id}"):
                    save_recipe(user_id, recipe.id)
                    st.toast("Recipe saved!")
```

## 8. Dashboard

### 8.1 User Statistics

#### 8.1.1 Statistics Collection
```python
class UserStatistics:
    @staticmethod
    def get_user_stats(user_id: int):
        stats = {
            "total_recipes_saved": count_saved_recipes(user_id),
            "total_recipes_cooked": count_cooked_recipes(user_id),
            "favorite_cuisine": get_most_saved_cuisine(user_id),
            "avg_cooking_time": calculate_avg_cooking_time(user_id),
            "calories_saved": calculate_calories_saved(user_id),
            "money_saved": estimate_money_saved(user_id),
            "streak_days": get_cooking_streak(user_id),
            "achievements": get_user_achievements(user_id)
        }
        return stats
```

#### 8.1.2 Dashboard UI
```python
def dashboard_page():
    st.title("📊 My Cooking Dashboard")

    user_id = st.session_state.user.id
    stats = get_user_stats(user_id)

    # Key metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "Recipes Saved",
            stats['total_recipes_saved'],
            delta="+3 this week"
        )

    with col2:
        st.metric(
            "Meals Cooked",
            stats['total_recipes_cooked'],
            delta="+5 this month"
        )

    with col3:
        st.metric(
            "Money Saved",
            f"${stats['money_saved']:,}",
            delta="+$15"
        )

    with col4:
        st.metric(
            "Cooking Streak",
            f"{stats['streak_days']} days",
            delta="+2 days"
        )

    # Charts
    st.subheader("📈 Cooking Statistics")

    col1, col2 = st.columns(2)

    with col1:
        # Cooking frequency chart
        cooking_freq = get_cooking_frequency(user_id)
        fig = px.line(
            cooking_freq,
            x='date',
            y='count',
            title='Meals Cooked per Month'
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        # Favorite cuisine distribution
        cuisine_dist = get_cuisine_distribution(user_id)
        fig = px.pie(
            cuisine_dist,
            values='count',
            names='cuisine',
            title='Favorite Cuisine Distribution'
        )
        st.plotly_chart(fig, use_container_width=True)

    # Achievements
    st.subheader("🏆 My Achievements")
    achievements = stats['achievements']

    cols = st.columns(5)
    for idx, achievement in enumerate(achievements[:5]):
        with cols[idx]:
            st.image(achievement['icon'], width=50)
            st.caption(achievement['name'])
```

## 9. Social Features

### 9.1 Sharing

#### 9.1.1 Recipe Sharing
```python
class SocialSharing:
    @staticmethod
    def share_recipe(recipe_id: int, platform: str):
        recipe = get_recipe(recipe_id)
        share_url = f"https://fridgechef.com/recipe/{recipe_id}"

        if platform == "kakao":
            return create_kakao_share(recipe, share_url)
        elif platform == "facebook":
            return create_facebook_share(recipe, share_url)
        elif platform == "instagram":
            return create_instagram_story(recipe)

    @staticmethod
    def create_recipe_link(recipe_id: int, user_id: int):
        # Generate share link
        share_token = generate_share_token(recipe_id, user_id)
        return f"https://fridgechef.com/share/{share_token}"
```

#### 9.1.2 Community Features
```python
def community_page():
    st.title("👥 Community")

    tab1, tab2, tab3 = st.tabs(["Popular Recipes", "Following", "Challenges"])

    with tab1:
        # Popular recipes
        popular_recipes = get_popular_recipes(limit=10)
        for recipe in popular_recipes:
            with st.container():
                col1, col2, col3 = st.columns([1, 3, 1])

                with col1:
                    st.image(recipe.user.profile_image, width=50)
                    st.caption(recipe.user.nickname)

                with col2:
                    st.subheader(recipe.name)
                    st.write(f"❤️ {recipe.likes} | 💬 {recipe.comments}")

                with col3:
                    if st.button("Details", key=f"view_{recipe.id}"):
                        view_recipe(recipe.id)

    with tab2:
        # Activity from followed users
        following_activities = get_following_activities(st.session_state.user.id)
        for activity in following_activities:
            st.write(f"• {activity.user.nickname} {activity.action}")

    with tab3:
        # Cooking challenge
        current_challenge = get_current_challenge()
        st.subheader(f"🎯 This Week's Challenge: {current_challenge.title}")
        st.write(current_challenge.description)

        if st.button("Join"):
            join_challenge(st.session_state.user.id, current_challenge.id)
```

## 10. Database Schema (Final)

### 10.1 User-Related Tables

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    nickname VARCHAR(50),
    bio TEXT,
    profile_image VARCHAR(255),
    cooking_level VARCHAR(20),
    dietary_preferences JSONB,
    allergies JSONB,
    favorite_cuisine JSONB,
    household_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Saved recipes
CREATE TABLE saved_recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    recipe_id INTEGER REFERENCES recipes(id),
    folder_id INTEGER REFERENCES recipe_folders(id),
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id)
);

-- Recipe folders
CREATE TABLE recipe_folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User statistics
CREATE TABLE user_statistics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_recipes_saved INTEGER DEFAULT 0,
    total_recipes_cooked INTEGER DEFAULT 0,
    total_time_saved INTEGER DEFAULT 0,
    total_money_saved INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 11. Security Hardening

### 11.1 Security Measures

```python
class SecurityManager:
    @staticmethod
    def validate_password(password: str):
        """Validate password policy"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain an uppercase letter")

        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain a lowercase letter")

        if not re.search(r"[0-9]", password):
            raise ValueError("Password must contain a number")

    @staticmethod
    def rate_limit(user_id: int, action: str):
        """Limit API calls"""
        key = f"rate_limit:{user_id}:{action}"
        count = redis_client.incr(key)

        if count == 1:
            redis_client.expire(key, 60)  # 1 minute

        if count > 10:  # 10 requests per minute
            raise HTTPException(status_code=429, detail="Too many requests")

    @staticmethod
    def sanitize_input(text: str):
        """Sanitize input values"""
        # Remove HTML tags
        text = re.sub('<.*?>', '', text)
        # Prevent SQL injection
        text = text.replace("'", "''")
        return text
```

## 12. Performance Optimization

### 12.1 Optimization Strategies

```python
# Redis caching
@cache.memoize(timeout=300)
def get_user_recommendations(user_id: int):
    return calculate_recommendations(user_id)

# Database query optimization
def get_user_recipes_optimized(user_id: int):
    return db.session.query(Recipe)\
        .join(SavedRecipe)\
        .filter(SavedRecipe.user_id == user_id)\
        .options(
            joinedload(Recipe.ingredients),
            joinedload(Recipe.steps)
        ).all()

# Image optimization
def optimize_image(image_file):
    img = Image.open(image_file)
    img.thumbnail((800, 800))
    output = BytesIO()
    img.save(output, format='WEBP', quality=85)
    return output.getvalue()
```

## 13. Development Schedule

### Week 1: Authentication and Profiles
- Day 1-2: User authentication system
- Day 3: Profile management
- Day 4: Session management
- Day 5: Social login

### Week 2: Saving and Personalization
- Day 6-7: Recipe saving system
- Day 8: Folder management
- Day 9: Personalized recommendations
- Day 10: Dashboard

### Week 3: Social and Optimization
- Day 11: Social sharing
- Day 12: Community features
- Day 13: Performance optimization
- Day 14: Security hardening
- Day 15: Final testing

## 14. Completion Criteria

### 14.1 Feature Completion
- ✅ User authentication system
- ✅ Profile management
- ✅ Recipe saving/folders
- ✅ Personalized recommendations
- ✅ Dashboard
- ✅ Social features

### 14.2 Quality Criteria
- ✅ Security tests passed
- ✅ Performance targets met
- ✅ Usability testing complete
- ✅ Mobile optimization

## 15. Deployment and Operations

### 15.1 Deployment Plan
- Docker containerization
- AWS EC2 deployment
- CloudFront CDN setup
- RDS PostgreSQL setup
- ElastiCache Redis setup

### 15.2 Monitoring
- CloudWatch alarms
- Sentry error tracking
- Google Analytics
- User feedback collection

---

**Document Info**
- Created: 2025-01-14
- Version: 1.0
- Author: System
- Target completion: 2025-02-01

"""
Recipe generation service using DeepSeek model
"""
import json
from typing import Dict, List, Optional
from backend.config import Config
from backend.openrouter_client import OpenRouterClient

class RecipeGenerator:
    """Service for generating recipes using DeepSeek model"""

    def __init__(self):
        self.client = OpenRouterClient()
        self.model = Config.RECIPE_GENERATION_MODEL

    def generate_recipes(
        self,
        ingredients: Dict[str, List[str]],
        preferences: Optional[Dict] = None
    ) -> Dict:
        """
        Generate recipes based on available ingredients

        Args:
            ingredients: Dictionary of ingredients by category
            preferences: Optional user preferences (difficulty, time, servings)

        Returns:
            Dictionary containing generated recipes
        """
        # Flatten ingredients for prompt
        all_ingredients = []
        for category, items in ingredients.items():
            all_ingredients.extend(items)

        # Default preferences
        if preferences is None:
            preferences = {
                'difficulty': 'Normal',
                'cooking_time': 'Within 30 minutes',
                'servings': 4,
                'cuisine': 'Korean'
            }

        # Create prompt
        prompt = self._create_recipe_prompt(all_ingredients, preferences)

        # Get response from DeepSeek
        messages = [
            {
                "role": "system",
                "content": "You are a professional chef. You create practical and delicious recipes based on available ingredients. Always respond in English."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        response = self.client.chat_completion(
            messages=messages,
            model=self.model
        )

        if response and 'choices' in response:
            content = response['choices'][0]['message']['content']
            return self._parse_recipes(content)

        return {"error": "Failed to generate recipes", "recipes": []}

    def _create_recipe_prompt(
        self,
        ingredients: List[str],
        preferences: Dict
    ) -> str:
        """Create prompt for recipe generation"""

        # Format ingredients for the prompt
        ingredients_text = "\n".join([f"- {ing}" for ing in ingredients])

        prompt = f"""Please recommend 3 recipes that can be made with the following ingredients.

Available ingredients:
{ingredients_text}

Requirements:
- Difficulty: {preferences.get('difficulty', 'Normal')}
- Cooking time: {preferences.get('cooking_time', 'Within 30 minutes')}
- Servings: {preferences.get('servings', 4)} servings
- Cuisine type: {preferences.get('cuisine', 'Korean')}

Write each recipe in the following format:

===Recipe 1===
Recipe Name: [dish name]
Difficulty: [Easy/Normal/Hard]
Cooking Time: [minutes]
Servings: [number of servings]
Calories: [calories per serving]

Required Ingredients:
- [ingredient name]: [amount]
- [ingredient name]: [amount]

Cooking Instructions:
1. [first step]
2. [second step]
3. [third step]
(add as many steps as needed)

Cooking Tip: [1-2 useful tips]

===Recipe 2===
(write in the same format)

===Recipe 3===
(write in the same format)

Notes:
1. Provide realistic recipes that can actually be made.
2. Make the most of the provided ingredients; basic seasonings (salt, pepper, oil, etc.) may be added.
3. Explain each step clearly so it is easy to follow.
4. Only add common pantry ingredients found in most home kitchens.
5. Respond entirely in English."""

        return prompt

    def _parse_recipes(self, text: str) -> Dict:
        """
        Parse the AI response into structured recipe data

        Args:
            text: Raw text response from AI

        Returns:
            Structured dictionary of recipes
        """
        recipes = []

        # Split by recipe separator
        recipe_blocks = text.split('===Recipe')

        for block in recipe_blocks[1:]:  # Skip first empty block
            if not block.strip():
                continue

            recipe = {}
            lines = block.strip().split('\n')

            current_section = None
            ingredients = []
            steps = []

            for line in lines:
                line = line.strip()

                if not line or line.startswith('==='):
                    continue

                # Parse recipe name
                if line.startswith('Recipe Name:'):
                    recipe['name'] = line.replace('Recipe Name:', '').strip()

                # Parse difficulty
                elif line.startswith('Difficulty:'):
                    recipe['difficulty'] = line.replace('Difficulty:', '').strip()

                # Parse cooking time
                elif line.startswith('Cooking Time:'):
                    time_str = line.replace('Cooking Time:', '').strip()
                    # Extract number from string like "30 minutes"
                    import re
                    time_match = re.search(r'\d+', time_str)
                    recipe['time'] = int(time_match.group()) if time_match else 30

                # Parse servings
                elif line.startswith('Servings:'):
                    servings_str = line.replace('Servings:', '').strip()
                    import re
                    servings_match = re.search(r'\d+', servings_str)
                    recipe['servings'] = int(servings_match.group()) if servings_match else 4

                # Parse calories
                elif line.startswith('Calories:'):
                    cal_str = line.replace('Calories:', '').strip()
                    import re
                    cal_match = re.search(r'\d+', cal_str)
                    recipe['calories'] = int(cal_match.group()) if cal_match else 0

                # Section headers
                elif 'Required Ingredients' in line or 'Ingredients:' in line:
                    current_section = 'ingredients'

                elif 'Cooking Instructions' in line or 'Cooking Method' in line:
                    current_section = 'steps'

                elif 'Cooking Tip' in line or 'Tip:' in line:
                    current_section = 'tips'

                # Parse content based on current section
                elif current_section == 'ingredients' and line.startswith('-'):
                    ingredient = line.lstrip('-').strip()
                    if ':' in ingredient:
                        ing_name, ing_amount = ingredient.split(':', 1)
                        ingredients.append({
                            'name': ing_name.strip(),
                            'amount': ing_amount.strip()
                        })
                    else:
                        ingredients.append({
                            'name': ingredient,
                            'amount': ''
                        })

                elif current_section == 'steps':
                    # Handle numbered steps
                    import re
                    step_match = re.match(r'^\d+\.\s*(.*)', line)
                    if step_match:
                        steps.append(step_match.group(1))

                elif current_section == 'tips' and line:
                    recipe['tips'] = line

            # Add parsed data to recipe
            if ingredients:
                recipe['ingredients'] = ingredients
            if steps:
                recipe['steps'] = steps

            # Set defaults if missing
            recipe.setdefault('name', 'Untitled Recipe')
            recipe.setdefault('difficulty', 'Normal')
            recipe.setdefault('time', 30)
            recipe.setdefault('servings', 4)
            recipe.setdefault('calories', 250)
            recipe.setdefault('ingredients', [])
            recipe.setdefault('steps', [])
            recipe.setdefault('tips', '')

            # Calculate match score based on available ingredients
            recipe['match_score'] = 85  # Default score

            if recipe['name'] != 'Untitled Recipe':
                recipes.append(recipe)

        return {
            "status": "success",
            "recipes": recipes[:3],  # Return top 3 recipes
            "total_recipes": len(recipes),
            "raw_text": text
        }

    def translate_ingredients(self, ingredients_en: List[str]) -> List[str]:
        """
        Normalize ingredient names to canonical English terms

        Args:
            ingredients_en: List of ingredients in English

        Returns:
            List of normalized ingredient names
        """
        # Common ingredient name normalizations
        translation_dict = {
            'onion': 'onion',
            'onions': 'onion',
            'carrot': 'carrot',
            'carrots': 'carrot',
            'potato': 'potato',
            'potatoes': 'potato',
            'tomato': 'tomato',
            'tomatoes': 'tomato',
            'lettuce': 'lettuce',
            'cabbage': 'cabbage',
            'meat': 'meat',
            'pork': 'pork',
            'beef': 'beef',
            'chicken': 'chicken',
            'fish': 'fish',
            'egg': 'egg',
            'eggs': 'egg',
            'milk': 'milk',
            'cheese': 'cheese',
            'butter': 'butter',
            'yogurt': 'yogurt',
            'rice': 'rice',
            'bread': 'bread',
            'noodles': 'noodles',
            'oil': 'oil',
            'salt': 'salt',
            'sugar': 'sugar',
            'pepper': 'pepper',
            'garlic': 'garlic',
            'ginger': 'ginger',
            'soy sauce': 'soy sauce',
            'kimchi': 'kimchi',
            'apple': 'apple',
            'apples': 'apple',
            'orange': 'orange',
            'oranges': 'orange',
            'cucumber': 'cucumber',
            'broccoli': 'broccoli',
            'juice': 'juice'
        }

        translated = []
        for ingredient in ingredients_en:
            # Clean and lowercase
            clean_ing = ingredient.lower().strip()

            # Remove quantity if present
            import re
            clean_ing = re.sub(r'\d+\s*\w*', '', clean_ing).strip()

            # Translate if in dictionary, otherwise keep original
            if clean_ing in translation_dict:
                translated.append(translation_dict[clean_ing])
            else:
                # Try partial match
                found = False
                for eng, kor in translation_dict.items():
                    if eng in clean_ing or clean_ing in eng:
                        translated.append(kor)
                        found = True
                        break

                if not found:
                    translated.append(ingredient)  # Keep original if no translation

        return translated

    def calculate_match_score(
        self,
        recipe: Dict,
        available_ingredients: List[str]
    ) -> float:
        """
        Calculate how well a recipe matches available ingredients

        Args:
            recipe: Recipe dictionary
            available_ingredients: List of available ingredients

        Returns:
            Match score (0-100)
        """
        if not recipe.get('ingredients'):
            return 0

        recipe_ingredients = recipe['ingredients']
        total_ingredients = len(recipe_ingredients)
        matched = 0

        # Convert available ingredients to lowercase for matching
        available_lower = [ing.lower() for ing in available_ingredients]

        for ing_dict in recipe_ingredients:
            ing_name = ing_dict.get('name', '').lower()

            # Check for match
            for available in available_lower:
                if available in ing_name or ing_name in available:
                    matched += 1
                    break

        # Calculate base score
        match_score = (matched / total_ingredients) * 100 if total_ingredients > 0 else 0

        # Bonus points
        if recipe.get('difficulty') == 'Easy':
            match_score = min(match_score + 5, 100)

        if recipe.get('time', 60) <= 30:
            match_score = min(match_score + 5, 100)

        return round(match_score, 1)
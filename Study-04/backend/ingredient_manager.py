"""
Ingredient management service for editing and managing ingredients
"""
from typing import Dict, List, Optional

class IngredientManager:
    """Service for managing and editing ingredients"""

    # Common ingredients database
    INGREDIENT_DB = {
        "vegetables": [
            "onion", "carrot", "potato", "radish", "napa cabbage", "lettuce", "spinach", "bean sprouts",
            "green onion", "leek", "chives", "garlic", "ginger", "chili pepper", "bell pepper", "paprika",
            "broccoli", "cabbage", "tomato", "cucumber", "eggplant", "pumpkin", "zucchini",
            "sweet pumpkin", "mushroom", "shiitake mushroom", "enoki mushroom", "oyster mushroom", "king oyster mushroom"
        ],
        "meat": [
            "pork", "beef", "chicken", "duck", "lamb",
            "pork belly", "pork shoulder", "ribs", "sirloin", "tenderloin", "chicken breast", "chicken leg"
        ],
        "seafood": [
            "mackerel", "hairtail", "salmon", "tuna", "flounder", "rockfish", "croaker",
            "shrimp", "squid", "small octopus", "octopus", "oyster", "clam", "mussel", "abalone"
        ],
        "dairy": [
            "milk", "cheese", "yogurt", "butter", "heavy cream", "sour cream",
            "mozzarella", "cheddar cheese", "cream cheese", "parmesan cheese"
        ],
        "condiments": [
            "soy sauce", "soybean paste", "chili paste", "ssamjang", "sesame oil", "perilla oil",
            "cooking oil", "olive oil", "vinegar", "sugar", "salt", "black pepper",
            "chili powder", "sesame", "sesame seeds", "perilla seeds", "oyster sauce", "corn syrup"
        ],
        "grains": [
            "rice", "glutinous rice", "barley", "beans", "red beans", "mung beans", "black beans",
            "flour", "pancake mix", "frying mix", "breadcrumbs", "noodles", "pasta"
        ],
        "fruits": [
            "apple", "pear", "grapes", "strawberry", "watermelon", "oriental melon", "melon",
            "orange", "tangerine", "lemon", "lime", "banana", "kiwi", "mango"
        ],
        "processed": [
            "kimchi", "tofu", "fish cake", "ham", "sausage", "bacon", "canned food",
            "instant noodles", "dumplings", "rice cake", "dried seaweed", "sea mustard", "kelp", "anchovy"
        ]
    }

    def __init__(self):
        self.current_ingredients = {}

    def set_ingredients(self, ingredients: Dict[str, List[str]]):
        """Set the current ingredients"""
        self.current_ingredients = ingredients.copy()

    def add_ingredient(self, category: str, ingredient: str, quantity: str = "") -> bool:
        """
        Add a new ingredient

        Args:
            category: Category of the ingredient
            ingredient: Name of the ingredient
            quantity: Optional quantity

        Returns:
            True if added successfully
        """
        if category not in self.current_ingredients:
            self.current_ingredients[category] = []

        # Format ingredient with quantity if provided
        if quantity:
            ingredient_text = f"{ingredient} ({quantity})"
        else:
            ingredient_text = ingredient

        if ingredient_text not in self.current_ingredients[category]:
            self.current_ingredients[category].append(ingredient_text)
            return True

        return False

    def remove_ingredient(self, category: str, ingredient: str) -> bool:
        """
        Remove an ingredient

        Args:
            category: Category of the ingredient
            ingredient: Name of the ingredient

        Returns:
            True if removed successfully
        """
        if category in self.current_ingredients:
            if ingredient in self.current_ingredients[category]:
                self.current_ingredients[category].remove(ingredient)

                # Remove category if empty
                if not self.current_ingredients[category]:
                    del self.current_ingredients[category]

                return True

        return False

    def update_ingredient(
        self,
        category: str,
        old_ingredient: str,
        new_ingredient: str,
        new_quantity: str = ""
    ) -> bool:
        """
        Update an existing ingredient

        Args:
            category: Category of the ingredient
            old_ingredient: Current ingredient name
            new_ingredient: New ingredient name
            new_quantity: New quantity

        Returns:
            True if updated successfully
        """
        if self.remove_ingredient(category, old_ingredient):
            return self.add_ingredient(category, new_ingredient, new_quantity)

        return False

    def get_ingredients(self) -> Dict[str, List[str]]:
        """Get current ingredients"""
        return self.current_ingredients.copy()

    def get_ingredients_flat(self) -> List[str]:
        """Get flat list of all ingredients"""
        flat_list = []
        for category, items in self.current_ingredients.items():
            flat_list.extend(items)
        return flat_list

    def get_suggestions(self, partial: str, category: str = None) -> List[str]:
        """
        Get ingredient suggestions based on partial input

        Args:
            partial: Partial ingredient name
            category: Optional category filter

        Returns:
            List of matching suggestions
        """
        suggestions = []
        partial_lower = partial.lower()

        if category and category in self.INGREDIENT_DB:
            # Search in specific category
            for item in self.INGREDIENT_DB[category]:
                if partial_lower in item.lower():
                    suggestions.append(item)
        else:
            # Search in all categories
            for cat, items in self.INGREDIENT_DB.items():
                for item in items:
                    if partial_lower in item.lower():
                        suggestions.append(item)

        # Remove duplicates and limit results
        suggestions = list(dict.fromkeys(suggestions))
        return suggestions[:10]

    def categorize_ingredient(self, ingredient: str) -> str:
        """
        Auto-categorize an ingredient

        Args:
            ingredient: Ingredient name

        Returns:
            Category name
        """
        ingredient_lower = ingredient.lower()

        for category, items in self.INGREDIENT_DB.items():
            for item in items:
                if item.lower() in ingredient_lower or ingredient_lower in item.lower():
                    return category

        # Default category if not found
        return "other"

    def validate_ingredients(self) -> Dict:
        """
        Validate current ingredients

        Returns:
            Validation result with warnings/errors
        """
        result = {
            "valid": True,
            "warnings": [],
            "errors": []
        }

        # Check if there are any ingredients
        if not self.current_ingredients:
            result["valid"] = False
            result["errors"].append("No ingredients available")
            return result

        total_ingredients = sum(len(items) for items in self.current_ingredients.values())

        if total_ingredients == 0:
            result["valid"] = False
            result["errors"].append("No ingredients available")

        elif total_ingredients < 3:
            result["warnings"].append("Too few ingredients. Recipe generation may be limited")

        elif total_ingredients > 30:
            result["warnings"].append("Too many ingredients. Only some ingredients may be used")

        return result

    def get_statistics(self) -> Dict:
        """Get statistics about current ingredients"""
        stats = {
            "total_categories": len(self.current_ingredients),
            "total_ingredients": sum(len(items) for items in self.current_ingredients.values()),
            "categories": {}
        }

        for category, items in self.current_ingredients.items():
            stats["categories"][category] = len(items)

        return stats

    def import_ingredients(self, text: str) -> Dict[str, List[str]]:
        """
        Import ingredients from text

        Args:
            text: Text containing ingredients

        Returns:
            Parsed ingredients dictionary
        """
        imported = {}
        lines = text.strip().split('\n')

        current_category = "other"

        for line in lines:
            line = line.strip()

            if not line:
                continue

            # Check if it's a category header
            if ':' in line and not line.startswith('-'):
                current_category = line.split(':')[0].strip()
                if current_category not in imported:
                    imported[current_category] = []

            # Check if it's an ingredient
            elif line.startswith('-') or line.startswith('•'):
                ingredient = line.lstrip('-•').strip()
                if current_category not in imported:
                    imported[current_category] = []
                imported[current_category].append(ingredient)

            else:
                # Try to categorize standalone ingredient
                category = self.categorize_ingredient(line)
                if category not in imported:
                    imported[category] = []
                imported[category].append(line)

        return imported

    def export_ingredients(self, format: str = "text") -> str:
        """
        Export ingredients to different formats

        Args:
            format: Export format ('text', 'json', 'csv')

        Returns:
            Formatted string
        """
        if format == "json":
            import json
            return json.dumps(self.current_ingredients, ensure_ascii=False, indent=2)

        elif format == "csv":
            lines = ["Category,Ingredient,Quantity"]
            for category, items in self.current_ingredients.items():
                for item in items:
                    # Extract quantity if present
                    if '(' in item and ')' in item:
                        name = item[:item.index('(')].strip()
                        quantity = item[item.index('(')+1:item.index(')')].strip()
                    else:
                        name = item
                        quantity = ""
                    lines.append(f"{category},{name},{quantity}")
            return '\n'.join(lines)

        else:  # text format
            lines = []
            for category, items in self.current_ingredients.items():
                lines.append(f"{category}:")
                for item in items:
                    lines.append(f"  - {item}")
                lines.append("")  # Empty line between categories
            return '\n'.join(lines)
from pydantic import BaseModel
from typing import List, Optional

# ── Схема для запиту генерації рецептів (ОБ'ЄДНАНА) ──
class GenerateRecipesRequest(BaseModel):
    ingredients: List[str]
    goal: str
    strict_mode: bool = False  # Тепер цей параметр захищений і нікуди не зникне!

# ── Схема для Агента 1 (Vision) ──
class IngredientsResponse(BaseModel):
    ingredients: List[str]

# ── Схеми для Агента 2 (Recipes) ──
class RecipeMacros(BaseModel):
    calories: int
    protein: str
    fats: str
    carbs: str

class Recipe(BaseModel):
    id: int
    title: str
    time: str
    macros: RecipeMacros
    agentReason: str
    description: str
    ingredients: List[str]
    steps: List[str]
    imageUrl: str = ""  # Поле для збереження Base64 рядка картинки

class RecipeResponse(BaseModel):
    recipes: List[Recipe]
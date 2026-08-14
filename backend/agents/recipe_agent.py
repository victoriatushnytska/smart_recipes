import json
import asyncio
from google.genai import types
from config import client
from schemas import GenerateRecipesRequest, RecipeResponse

# 👈 ДОДАЄМО ІМПОРТ ТВОЄЇ ФУНКЦІЇ З IMAGE_AGENT
from agents.image_agent import get_real_food_image 

async def run_recipe_agent(payload: GenerateRecipesRequest) -> dict:
    # ── 1. Формуємо інструкцію залежно від вибору користувача ──
    if payload.strict_mode:
        strict_instruction = """
        ВАЖЛИВО (СУВОРИЙ РЕЖИМ): Використовуй ТІЛЬКИ ті інгредієнти, які передав користувач. 
        Допускається додати ЛИШЕ базові спеції (сіль, чорний перець), воду та олію для смаження.
        КАТЕГОРИЧНО заборонено додавати будь-які інші продукти, які треба докуповувати.
        """
    else:
        strict_instruction = """
        ГНУЧКИЙ РЕЖИМ: Основою страви мають бути передані інгредієнти, але ти МОЖЕШ пропонувати 
        докупити 1-3 додаткових інгредієнти (наприклад: вершки, сир, свіжу зелень), 
        якщо це значно покращить смак страви.
        """

    # ── 2. Додаємо цю інструкцію у промпт ──
    prompt = (
        f"Ти професійний шеф-кухар. Створи 3 різні рецепти, використовуючи ці інгредієнти: {', '.join(payload.ingredients)}. "
        f"{strict_instruction}\n"
        "Поверни результат виключно у форматі JSON згідно зі схемою."
    )

    loop = asyncio.get_running_loop()
    
    fallback_models = ['gemini-2.5-flash', 'gemini-2.0-flash']
    last_error = None

    for model_name in fallback_models:
        try:
            print(f"🍳 Пробую згенерувати рецепти через {model_name}...")
            
            response = await loop.run_in_executor(None, lambda m=model_name: client.models.generate_content(
                model=m, 
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=RecipeResponse,
                    temperature=0.7,
                )
            ))
            
            print(f"✅ Рецепти успішно згенеровано через {model_name}!")
            
            # ── 3. Парсимо відповідь ШІ ──
            data = json.loads(response.text)
            
            # ── 4. ВИКЛИКАЄМО ТВІЙ IMAGE_AGENT ──
            if "recipes" in data:
                # Проходимося по кожному рецепту і шукаємо для нього картинку
                for recipe in data["recipes"]:
                    # await обов'язковий, бо твоя функція асинхронна (async def)
                    recipe["imageUrl"] = await get_real_food_image(recipe["title"])
                    
            return data
            
        except Exception as e:
            error_msg = str(e).lower()
            last_error = e
            
            if "503" in error_msg or "429" in error_msg or "resource exhausted" in error_msg or "unavailable" in error_msg or "quota" in error_msg:
                print(f"⚠️ Модель {model_name} зайнята. Перемикаюсь на наступну...")
                continue
            else:
                raise e

    raise last_error
import json
import asyncio
from google.genai import types
from config import client
from schemas import IngredientsResponse

async def run_vision_agent(image_bytes: bytes, mime_type: str) -> dict:
    prompt = (
        "Ти експерт-кулінар та комп'ютерний зір. Проаналізуй фото холодильника або продуктів і визнач всі інгредієнти, які там є. "
        "Поверни список знайдених продуктів українською мовою у форматі об'єкта JSON із ключем 'ingredients'."
    )

    loop = asyncio.get_running_loop()

    # ── Список моделей для аналізу зображень за пріоритетом ──
    # Ставимо 2.5-flash на перше місце, бо вона стабільніша до безкоштовних квот
    fallback_models = ['gemini-2.5-flash', 'gemini-2.0-flash']
    last_error = None

    for model_name in fallback_models:
        try:
            print(f"📷 Аналізую фото через {model_name}...")
            
            response = await loop.run_in_executor(None, lambda m=model_name: client.models.generate_content(
                model=m, 
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=IngredientsResponse,
                    temperature=0.2,
                )
            ))
            
            print(f"✅ Фото успішно розпізнано через {model_name}!")
            return json.loads(response.text)

        except Exception as e:
            error_msg = str(e).lower()
            last_error = e
            
            # Якщо модель зайнята, видає 429 або 503 — переходимо до наступної в списку
            if "503" in error_msg or "429" in error_msg or "resource exhausted" in error_msg or "unavailable" in error_msg:
                print(f"⚠️ Модель {model_name} тимчасово недоступна або вичерпала ліміти. Перемикаюсь...")
                continue
            else:
                # Якщо помилка критична (наприклад, бітий файл картинки), кидаємо її відразу
                raise e

    # Якщо цикл закінчився, а відповіді немає — викидаємо останню зловину помилку
    raise last_error
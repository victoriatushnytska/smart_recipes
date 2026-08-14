import asyncio
import random
import re
import requests
from ddgs import DDGS

# Резерв на випадок, якщо взагалі пропаде інтернет
FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
]

def clean_search_query(title: str) -> str:
    """Максимально простий і природний запит, щоб не ламати пошуковик."""
    
    # 1. Прибираємо всі спецсимволи
    clean_title = re.sub(r"[^а-яА-ЯіІїЇєЄa-zA-Z0-9\s]", " ", title).strip()
    
    # 2. Беремо ТІЛЬКИ перші 3 слова
    words = clean_title.split()
    short_title = " ".join(words[:3])
    
    # 3. Перевіряємо, чи це напій
    drinks = ["коктейль", "смузі", "напій", "шейк", "вода", "сік"]
    is_drink = any(drink in short_title.lower() for drink in drinks)
    
    # 4. Формуємо простий запит БЕЗ мінус-слів
    if is_drink:
        return f"{short_title} напій у склянці фуд фото"
    else:
        return f"{short_title} рецепт готова страва фуд фото"
    
def check_image_url(url: str) -> bool:
    """Перевіряє, чи дозволяє сайт завантажити цю картинку (захист від битих посилань)."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.head(url, headers=headers, timeout=3, allow_redirects=True)
        if response.status_code == 200 and 'image' in response.headers.get('Content-Type', ''):
            return True
        return False
    except Exception:
        return False

async def get_real_food_image(recipe_title: str) -> str:
    """Шукає фото страви через DuckDuckGo з попереднім фільтруванням та перевіркою URL."""
    
    query = clean_search_query(recipe_title)
    fallback_url = random.choice(FALLBACK_IMAGES)
    
    try:
        print(f"Шукаємо фото в інтернеті за запитом: '{query}'...")
        
        def search_and_verify():
            # Беремо ТОП-5 результатів
            results = DDGS().images(query, max_results=5)
            if not results:
                return None
            
            # Перевіряємо кожну картинку по черзі
            for i, res in enumerate(results):
                img_url = res.get('image')
                if img_url:
                    print(f"  Перевіряю варіант {i+1}...")
                    if check_image_url(img_url):
                        return img_url
                    else:
                        print(f"  Варіант {i+1} заблоковано сайтом. Шукаю далі...")
                        
            return None # Якщо всі 5 виявилися битими

        loop = asyncio.get_running_loop()
        image_url = await loop.run_in_executor(None, search_and_verify)
        
        if image_url:
            print(f"✅ Знайдено робоче фото для: {recipe_title}")
            return image_url
        else:
            print(f"⚠️ Всі 5 варіантів биті або не знайдені. Використовую резерв.")
            return fallback_url

    except Exception as e:
        print(f"❌ Блок від пошуковика ({e}). Використовую резерв.")
        return fallback_url
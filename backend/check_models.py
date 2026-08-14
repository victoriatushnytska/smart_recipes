import os
from dotenv import load_dotenv
from google import genai

# Завантажуємо твій ключ з .env
load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")

# Підключаємося до сервера
client = genai.Client(api_key=api_key)

print("Доступні моделі для твого ключа:")
print("-" * 30)

try:
    # Просто виводимо імена всіх моделей підряд
    for model in client.models.list():
        print(model.name)
except Exception as e:
    print(f"Помилка доступу до API: {e}")
import os
from dotenv import load_dotenv
from google import genai

# Завантажуємо змінні оточення (включаючи GEMINI_API_KEY)
load_dotenv(override=True)

raw_key = os.getenv("GEMINI_API_KEY", "")
clean_key = raw_key.strip().strip('"').strip("'")

# Єдиний клієнт для всього бекенду
client = genai.Client(api_key=clean_key)
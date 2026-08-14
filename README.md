🥗 vtushn - AI-Powered Smart Recipe Generator
vtushn is a Progressive Web Application (PWA) designed to combat household food waste. By leveraging Vision AI and a Multi-Agent backend architecture, the app recognizes ingredients directly from user photos and generates precise, zero-waste recipes with fully calculated macronutrients.

https://drive.google.com/drive/folders/1Mj1y2jGxWyzXK9fBZeDiD7BgMxz0rWrO?usp=sharing 

Key Features
Intelligent Image Recognition: Upload or snap photos of your fridge. The AI identifies usable ingredients while ignoring background noise.

Zero-Waste "Strict Mode": Forces the AI to generate recipes only using the ingredients you already have.

Automatic Macro Calculation: Instantly calculates Calories, Proteins, Fats, and Carbs for every generated recipe.

Progressive Web App (PWA): Installable on iOS and Android devices directly from the browser with a native app feel.

Offline-First Favorites: Save recipes to your personal cabinet. Powered by localStorage, your cookbook is fully accessible even without an internet connection.

Tech Stack
Frontend:

React, Tailwind CSS

HTML5 Canvas (Client-side image processing)

Vite (or CRA)

Backend:

Python, FastAPI, Pydantic

Async API architecture

AI & Integrations:

Google Gemini 2.5 Flash Vision (Multi-Agent processing)

DuckDuckGo Search API (Dynamic real-food image retrieval)

Engineering Highlights
Token Optimization via Canvas: To prevent high API costs and latency, the frontend uses HTML5 Canvas to automatically stitch up to 5 separate photos into a single grid collage before sending it to the backend. This reduces API requests from 5 to 1, saving 80% of Vision token usage.

Agent-Based Backend: The logic is divided into specialized AI agents (Vision, Recipe, and Image agents) to ensure output stability and prevent hallucinated ingredients or broken image links.

Getting Started
Prerequisites
Node.js (v16+)

Python (3.9+)

Google Gemini API Key

1. Backend Setup
Navigate to the backend directory and set up the Python environment:

Bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
Create a .env file in the backend folder and add your API key:

Code snippet
GEMINI_API_KEY="your_api_key_here"
Start the FastAPI server:

Bash
uvicorn main:app --reload
The server will run at http://127.0.0.1:8000

2. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and start the app:

Bash
cd frontend
npm install
npm run dev 
# or 'npm start' depending on your package.json
The app will be available at http://localhost:3000 (or 5173).

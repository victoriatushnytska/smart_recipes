import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from schemas import RecipeResponse, GenerateRecipesRequest
from agents.vision_agent import run_vision_agent
from agents.recipe_agent import run_recipe_agent
from database import init_db, get_db, FavoriteRecipe, RecipeCache, User
from auth import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

app = FastAPI(title="vtushn API", version="1.0.0")
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── АВТОРИЗАЦІЯ ──

@app.post("/api/register")
async def register(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Користувач з таким логіном вже існує")
    
    hashed_password = get_password_hash(form_data.password)
    new_user = User(username=form_data.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "Користувача успішно створено"}

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неправильний логін або пароль")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}


# ── ГЕНЕРАЦІЯ РЕЦЕПТІВ ТА ФОТО (Без змін) ──

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        return await run_vision_agent(image_bytes, file.content_type)
    except Exception as e:
        return {"ingredients": ["Помилка розпізнавання", f"Деталі: {str(e)}"]}

@app.post("/api/generate-recipes", response_model=RecipeResponse)
async def generate_recipes(payload: GenerateRecipesRequest, db: Session = Depends(get_db)):
    sorted_ingredients = ",".join(sorted([i.lower().strip() for i in payload.ingredients]))

    cache_key = f"cache_strict_{payload.strict_mode}_{sorted_ingredients}"
    
    cached_result = db.query(RecipeCache).filter(RecipeCache.cache_key == cache_key).first()
    if cached_result:
        return json.loads(cached_result.response_json)
    
    try:
        recipes_data = await run_recipe_agent(payload)
        new_cache = RecipeCache(cache_key=cache_key, response_json=json.dumps(recipes_data))
        try:
            db.add(new_cache)
            db.commit()
        except Exception:
            db.rollback()
        return recipes_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Не вдалося згенерувати рецепти: {str(e)}")


# ── ЗАХИЩЕНІ УЛЮБЛЕНІ РЕЦЕПТИ (Тільки для авторизованих) ──

@app.post("/api/favorites")
# Зверни увагу: ми додали Depends(get_current_user), щоб дізнатися, ХТО зберігає рецепт
async def add_to_favorites(recipe: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe_id = str(recipe.get("id"))
    
    # Шукаємо, чи Є ЦЕЙ рецепт у ЦЬОГО користувача
    existing = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.recipe_id == recipe_id, 
        FavoriteRecipe.user_id == current_user.id
    ).first()
    
    if existing:
        return {"status": "already_exists", "message": "Рецепт вже в улюблених"}
    
    try:
        db_recipe = FavoriteRecipe(
            user_id=current_user.id, # Прив'язуємо рецепт до користувача
            recipe_id=recipe_id,
            title=recipe.get("title"),
            time=recipe.get("time"),
            calories=recipe.get("macros", {}).get("calories") or recipe.get("calories", 0),
            image_url=recipe.get("imageUrl", ""),
            recipe_json=json.dumps(recipe)
        )
        db.add(db_recipe)
        db.commit()
        return {"status": "success", "message": "Додано в улюблені!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Помилка бази даних: {str(e)}")

@app.get("/api/favorites")
async def get_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Віддаємо рецепти ТІЛЬКИ поточного користувача
        favorites = db.query(FavoriteRecipe).filter(FavoriteRecipe.user_id == current_user.id).all()
        return [json.loads(fav.recipe_json) for fav in favorites]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Помилка читання бази: {str(e)}")

@app.delete("/api/favorites/{recipe_id}")
async def remove_from_favorites(recipe_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Видаляємо рецепт ТІЛЬКИ якщо він належить поточному користувачу
    db_recipe = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.recipe_id == recipe_id,
        FavoriteRecipe.user_id == current_user.id
    ).first()
    
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Рецепт не знайдено")
    
    try:
        db.delete(db_recipe)
        db.commit()
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recipes.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── НОВА ТАБЛИЦЯ КОРИСТУВАЧІВ ──
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

# ── ОНОВЛЕНА ТАБЛИЦЯ УЛЮБЛЕНИХ РЕЦЕПТІВ ──
class FavoriteRecipe(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    # Зв'язок із користувачем!
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) 
    
    recipe_id = Column(String(100), index=True)
    title = Column(String(255), nullable=False)
    time = Column(String(50))
    calories = Column(Integer)
    image_url = Column(Text)
    recipe_json = Column(Text, nullable=False)

# ── Кеш генерацій (залишається без змін) ──
class RecipeCache(Base):
    __tablename__ = "recipe_cache"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), unique=True, index=True) 
    response_json = Column(Text, nullable=False) 

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
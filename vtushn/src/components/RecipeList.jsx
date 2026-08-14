import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Utensils, Clock, Flame, Sparkles, ChevronRight, Heart, Home } from "lucide-react";

export default function RecipeList({ recipes, strictMode = false, onNavigate, onBack }) { // 👈 Додали strictMode у пропси
  const [favoriteTitles, setFavoriteTitles] = useState([]);

  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavoriteTitles(savedFavorites.map(fav => fav.title));
  }, [recipes]);

  const handleSave = (e, recipe) => {
    e.stopPropagation();
    
    const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const isAlreadySaved = favoriteTitles.includes(recipe.title);

    let updatedFavorites = [];
    if (isAlreadySaved) {
      updatedFavorites = savedFavorites.filter(fav => fav.title !== recipe.title);
      setFavoriteTitles(prev => prev.filter(t => t !== recipe.title));
    } else {
      const recipeToSave = {
        ...recipe,
        savedWithStrictMode: strictMode, // 👈 ТЕПЕР ЗАПИСУЄТЬСЯ СПРАВЖНІЙ РЕЖИМ КОРИСТУВАЧА
        savedUserIngredients: [] 
      };
      updatedFavorites = [...savedFavorites, recipeToSave];
      setFavoriteTitles(prev => [...prev, recipe.title]);
    }

    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] px-5 pt-14 pb-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Назад</span>
        </button>

        <div className="flex gap-3">
          <a href="/" className="p-2.5 bg-[#111111] border border-gray-800 rounded-xl hover:bg-[#1A1A1A] transition active:scale-95">
            <Home className="w-5 h-5 text-gray-400 hover:text-white" />
          </a>
          <Link to="/profile" className="relative p-2.5 bg-[#111111] border border-gray-800 rounded-xl hover:bg-[#1A1A1A] transition active:scale-95">
            <Heart className="w-5 h-5 text-gray-400 hover:text-red-400" />
            {favoriteTitles.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight">Знайдені рецепти</h1>
        <p className="text-gray-500 text-sm mt-1">Ось що ми підібрали за твоїми інгредієнтами</p>
      </div>

      <div className="flex flex-col gap-5">
        {recipes.map((recipe) => {
          const calories = recipe.macros?.calories ?? recipe.calories ?? 0;
          const isSaved = favoriteTitles.includes(recipe.title) || recipe.isFavorite;

          return (
            <button
              key={recipe.id || recipe.title}
              onClick={() => onNavigate("detail", recipe)}
              className="relative bg-[#111111] border border-gray-800 rounded-3xl p-4 flex flex-col gap-4 text-left active:scale-[0.98] transition-all hover:border-gray-700 overflow-hidden"
            >
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#1A1A1A] border border-gray-800/50">
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Utensils className="w-10 h-10 text-gray-700" />
                  </div>
                )}
                <div onClick={(e) => handleSave(e, recipe)} className="absolute top-3 right-3 p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition z-10">
                  <Heart className={`w-5 h-5 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-white"}`} />
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 px-1">
                <h2 className="text-xl font-bold text-white leading-tight">{recipe.title}</h2>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              </div>

              {recipe.agentReason && (
                <div className="bg-[#1A1A1A] border border-gray-800/60 rounded-2xl p-3 flex gap-3 mx-1">
                  <Sparkles className="w-4 h-4 text-[#00C896] flex-shrink-0 mt-0.5" />
                  <p className="text-gray-400 text-xs leading-relaxed">{recipe.agentReason}</p>
                </div>
              )}

              <div className="flex items-center gap-5 px-2 mt-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">{recipe.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300 text-sm">{calories} ккал</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
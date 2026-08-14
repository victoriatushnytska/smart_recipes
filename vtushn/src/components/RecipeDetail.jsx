import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Check, 
  Clock, 
  Flame, 
  Dumbbell, 
  Sparkles,
  Utensils,
  Heart
} from "lucide-react";

const BASIC_STAPLES = ["сіль", "перець", "цукор", "олія", "вода", "оцет", "сода"];

export default function RecipeDetail({ recipe, userIngredients = [], strictMode: initialStrictMode, onBack }) {
  // Намагаємося дізнатися strictMode або з пропсів, або якщо він був збережений всередині самого рецепта
  const currentStrictMode = recipe.savedWithStrictMode ?? initialStrictMode ?? false;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState([]);

  // Перевіряємо при завантаженні, чи є ВЖЕ цей конкретний рецепт в localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const exists = savedFavorites.some((fav) => fav.title === recipe.title);
    setIsFavorite(exists);
  }, [recipe.title]);

  // Функція збереження/видалення з пам'яті браузера
  const toggleFavorite = () => {
    const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    
    if (isFavorite) {
      // Видаляємо
      const updated = savedFavorites.filter((fav) => fav.title !== recipe.title);
      localStorage.setItem("favorites", JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      // Зберігаємо ПОВНИЙ об'єкт рецепта + прикріплюємо поточний режим strictMode
      const recipeToSave = {
        ...recipe,
        savedWithStrictMode: currentStrictMode,
        savedUserIngredients: userIngredients // запам'ятовуємо інгредієнти користувача
      };
      savedFavorites.push(recipeToSave);
      localStorage.setItem("favorites", JSON.stringify(savedFavorites));
      setIsFavorite(true);
    }
  };

  // Функція обгортка для кнопки "Назад", щоб батьківський компонент дізнався про зміну статусу серця
  const handleBackClick = () => {
    if (typeof onBack === "function") {
      // Передаємо назву рецепта та його поточний статус обраного назад у список
      onBack(recipe.title, isFavorite);
    }
  };

  // Очищення тексту інгредієнтів
  const cleanedIngredients = (recipe.ingredients || []).map(ing => 
    ing.replace(/\(додатковий інгредієнт\)/gi, "")
       .replace(/\(за бажанням\)/gi, "")
       .trim()
  );

  // Використовуємо збережені інгредієнти, якщо відкрили з улюблених
  const activeUserIngredients = userIngredients.length > 0 ? userIngredients : (recipe.savedUserIngredients || []);

  // Сортування
  const available = currentStrictMode 
    ? cleanedIngredients 
    : cleanedIngredients.filter((ing) => {
        const isUserSelected = activeUserIngredients.some((userIng) =>
          ing.toLowerCase().includes(userIng.toLowerCase().trim())
        );
        const isStaple = BASIC_STAPLES.some((staple) => 
          ing.toLowerCase().includes(staple)
        );
        return isUserSelected || isStaple;
      });

  const toBuy = currentStrictMode 
    ? [] 
    : cleanedIngredients.filter((ing) => {
        const isUserSelected = activeUserIngredients.some((userIng) =>
          ing.toLowerCase().includes(userIng.toLowerCase().trim())
        );
        const isStaple = BASIC_STAPLES.some((staple) => 
          ing.toLowerCase().includes(staple)
        );
        return !isUserSelected && !isStaple;
      });

  const toggleIngredient = (ingName) => {
    setCheckedIngredients((prev) =>
      prev.includes(ingName) ? prev.filter((item) => item !== ingName) : [...prev, ingName]
    );
  };

  const calories = recipe.macros?.calories ?? recipe.calories ?? 0;
  const protein = recipe.macros?.protein ?? recipe.protein ?? "0г";

  const IngredientRow = ({ item }) => {
    const isChecked = checkedIngredients.includes(item);
    return (
      <button
        onClick={() => toggleIngredient(item)}
        className="flex items-center gap-4 p-4 rounded-2xl text-left transition-transform duration-300 active:scale-[0.98] bg-[#111111] w-full"
      >
        <div className={`w-6 h-6 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${isChecked ? "bg-[#00C896] border-[#00C896]" : "border-gray-600 bg-transparent"}`}>
          <Check className={`w-4 h-4 text-black transition-transform duration-500 ${isChecked ? "scale-100" : "scale-0"}`} strokeWidth={3} />
        </div>
        <div className="flex-1">
          <span className="relative inline-block text-sm">
            <span className={`transition-colors duration-[800ms] ${isChecked ? "text-gray-600" : "text-gray-200 font-medium"}`}>{item}</span>
            <span className={`absolute left-0 top-1/2 w-full h-[1.5px] rounded-full bg-gray-500 origin-left transition-all duration-[800ms] ${isChecked ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`} />
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] pb-32 overflow-y-auto">
      <div className="relative w-full h-72 bg-[#111111]">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center border-b border-gray-800">
            <Utensils className="w-12 h-12 text-gray-700 mb-2" />
            <span className="text-gray-600 text-[10px] font-mono uppercase tracking-widest">Зображення відсутнє</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
        
        {/* Замінили onClick={onBack} на onClick={handleBackClick} для розумної передачі стану */}
        <button
          onClick={handleBackClick}
          className="absolute top-14 left-5 w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white transition-transform active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 -mt-6 relative z-10">
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-6">{recipe.title}</h1>

        {recipe.agentReason && (
          <div className="mb-6 bg-[#00C896]/5 border border-[#00C896]/20 rounded-2xl p-4 flex gap-3">
            <Sparkles className="w-5 h-5 text-[#00C896] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[#00C896] tracking-wider uppercase mb-0.5">Рішення агента</span>
              <p className="text-gray-300 text-xs leading-relaxed">{recipe.agentReason}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-8">
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-3 flex flex-col gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-bold text-sm">{recipe.time}</span>
            </div>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-3 flex flex-col gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-white font-bold text-sm">{calories}</span>
            </div>
            <div className="bg-[#111111] border border-gray-800 rounded-2xl p-3 flex flex-col gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-white font-bold text-sm">{protein}</span>
            </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Чекліст інгредієнтів</h3>

          {available.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] text-green-400 font-mono tracking-widest uppercase mb-3 px-1">
                ✓ Вже є у вас (або базові)
              </p>
              <div className="flex flex-col gap-2.5">
                {available.map((item, idx) => (
                  <IngredientRow key={`av-${idx}`} item={item} />
                ))}
              </div>
            </div>
          )}

          {!currentStrictMode && toBuy.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] text-amber-400 font-mono tracking-widest uppercase mb-3 px-1">
                + Потрібно докупити
              </p>
              <div className="flex flex-col gap-2.5">
                {toBuy.map((item, idx) => (
                  <IngredientRow key={`buy-${idx}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-10">
          <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-4 font-mono px-1">Інструкція приготування</p>
          <div className="flex flex-col gap-5">
            {recipe.steps?.map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <span className="font-mono text-xs font-bold text-[#00C896] bg-[#00C896]/10 border border-[#00C896]/20 rounded-lg w-7 h-7 flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                <p className="text-gray-300 text-sm leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-5 pb-8 pt-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent z-40">
        <button
          onClick={toggleFavorite}
          className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
            isFavorite ? "bg-gray-800 text-white border border-gray-700" : "bg-[#00C896] text-black"
          }`}
        >
          <Heart className={`w-5 h-5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-black"}`} />
          {isFavorite ? "В обраному" : "Додати в обране"}
        </button>
      </div>
    </div>
  );
}
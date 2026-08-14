import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Utensils, Clock, Flame, Trash2, UserCircle, LogOut } from 'lucide-react';
import RecipeDetail from '../components/RecipeDetail';

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // ── 1. Декодуємо ім'я користувача з токена ──
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsername(payload.sub);
      } catch (e) {
        console.error("Помилка розшифровки токена:", e);
      }
    }

    // ── 2. Завантажуємо улюблені з localStorage ──
    loadFavoritesFromStorage();
  }, []);

  const loadFavoritesFromStorage = () => {
    setIsLoading(true);
    try {
      // Читаємо масив збережених рецептів, який ми налаштували в RecipeDetail
      const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
      setFavorites(saved);
    } catch (error) {
      console.error("Помилка при читанні з localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── 3. Видалення рецепта з улюблених ──
  const handleRemove = (e, recipeTitle) => {
    e.stopPropagation(); // Щоб не спрацьовував клік по самій картці (відкриття деталей)
    
    try {
      const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
      // Фільтруємо за унікальним заголовком страви
      const updated = saved.filter(recipe => recipe.title !== recipeTitle);
      
      // Перезаписуємо в пам'ять браузера
      localStorage.setItem("favorites", JSON.stringify(updated));
      setFavorites(updated);
    } catch (error) {
      console.error("Помилка при видаленні з localStorage:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  // Якщо користувач вибрав рецепт — рендеримо сторінку деталі
  if (selectedRecipe) {
    return (
      <RecipeDetail 
        recipe={selectedRecipe} 
        // Передаємо збережені інгредієнти користувача, щоб розумне сортування не збивалося
        userIngredients={selectedRecipe.savedUserIngredients || []}
        // Передаємо збережений режим суворості
        strictMode={selectedRecipe.savedWithStrictMode || false}
        onBack={() => {
          setSelectedRecipe(null);
          loadFavoritesFromStorage(); // Оновлюємо список на випадок, якщо користувач прибрав серце всередині деталей
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white px-5 pt-16 pb-10 relative">
      
      {/* НАВІГАЦІЯ */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black tracking-tight">Мій кабінет</h1>
        <Link to="/" className="p-3 bg-[#111111] border border-gray-800 rounded-2xl hover:bg-[#1A1A1A] transition shadow-sm active:scale-95">
          <Home className="w-5 h-5 text-gray-300" />
        </Link>
      </div>

      {/* КАРТКА КОРИСТУВАЧА */}
      <div className="bg-[#111111] border border-gray-800 rounded-3xl p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1A1A1A] border border-gray-700 rounded-full flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-[#00C896]" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Користувач</p>
            <p className="text-xl font-bold">{username || "Гість"}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 hover:bg-red-500/20 transition active:scale-95"
          title="Вийти з акаунту"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* РОЗДІЛ РЕЦЕПТІВ */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Utensils className="w-5 h-5 text-gray-400" />
          Збережені рецепти
        </h2>
      </div>

      {/* СПИСОК РЕЦЕПТІВ */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#00C896] border-t-transparent rounded-full animate-spin mb-4" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 bg-[#111111] border border-gray-800 border-dashed rounded-3xl mt-4">
          <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4 border border-gray-800">
            <Utensils className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Тут поки що порожньо</p>
          <p className="text-gray-600 text-sm mt-1">Збережи щось смачненьке!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {favorites.map((recipe, index) => {
            const calories = recipe.macros?.calories ?? recipe.calories ?? 0;

            return (
              <button
                key={`${recipe.title}-${index}`} // ✅ Унікальний ключ для React
                onClick={() => setSelectedRecipe(recipe)}
                className="relative bg-[#111111] border border-gray-800 rounded-3xl p-4 flex flex-col gap-4 text-left overflow-hidden hover:border-gray-700 transition active:scale-[0.98]"
              >
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#1A1A1A] border border-gray-800/50">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="w-10 h-10 text-gray-700" />
                    </div>
                  )}
                  
                  {/* Кнопка швидкого видалення */}
                  <div 
                    onClick={(e) => handleRemove(e, recipe.title)}
                    className="absolute top-3 right-3 p-2.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all group z-10"
                  >
                    <Trash2 className="w-5 h-5 text-gray-300 group-hover:text-red-400" />
                  </div>
                </div>

                <div className="px-1">
                  <h2 className="text-xl font-bold text-white leading-tight">{recipe.title}</h2>
                </div>

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
      )}
    </div>
  );
}
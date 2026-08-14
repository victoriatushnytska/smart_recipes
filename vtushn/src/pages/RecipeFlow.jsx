import { useState, useCallback } from "react";
import Home           from "../components/Home";
import ConfigureAgent from "../components/ConfigureAgent";
import ProcessingLog  from "../components/ProcessingLog";
import RecipeList     from "../components/RecipeList";
import RecipeDetail   from "../components/RecipeDetail";

export default function RecipeFlow() {
  const [screen,               setScreen]               = useState("home");
  const [history,              setHistory]              = useState(["home"]);
  const [detectedIngredients,  setDetectedIngredients]  = useState([]);
  
  const [agentConfig,          setAgentConfig]          = useState({ ingredients: [], goal: "high-protein", strictMode: false });
  
  const [generatedRecipes,     setGeneratedRecipes]     = useState([]);
  const [selectedRecipe,       setSelectedRecipe]       = useState(null);

  const navigate = useCallback(function navigate(target, data = null) {
    switch (target) {
      case "configure":
        if (data?.ingredients?.length) setDetectedIngredients(data.ingredients);
        break;
      case "processing":
        if (data) setAgentConfig({ 
          ingredients: data.ingredients ?? [], 
          goal: data.goal ?? "high-protein",
          strictMode: data.strictMode ?? false
        });
        break;
      case "recipes":
        if (data?.recipes?.length) setGeneratedRecipes(data.recipes);
        break;
      case "detail":
        if (data) setSelectedRecipe(data);
        break;
      default:
        break;
    }
    setHistory((prev) => [...prev, target]);
    setScreen(target);
  }, []);

  const goBack = useCallback(function goBack() {
    setHistory((prev) => {
      const next = prev.slice(0, -1);
      setScreen(next.at(-1) ?? "home");
      return next;
    });
  }, []);

  // ── РОЗУМНЕ ПОВЕРНЕННЯ З ЕКРАНА ДЕТАЛЕЙ ──
  const handleBackFromDetail = useCallback(function handleBackFromDetail(recipeTitle, isFavoriteNow) {
    // 1. Оновлюємо прапорець у списку згенерованих рецептів
    setGeneratedRecipes((prevRecipes) =>
      prevRecipes.map((recipe) => {
        if (recipe.title === recipeTitle) {
          return { ...recipe, isFavorite: isFavoriteNow };
        }
        return recipe;
      })
    );

    // 2. Робимо звичайний крок назад по історії екранів
    setHistory((prev) => {
      const next = prev.slice(0, -1);
      setScreen(next.at(-1) ?? "recipes"); // Якщо історія порожня, підстрахуємося екраном списку
      return next;
    });
    
    setSelectedRecipe(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center">
      <div
        className="w-full max-w-[400px] min-h-screen bg-[#0A0A0A] relative overflow-hidden"
        style={{ boxShadow: "0 0 80px rgba(0,200,150,0.06)" }}
      >
        {screen === "home" && (
          <Home onNavigate={navigate} />
        )}

        {screen === "configure" && (
          <ConfigureAgent
            initialIngredients={detectedIngredients}
            onNavigate={navigate}
            onBack={goBack}
          />
        )}

        {screen === "processing" && (
          <ProcessingLog
            ingredients={agentConfig.ingredients}
            goal={agentConfig.goal}
            strictMode={agentConfig.strictMode}
            onNavigate={navigate}
          />
        )}

        {screen === "recipes" && (
          <RecipeList
            recipes={generatedRecipes}
            strictMode={agentConfig.strictMode} // 👈 Обов'язково передаємо прапорець сюди!
            onNavigate={navigate}
            onBack={goBack}
          />
        )}
        
        {screen === "detail" && selectedRecipe && (
          <RecipeDetail 
            recipe={selectedRecipe} 
            userIngredients={agentConfig.ingredients}
            strictMode={agentConfig.strictMode}
            onBack={handleBackFromDetail} // 👈 ЗАМІНИЛИ goBack НА РОЗУМНУ ФУНКЦІЮ СИНХРОНІЗАЦІЇ СЕРДЕЧОК
          />
        )}
      </div>
    </div>
  );
}
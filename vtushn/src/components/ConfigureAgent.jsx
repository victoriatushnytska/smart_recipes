import { useState } from "react";
import { ArrowLeft, X, Check, Sparkles } from "lucide-react";
import { INITIAL_INGREDIENTS, AGENT_GOALS } from "../data/mockData";

export default function ConfigureAgent({ initialIngredients, onNavigate, onBack }) {
  // Use API-returned ingredients when available; fall back to Ukrainian mock list.
  const [ingredients, setIngredients] = useState(
    initialIngredients?.length > 0 ? initialIngredients : INITIAL_INGREDIENTS,
  );
  const [selectedGoal, setSelectedGoal] = useState("high-protein");
  
  // 👈 ДОДАЛИ СТАН ДЛЯ ГАЛОЧКИ
  const [isStrict, setIsStrict] = useState(false);

  function removeIngredient(item) {
    setIngredients((prev) => prev.filter((i) => i !== item));
  }

  function handleGenerate() {
    // 👈 ПЕРЕДАЄМО strictMode ДАЛІ
    onNavigate("processing", { 
      ingredients, 
      goal: selectedGoal,
      strictMode: isStrict 
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] pb-32">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 mb-6 active:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Назад</span>
        </button>
        <h1 className="text-2xl font-black text-white">Налаштування агента</h1>
        <p className="text-gray-500 text-sm mt-1">
          Уточни знайдені продукти та обери ціль
        </p>
      </div>

      {/* ── Detected ingredients ────────────────────────────────────── */}
      <div className="px-5 mt-4">
        <p className="text-xs text-gray-500 tracking-widest uppercase mb-3 font-mono">
          Знайдені інгредієнти ({ingredients.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {ingredients.map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 bg-[#1A1A1A] border border-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-full"
            >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                className="text-gray-500 hover:text-white transition-colors ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* ── Agent goals ─────────────────────────────────────────────── */}
      <div className="px-5 mt-8">
        <p className="text-xs text-gray-500 tracking-widest uppercase mb-3 font-mono">
          Цілі агента
        </p>
        <div className="flex flex-col gap-3">
          {AGENT_GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "border-[#00C896] bg-[#00C896]/8"
                    : "border-gray-800 bg-[#111111]"
                }`}
              >
                <span className="text-2xl">{goal.emoji}</span>
                <div className="text-left flex-1">
                  <p className={`font-semibold text-sm ${isSelected ? "text-white" : "text-gray-300"}`}>
                    {goal.label}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{goal.desc}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#00C896] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ДОДАТКОВІ НАЛАШТУВАННЯ (СТРОГИЙ РЕЖИМ) ────────────────── */}
      <div className="px-5 mt-6 mb-4">
        <div className="flex items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-gray-800">
          <input
            type="checkbox"
            id="strictMode"
            checked={isStrict}
            onChange={(e) => setIsStrict(e.target.checked)}
            className="w-5 h-5 accent-[#00C896] bg-[#1A1A1A] border-gray-700 cursor-pointer flex-shrink-0 rounded-sm"
          />
          <label htmlFor="strictMode" className="flex flex-col cursor-pointer select-none">
            <span className="text-gray-300 text-sm font-medium">Готувати тільки з наявного</span>
            <span className="text-gray-500 text-xs mt-0.5">Не пропонувати докупити інгредієнти</span>
          </label>
        </div>
      </div>

      {/* ── Sticky CTA ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-5 pb-8 pt-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent">
        <button
          onClick={handleGenerate}
          className="w-full bg-[#00C896] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-transform"
        >
          <Sparkles className="w-5 h-5" />
          Згенерувати рецепти
        </button>
      </div>
    </div>
  );
}
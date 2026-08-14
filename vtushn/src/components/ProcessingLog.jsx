import { useState, useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";
import { TERMINAL_LINES, FALLBACK_RECIPES } from "../data/mockData";

const API_BASE = "http://localhost:8000";

function normaliseRecipe(r) {
  return {
    ...r,
    calories: r.macros?.calories ?? r.calories,
    protein:  r.macros?.protein  ?? r.protein,
    fats:     r.macros?.fats     ?? r.fats,
    carbs:    r.macros?.carbs    ?? r.carbs,
  };
}

export default function ProcessingLog({ ingredients, goal, strictMode, onNavigate }) {
  const [lines, setLines] = useState([]);
  const [done,  setDone]  = useState(false);
  const [error, setError] = useState(null);
  const bottomRef         = useRef(null);

  const apiResult = useRef(null);
  const fetchStarted = useRef(false); // Запобіжник тільки для бекенду

  // ── ЕФЕКТ 1: Відправка запиту до бекенду (Спрацює суворо 1 раз) ──
  useEffect(() => {
    if (fetchStarted.current) return;
    fetchStarted.current = true;

    fetch(`${API_BASE}/api/generate-recipes`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ingredients, goal, strict_mode: strictMode }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Помилка сервера: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const recipes = (data.recipes ?? []).map(normaliseRecipe);
        apiResult.current = { success: true, recipes: recipes.length > 0 ? recipes : FALLBACK_RECIPES };
      })
      .catch((err) => {
        console.error("[vtushn] generate-recipes failed:", err);
        apiResult.current = { success: false, recipes: FALLBACK_RECIPES };
      });
  }, [ingredients, goal, strictMode]); 

  // ── ЕФЕКТ 2: Незалежна анімація терміналу ──
  useEffect(() => {
    let i = 0;
    const totalLines = TERMINAL_LINES?.length || 1;
    let isCancelled = false;

    const interval = setInterval(() => {
      if (isCancelled) {
        clearInterval(interval);
        return;
      }

      const timeStr = new Date().toLocaleTimeString('uk-UA', { hour12: false });
      const timePrefix = `[${timeStr}] > `;

      if (i < totalLines - 1) {
        // Друкуємо всі рядки, крім останнього
        const rawLine = TERMINAL_LINES[i] || "Завантаження...";
        const content = rawLine.includes(">") ? rawLine.split(">")[1].trim() : rawLine;
        
        setLines((prev) => [...prev, { time: timePrefix, text: content }]);
        i++;
      } else if (apiResult.current) {
        // Якщо дійшли до кінця І бекенд повернув відповідь
        const rawLine = TERMINAL_LINES[i] || "Рецепти підібрано. Готово.";
        const content = rawLine.includes(">") ? rawLine.split(">")[1].trim() : rawLine;
        
        setLines((prev) => [...prev, { time: timePrefix, text: content }]);
        setDone(true);
        clearInterval(interval);

        if (!apiResult.current.success) {
          setError("Сервер недоступний. Показуємо демо-рецепти.");
        }

        // Затримка перед переходом
        setTimeout(() => {
          if (!isCancelled) {
            onNavigate("recipes", { recipes: apiResult.current.recipes });
          }
        }, 1200);
      }
    }, 800);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [onNavigate]); 

  // Автоскрол
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const totalLines = TERMINAL_LINES?.length || 1;
  const progress   = Math.min(Math.round((lines.length / totalLines) * 100), 100);

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] px-5 pt-14 pb-10">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black text-white leading-none">Обробка</h1>
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C896] animate-pulse mt-1" />
        </div>
        <p className="text-gray-500 text-sm">Агент працює…</p>
      </div>

      <div className="bg-[#111111] border border-gray-800 rounded-2xl p-5 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="text-gray-600 text-xs font-mono ml-2">
            vtushn-agent — v1.0
          </span>
        </div>

        <div className="space-y-2">
          {lines.map((lineObj, idx) => (
            <p key={idx} className="font-mono text-xs leading-relaxed">
              <span className="text-gray-600">{lineObj.time} </span>
              <span className="text-[#00C896]">{lineObj.text}</span>
            </p>
          ))}

          {!done && (
            <span className="text-[#00C896] font-mono text-xs animate-pulse">▌</span>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-3 bg-amber-950/50 border border-amber-800/60 rounded-xl px-4 py-3">
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      <div className="mt-4 bg-[#111111] border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00C896] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-gray-500 text-xs font-mono">{progress}%</span>
      </div>
    </div>
  );
}
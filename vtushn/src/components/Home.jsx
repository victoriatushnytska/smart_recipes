import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Camera, Upload, ChevronRight, Loader2, WifiOff, User, X, Plus } from "lucide-react";

const API_BASE = "http://localhost:8000";

// ── ФУНКЦІЯ СТВОРЕННЯ КОЛАЖУ НА КЛІЄНТІ ──
const mergeImagesToCollage = async (files) => {
  const images = await Promise.all(
    Array.from(files).map((file) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => resolve(img);
      });
    })
  );

  const cols = Math.ceil(Math.sqrt(images.length));
  const rows = Math.ceil(images.length / cols);
  const maxImgSize = 600; 

  const canvas = document.createElement("canvas");
  canvas.width = cols * maxImgSize;
  canvas.height = rows * maxImgSize;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  images.forEach((img, i) => {
    const x = (i % cols) * maxImgSize;
    const y = Math.floor(i / cols) * maxImgSize;
    const size = Math.min(img.width, img.height);
    const startX = (img.width - size) / 2;
    const startY = (img.height - size) / 2;
    ctx.drawImage(img, startX, startY, size, size, x, y, maxImgSize, maxImgSize);
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], "collage.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.8);
  });
};

export default function Home({ onNavigate }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error,        setError]       = useState(null);
  
  // ── Стан для зберігання вибраних фотографій (до 5 шт) ──
  const [stagedFiles, setStagedFiles] = useState([]);

  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  // Додавання нових фото в "кошик"
  const handleFileSelected = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setStagedFiles((prev) => {
      const combined = [...prev, ...files];
      return combined.slice(0, 5); // Обмежуємо до 5 фото максимум
    });
    
    e.target.value = ""; // Скидаємо інпут
  };

  // Видалення конкретного фото з кошика
  const removeFile = (indexToRemove) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Фінальна відправка всіх зібраних фото на бекенд
  const handleAnalyze = async () => {
    if (stagedFiles.length === 0) return;
    
    setError(null);
    setIsAnalyzing(true);

    try {
      let finalFile;
      if (stagedFiles.length === 1) {
        finalFile = stagedFiles[0];
      } else {
        finalFile = await mergeImagesToCollage(stagedFiles);
      }

      const formData = new FormData();
      formData.append("file", finalFile);

      const response = await fetch(`${API_BASE}/api/analyze-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `Помилка сервера: ${response.status}`);
      }

      const data = await response.json();
      setIsAnalyzing(false);
      
      // Очищаємо кошик після успішного аналізу
      setStagedFiles([]);
      onNavigate("configure", { ingredients: data.ingredients ?? [] });

    } catch (err) {
      setIsAnalyzing(false);
      setError(
        err.message.startsWith("Помилка")
          ? err.message
          : "Не вдалося підключитися до сервера. Перевір, чи запущено бекенд на порту 8000.",
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] px-5 pt-16 pb-10 relative">

      {/* ── Приховані інпути ── */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* ── Екран аналізу (Оверлей) ── */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#00C896]/10 border border-[#00C896]/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#00C896] animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base">Аналіз зображень…</p>
            <p className="text-gray-500 text-sm mt-1">
              ШІ розпізнає твої інгредієнти
            </p>
          </div>
          <div className="flex gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#00C896] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Шапка ── */}
      <div className="mb-10 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
            <span className="text-xs text-gray-500 tracking-widest uppercase font-mono">
              ШІ АКТИВНИЙ
            </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            vtushn
          </h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">
            Відкривай рецепти за допомогою ШІ.
            <br />
            Скануй, що є — готуй, що хочеш.
          </p>
        </div>

        <Link 
          to="/profile" 
          className="p-3 bg-[#111111] border border-gray-800 rounded-2xl hover:bg-[#1A1A1A] transition active:scale-95 shadow-sm"
        >
          <User className="w-6 h-6 text-gray-300" />
        </Link>
      </div>

      {/* ── Помилка ── */}
      {error && (
        <div className="mb-4 flex items-start gap-3 bg-red-950/50 border border-red-800/60 rounded-2xl px-4 py-3">
          <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* ── СТАНДАРТНИЙ РЕЖИМ (0 ФОТО) ── */}
      {stagedFiles.length === 0 && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <button
            onClick={() => { setError(null); cameraInputRef.current?.click(); }}
            disabled={isAnalyzing}
            className="w-full bg-[#00C896] rounded-2xl p-6 flex items-center gap-5 shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <div className="bg-white/20 rounded-xl p-3">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-lg leading-tight">
                Сканувати інгредієнти
              </p>
              <p className="text-emerald-100 text-sm mt-0.5">
                Зроби фото, щоб розпочати
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 ml-auto" />
          </button>

          <button
            onClick={() => { setError(null); uploadInputRef.current?.click(); }}
            disabled={isAnalyzing}
            className="w-full border border-dashed border-gray-600 bg-[#111111] rounded-2xl p-6 flex items-center gap-5 active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <div className="bg-[#1A1A1A] rounded-xl p-3">
              <Upload className="w-7 h-7 text-gray-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-lg leading-tight">
                Завантажити фото
              </p>
              <p className="text-gray-500 text-sm mt-0.5">Вибрати з галереї</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 ml-auto" />
          </button>
        </div>
      )}

      {/* ── РЕЖИМ ПІДГОТОВКИ (Є ФОТО) ── */}
      {stagedFiles.length > 0 && (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[#111111] border border-gray-800 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold text-lg">Вибрані фото</h2>
            <span className="text-gray-400 text-sm font-mono">{stagedFiles.length} / 5</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {stagedFiles.map((file, index) => (
              <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-[#1A1A1A] border border-gray-800">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`preview-${index}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10 hover:bg-red-500/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}

            {stagedFiles.length < 5 && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-700 bg-[#1A1A1A]/50 hover:bg-[#1A1A1A] hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Ще фото</span>
              </button>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-[#00C896] text-black font-bold text-lg rounded-2xl p-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-transform"
          >
            <SparklesIcon /> Аналізувати {stagedFiles.length} фото
          </button>
        </div>
      )}

      {/* ── Футер ── */}
      <p className="text-center text-gray-600 text-xs mt-auto pt-8">
        Твої інгредієнти. Твої цілі. Без відходів.
      </p>
    </div>
  );
}

// Міні-іконка для красивої кнопки
function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4M3 5h4M19 3v4M17 5h4"/>
    </svg>
  );
}
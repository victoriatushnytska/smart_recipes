import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Додали імпорт ArrowLeft для кнопки Назад
import { Lock, User as UserIcon, Utensils, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const endpoint = isLogin ? '/api/login' : '/api/register';

    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Щось пішло не так");
      }

      if (isLogin) {
        localStorage.setItem('token', data.access_token);
        navigate('/');
      } else {
        setMessage('Успішно! Тепер увійдіть зі своїм логіном.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // Додали relative, щоб можна було абсолютно спозиціонувати кнопку Назад
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white px-5 pt-20 items-center relative">
      
      {/* ── Кнопка Назад ── */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-16 left-5 p-2.5 bg-[#111111] border border-gray-800 rounded-xl hover:bg-[#1A1A1A] transition active:scale-95 text-gray-400 hover:text-white flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mb-6 border border-gray-800 mt-4">
        <Utensils className="w-8 h-8 text-[#00C896]" />
      </div>
      
      <h1 className="text-3xl font-black mb-2 text-center">
        {isLogin ? 'З поверненням!' : 'Створити акаунт'}
      </h1>
      <p className="text-gray-500 text-sm mb-8 text-center">
        {isLogin ? 'Увійди, щоб бачити свої рецепти' : 'Зберігай улюблені рецепти назавжди'}
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        {error && <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl text-sm text-center">{error}</div>}
        {message && <div className="p-3 bg-green-500/10 border border-green-500/50 text-green-400 rounded-xl text-sm text-center">{message}</div>}

        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Логін"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#111111] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-[#00C896] transition-colors"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#111111] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-[#00C896] transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#00C896] text-black font-bold py-3.5 rounded-2xl mt-2 hover:bg-[#00b386] active:scale-[0.98] transition-all"
        >
          {isLogin ? 'Увійти' : 'Зареєструватися'}
        </button>
      </form>

      <button
        onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
        className="mt-6 text-gray-400 text-sm hover:text-white transition-colors"
      >
        {isLogin ? 'Немає акаунта? Створити' : 'Вже є акаунт? Увійти'}
      </button>
    </div>
  );
}
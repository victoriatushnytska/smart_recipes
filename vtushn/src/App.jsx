import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecipeFlow from './pages/RecipeFlow'; 
import Profile from './pages/Profile';
import Auth from './pages/Auth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Тепер за головним посиланням відкривається весь ланцюжок генерації */}
        <Route path="/" element={<RecipeFlow />} /> 
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}
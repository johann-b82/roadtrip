import { BrowserRouter, Routes, Route, Navigate } from 'react-router';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"><p className="text-white text-xl">Login page — coming in Plan 04</p></div>} />
        <Route path="/signup" element={<div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"><p className="text-white text-xl">Signup page — coming in Plan 04</p></div>} />
        <Route path="/dashboard" element={<div className="min-h-screen bg-slate-100 flex items-center justify-center"><p className="text-slate-800 text-xl">Dashboard — coming in Phase 2</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

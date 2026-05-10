import React, { createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { usePlayer } from './hooks/usePlayer';
import Navbar from './components/shared/Navbar';
import LoadingSpinner from './components/shared/LoadingSpinner';
import MiniPlayer from './components/player/MiniPlayer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import './styles/global.css';

// ─── Contexts ─────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);
export const PlayerContext = createContext(null);

export function useAuthContext() { return useContext(AuthContext); }
export function usePlayerContext() { return useContext(PlayerContext); }

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children }) {
  const { user } = useAuthContext();
  const player = usePlayerContext();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {user && <Navbar />}
      <main style={{ paddingBottom: player.currentTrack ? '100px' : 0 }}>
        {children}
      </main>
      {player.currentTrack && <MiniPlayer />}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();
  const player = usePlayer();

  return (
    <AuthContext.Provider value={auth}>
      <PlayerContext.Provider value={player}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/success" element={<AuthSuccessPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/discover" element={
                <ProtectedRoute><DiscoverPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </PlayerContext.Provider>
    </AuthContext.Provider>
  );
}

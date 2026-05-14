import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  AuthContext,
  PlayerContext,
  useAuth,
  usePlayer,
  useAuthCtx,
} from "./lib";
import { Navbar, MiniPlayer, Spinner } from "./components/UI";
import {
  HomePage,
  LoginPage,
  AuthSuccessPage,
  DashboardPage,
  DiscoverPage,
  ProfilePage,
} from "./components/Pages";
import "./styles/global.css";
function ProtectedRoute({ children }) {
  const { user, loading } = useAuthCtx();
  const location = useLocation();
  if (loading) return <Spinner fullPage />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
function Layout({ children }) {
  const { user } = useAuthCtx();
  const player = React.useContext(PlayerContext);
  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {user && <Navbar />}
      <main style={{ paddingBottom: player.currentTrack ? "80px" : 0 }}>
        {children}
      </main>
      {player.currentTrack && <MiniPlayer />}
    </div>
  );
}
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
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discover"
                element={
                  <ProtectedRoute>
                    <DiscoverPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </PlayerContext.Provider>
    </AuthContext.Provider>
  );
}

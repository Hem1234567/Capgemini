import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import HomePage from './pages/HomePage';
import AllGamesPage from './pages/AllGamesPage';
import HowToPlayPage from './pages/HowToPlayPage';
import PracticeTestPage from './pages/PracticeTestPage';
import ProgressPage from './pages/ProgressPage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import GameShell from './games/GameShell';
import AdminRoute from './components/Admin/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminActivityPage from './pages/admin/AdminActivityPage';

export default function App() {
  return (
    <div className="bg-page" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<AllGamesPage />} />
          <Route path="/how-to-play" element={<HowToPlayPage />} />
          <Route path="/how-to-play/:gameId" element={<HowToPlayPage />} />
          <Route path="/practice" element={<PracticeTestPage />} />
          <Route path="/practice/:gameId" element={<GameShell />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/activity" element={<AdminRoute><AdminActivityPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

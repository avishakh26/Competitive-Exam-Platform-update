import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import SubmissionsPage from './pages/SubmissionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/problems" replace />} />

        <Route
          path="problems"
          element={
            <ProtectedRoute allow={["user"]}>
              <ProblemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="problems/:id"
          element={
            <ProtectedRoute allow={["user"]}>
              <ProblemDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="submissions"
          element={
            <ProtectedRoute allow={["user"]}>
              <SubmissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leaderboard"
          element={
            <ProtectedRoute allow={["user"]}>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allow={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

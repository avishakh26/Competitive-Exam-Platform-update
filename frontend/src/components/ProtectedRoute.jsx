import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allow }) {
  const { loading, role } = useAuth();

  if (loading) {
    return <div className="screen-center">Loading...</div>;
  }

  if (!allow.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin' : '/login'} replace />;
  }

  return children;
}

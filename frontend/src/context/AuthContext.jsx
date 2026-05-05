import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('guest');
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);

  const refreshSession = async () => {
    const { data } = await api.get('/auth/session');
    setRole(data.role || 'guest');
    setUser(data.user || null);
    setAdmin(data.admin || null);
  };

  useEffect(() => {
    refreshSession()
      .catch(() => {
        setRole('guest');
        setUser(null);
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await api.post('/auth/logout');
    setRole('guest');
    setUser(null);
    setAdmin(null);
  };

  const value = useMemo(
    () => ({ loading, role, user, admin, refreshSession, logout }),
    [loading, role, user, admin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

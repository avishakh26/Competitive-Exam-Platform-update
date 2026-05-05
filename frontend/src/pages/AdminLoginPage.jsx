import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/admin/login', form);
      await refreshSession();
      navigate('/admin');
    } catch (err) {
      setError(err?.response?.data?.error || 'Admin login failed');
    }
  };

  return (
    <div className="card auth-card">
      <h2>Admin Login</h2>
      <form onSubmit={submit} className="form-grid">
        <input
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Login as Admin</button>
      </form>
      {error && <p className="error">{error}</p>}
      <Link to="/login">Back to user login</Link>
    </div>
  );
}

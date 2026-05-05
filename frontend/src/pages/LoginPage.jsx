import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [form, setForm] = useState({ studentId: '', password: '' });
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/login', form);
      await refreshSession();
      navigate('/problems');
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="card auth-card">
      <h2>User Login</h2>
      <form onSubmit={submit} className="form-grid">
        <input
          placeholder="Student ID"
          value={form.studentId}
          onChange={e => setForm({ ...form, studentId: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="auth-links">
        <Link to="/register">Create account</Link>
        <Link to="/admin/login">Admin login</Link>
      </div>
    </div>
  );
}

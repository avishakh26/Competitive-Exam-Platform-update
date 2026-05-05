import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="card auth-card">
      <h2>Create Account</h2>
      <form onSubmit={submit} className="form-grid">
        <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <input placeholder="Student ID" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} />
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <input
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
        />
        <button type="submit">Register</button>
      </form>
      {error && <p className="error">{error}</p>}
      <Link to="/login">Back to login</Link>
    </div>
  );
}

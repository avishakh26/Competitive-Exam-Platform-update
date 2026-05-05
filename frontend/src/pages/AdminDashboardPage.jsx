import { useEffect, useState } from 'react';
import api from '../api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [review, setReview] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [dashRes, reviewRes] = await Promise.all([api.get('/admin/dashboard'), api.get('/admin/review')]);
      setStats(dashRes.data.stats);
      setReview(reviewRes.data.submissions || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async id => {
    await api.post(`/admin/review/${id}/approve`, { feedback: 'Approved from React admin panel' });
    load();
  };

  const reject = async id => {
    await api.post(`/admin/review/${id}/reject`, { feedback: 'Rejected from React admin panel' });
    load();
  };

  return (
    <section>
      <h2>Admin Dashboard</h2>
      {error && <p className="error">{error}</p>}
      {stats && (
        <div className="grid">
          <div className="card">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
          <div className="card">
            <h3>Total Problems</h3>
            <p>{stats.totalProblems}</p>
          </div>
          <div className="card">
            <h3>Pending</h3>
            <p>{stats.pendingCount}</p>
          </div>
          <div className="card">
            <h3>Total Submissions</h3>
            <p>{stats.totalSubmissions}</p>
          </div>
        </div>
      )}

      <h3>Review Queue</h3>
      <div className="stack">
        {review.map(s => (
          <article className="card" key={s.id}>
            <h4>Submission #{s.id}</h4>
            <p>User: {s.username}</p>
            <p>Problem: {s.problemTitle}</p>
            <p>Status: {s.status}</p>
            <div className="actions">
              <button onClick={() => approve(s.id)}>Approve</button>
              <button className="danger" onClick={() => reject(s.id)}>
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

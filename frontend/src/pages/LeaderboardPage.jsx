import { useEffect, useState } from 'react';
import api from '../api';

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/leaderboard')
      .then(res => setUsers(res.data.users || []))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load leaderboard'));
  }, []);

  return (
    <section>
      <h2>Leaderboard</h2>
      {error && <p className="error">{error}</p>}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Student ID</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td>{u.username}</td>
                <td>{u.studentId}</td>
                <td>{u.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

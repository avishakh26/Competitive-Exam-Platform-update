import { useEffect, useState } from 'react';
import api from '../api';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/submissions/mine')
      .then(res => setSubmissions(res.data.submissions || []))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load submissions'));
  }, []);

  return (
    <section>
      <h2>My Submissions</h2>
      {error && <p className="error">{error}</p>}
      <div className="stack">
        {submissions.map(s => (
          <article className="card" key={s.id}>
            <h3>{s.problemTitle || `Problem ${s.problemId}`}</h3>
            <p>Status: {s.status}</p>
            <p>Feedback: {s.feedback || 'Not available'}</p>
            <p>Time: {s.timestamp || '-'}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function ProblemDetailPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .get(`/problems/${id}`)
      .then(res => setProblem(res.data.problem))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load problem'));
  }, [id]);

  const submitFile = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!file) {
      setError('Please choose a code file first.');
      return;
    }

    const form = new FormData();
    form.append('codeFile', file);

    try {
      const res = await api.post(`/problems/${id}/submit`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message || 'Submitted');
      const latest = await api.get(`/problems/${id}`);
      setProblem(latest.data.problem);
    } catch (err) {
      setError(err?.response?.data?.error || 'Submission failed');
    }
  };

  if (!problem) {
    return <div>Loading...</div>;
  }

  return (
    <section>
      <div className="card">
        <h2>{problem.title}</h2>
        <p>Difficulty: {problem.difficulty}</p>
        <p>Points: {problem.points}</p>
        <a href={`http://127.0.0.1:5000${problem.pdfUrl}`} target="_blank" rel="noreferrer">
          Open Problem PDF
        </a>
      </div>

      <div className="card">
        <h3>Submit Solution</h3>
        <p>Pending submission: {problem.hasPending ? 'Yes' : 'No'}</p>
        <form onSubmit={submitFile} className="form-grid">
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button type="submit" disabled={problem.hasPending}>Upload</button>
        </form>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

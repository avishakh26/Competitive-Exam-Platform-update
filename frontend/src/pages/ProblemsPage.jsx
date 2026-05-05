import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/problems')
      .then(res => setProblems(res.data.problems || []))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load problems'));
  }, []);

  return (
    <section>
      <h2>Problems</h2>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {problems.map(problem => (
          <article className="card" key={problem.id}>
            <h3>{problem.title}</h3>
            <p>Difficulty: {problem.difficulty}</p>
            <p>Points: {problem.points}</p>
            <Link to={`/problems/${problem.id}`}>View Details</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

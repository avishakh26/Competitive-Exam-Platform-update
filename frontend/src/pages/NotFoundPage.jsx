import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card">
      <h2>Page Not Found</h2>
      <Link to="/login">Go to Login</Link>
    </div>
  );
}

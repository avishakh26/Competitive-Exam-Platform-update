import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LightRays from './LightRays';

export default function Layout() {
  const { role, user, admin, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="light-rays-layer" aria-hidden="true">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="custom-rays"
        />
      </div>
      <header className="topbar">
        <div className="topbar-left">
          <h1>DSA Arena</h1>
          {role === 'user' && <p>User: {user?.username}</p>}
          {role === 'admin' && <p>Admin: {admin?.username}</p>}
        </div>
        <nav className="nav-links">
          {role === 'user' && (
            <>
              <Link to="/problems">Problems</Link>
              <Link to="/submissions">My Submissions</Link>
              <Link to="/leaderboard">Leaderboard</Link>
            </>
          )}
          {role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
          {role !== 'guest' && <button onClick={doLogout}>Logout</button>}
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

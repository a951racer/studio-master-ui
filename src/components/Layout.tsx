import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/clients', label: 'Clients' },
  { to: '/persons', label: 'People' },
  { to: '/admin', label: 'Admin' },
];

export default function Layout() {
  const clearToken = useAuthStore((s) => s.clearToken);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen bg-studio-cream bg-repeat"
      style={{ backgroundImage: "url('/wallpaper-bg.png')", backgroundSize: '600px' }}
    >
      {/* Top navigation bar */}
      <nav className="bg-studio-brown-dark border-b border-studio-brown shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo / App name */}
            <div className="flex items-center gap-8">
              <img src="/logo.png" alt="Studio Master logo" className="h-8 w-8" />
              <span className="text-lg font-bold text-studio-cream tracking-tight">
                Studio Master
              </span>

              {/* Nav links */}
              <div className="flex items-center gap-1">
                {navItems.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-studio-orange text-white'
                          : 'text-studio-tan hover:text-white hover:bg-studio-brown'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-studio-tan hover:text-white px-3 py-2 rounded hover:bg-studio-brown transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

import { FaBell } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';

/**
 * NavBar component for displaying top-level navigation.
 * Adjusts links based on authentication status.
 */
const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useNotifications();

  const navClasses =
    'w-full px-4 sm:px-6 lg:px-8 py-4 backdrop-blur border-b bg-accent-muted border-gray-200 dark:border-gray-700';

  return (
    <nav className={navClasses}>
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-12 xl:px-24 mx-auto flex items-center justify-between flex-wrap gap-4">

        {/* Logo or brand name linking to home */}
        <a href="/" className="text-xl font-bold tracking-tight text-accent">
          Ethos
        </a>

        {/* Navigation links – vary by user auth state */}
        <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
          {!user ? (
            // Guest user view
            <Link to="/login" className="hover:text-accent transition">
              Login
            </Link>
          ) : (
            // Authenticated user view
            <>
              <Link to="/notifications" className="relative hover:text-accent transition" aria-label="Notifications">
                <FaBell />
                {Array.isArray(notifications) && notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-2 -right-2 text-xs bg-red-600 text-white rounded-full px-1">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="hover:text-accent transition">
                Account
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="hover:underline text-left"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          )}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="px-2 py-1 rounded border text-xs sm:text-sm border-secondary"
          >
            {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
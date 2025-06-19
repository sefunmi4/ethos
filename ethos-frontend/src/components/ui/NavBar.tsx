import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import type { AuthContextType } from '../../types/authTypes';
import { logoutUser } from '../../utils/authUtils';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * NavBar component for displaying top-level navigation.
 * Adjusts links based on authentication status.
 */
const NavBar: React.FC = () => {
  // Access authenticated user context
  const { user } = useContext(AuthContext as React.Context<AuthContextType>);
  const { theme, toggleTheme } = useTheme();

  const navClasses =
    'w-full px-4 sm:px-6 lg:px-8 py-4 backdrop-blur border-b bg-soft dark:bg-soft-dark border-gray-200 dark:border-gray-700';

  return (
    <nav className={navClasses}>
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-12 xl:px-24 mx-auto flex items-center justify-between flex-wrap gap-4">

        {/* Logo or brand name linking to home */}
        <Link to="/" className="text-xl font-bold tracking-tight text-accent">
          Ethos
        </Link>

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
              <Link to="/profile" className="hover:text-accent transition">
                Account
              </Link>
              <button
                onClick={logoutUser}
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
            className="px-2 py-1 rounded border text-xs sm:text-sm border-gray-300 dark:border-gray-600"
          >
            {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
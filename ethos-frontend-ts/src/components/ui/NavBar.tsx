import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext} from '../../contexts/AuthContext';
import type { AuthContextType } from '../../types/authTypes';
import { logoutUser } from '../../utils/authUtils';

/**
 * NavBar component for displaying top-level navigation.
 * Adjusts links based on authentication status.
 */
const NavBar: React.FC = () => {
  // Access authenticated user context
  const { user } = useContext<AuthContextType>(AuthContext);

  return (
    <nav className="w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white backdrop-blur">
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-12 xl:px-24 mx-auto flex items-center justify-between flex-wrap gap-4">
        
        {/* Logo or brand name linking to home */}
        <Link to="/" className="text-xl font-bold tracking-tight">
          Ethos
        </Link>

        {/* Navigation links – vary by user auth state */}
        <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
          {!user ? (
            // Guest user view
            <Link to="/login" className="hover:text-indigo-600 transition">
              Login
            </Link>
          ) : (
            // Authenticated user view
            <>
              <Link to="/profile" className="hover:text-indigo-600 transition">
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
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
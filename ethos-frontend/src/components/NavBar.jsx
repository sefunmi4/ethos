import { useContext } from 'react';
import { Link } from 'react-router-dom'; 
import { AuthContext } from '../contexts/AuthContext';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white backdrop-blur">
      <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-12 xl:px-24 mx-auto flex items-center justify-between flex-wrap gap-4">
        <Link to="/" className="text-xl font-bold tracking-tight">Ethos</Link>
        <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
          {!user ? (
            <>
              <Link to="/login" className="hover:text-indigo-600 transition">Login</Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="hover:text-indigo-600 transition">Account</Link>
              <button onClick={logout} className="hover:underline">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
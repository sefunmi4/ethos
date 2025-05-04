// src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="p-4 bg-gray-900 text-white flex justify-between items-center">
      <Link to="/" className="text-xl font-bold">Ethos</Link>
      <div className="space-x-4">
        {!user ? (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/signup" className="hover:underline">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="hover:underline">Account</Link>
            <button onClick={logout} className="hover:underline">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
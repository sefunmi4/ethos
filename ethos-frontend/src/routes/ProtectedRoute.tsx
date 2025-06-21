import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContextBase';
import { Spinner } from '../components/ui';


/**
 * PrivateRoute is a wrapper for protected routes.
 * It checks the authentication state and:
 * - Shows a loading state if auth is still being verified
 * - Renders the protected route (Outlet) if authenticated
 * - Redirects to the login page if not authenticated
 */
const PrivateRoute: React.FC = () => {
  const context = useContext(AuthContext);
  if (!context) return <Navigate to="/login" replace />;
  const { user, loading } = context;

  if (loading) {
    return <Spinner />;
  }

  // If user is authenticated, render the nested route
  // Otherwise, redirect to the login page
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
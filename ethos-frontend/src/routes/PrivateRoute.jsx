// src/routes/PrivateRoute.jsx
import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;

};

export default PrivateRoute;
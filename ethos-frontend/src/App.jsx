import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Quest from './pages/Quest'; 
import NotFound from './pages/NotFound';

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import NavBar from './components/NavBar';
import PublicProfile from './pages/PublicProfile';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-white text-gray-900">
        <NavBar />
        <main className="flex-1 w-full">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/user/:userId" element={<PublicProfile />} /> 

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/quest/:id" element={<Quest />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} /> 
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
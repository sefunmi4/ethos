import { Routes, Route } from 'react-router-dom';
import Home from './pages/index';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Quest from './pages/quest/[id]';
import Post from './pages/post/[id]';
import Board from './pages/board/[id]';
import NotFound from './pages/NotFound';
import PublicProfile from './pages/PublicProfile';
import ResetPassword from './pages/ResetPassword';

import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import NavBar from './components/NavBar';

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
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/quest/:id" element={<Quest />} />
              <Route path="/post/:id" element={<Post />} />
              <Route path="/boards/:id" element={<Board />} />
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
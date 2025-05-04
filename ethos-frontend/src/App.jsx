import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import PostProblem from './pages/PostProblem';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './routes/PrivateRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Authenticated routes wrapped with AuthProvider */}
      <Route element={<AuthProvider><PrivateRoute /></AuthProvider>}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/post" element={<PostProblem />} />
      </Route>
    </Routes>
  );
}

export default App
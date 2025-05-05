import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import PostProblem from './pages/PostProblem';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import NavBar from './components/NavBar';

function App() {
  return (
    <AuthProvider>
      <NavBar /> {/* This now has access to AuthContext */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/post" element={<PostProblem />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
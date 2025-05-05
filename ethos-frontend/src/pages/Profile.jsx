import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext'; // assuming this exists
import ProblemCard from '../components/ProblemCard';   // reuses the existing UI

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProblems = async () => {
      try {
        const res = await axios.get(`/api/users/${user.id}/problems`);
        setProblems(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load your problems.');
      }
    };

    if (user) {
      fetchUserProblems();
    }
  }, [user]);

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div className="profile-container">
      <h2>{user.username}'s Profile</h2>
      <p>Email: {user.email}</p>

      <h3>Your Posted Problems</h3>
      {error && <p className="error">{error}</p>}
      {problems.length === 0 ? (
        <p>You haven't posted any problems yet.</p>
      ) : (
        problems.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))
      )}
    </div>
  );
};

export default Profile;
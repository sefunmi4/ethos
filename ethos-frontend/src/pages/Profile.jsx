import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import ProfileBanner from '../components/ProfileBanner';
import QuickInfoGrid from '../components/QuickInfoGrid';
import ProjectCard from '../components/ProjectCard';
import AddProjectModal from '../components/AddProjectModal';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}/projects`);
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
        setError('Oops. Could not load your quests.');
      }
    };

    if (user) fetchProjects();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <p className="text-lg text-gray-600">Log in to customize your journey.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* ✨ Identity Section */}
      <ProfileBanner user={user} />

      {/* 🧠 Quick Stats */}
      <QuickInfoGrid user={user} />

      {/* 🎒 Project Log */}
      <div className="mt-10 flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight">My Projects & Quests</h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900 transition"
        >
          + New Quest
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="grid gap-6 mt-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <p className="text-gray-500 col-span-full">No quests yet. Let’s build something epic.</p>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {/* ➕ Modal for Adding Project */}
      {showModal && (
        <AddProjectModal
          onClose={() => setShowModal(false)}
          onAdd={(newProject) => setProjects([...projects, newProject])}
        />
      )}
    </div>
  );
};

export default Profile;
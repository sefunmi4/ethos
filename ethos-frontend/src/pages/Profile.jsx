import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import ProfileBanner from '../components/ProfileBanner';
import QuickInfoGrid from '../components/QuickInfoGrid';
import ProjectCard from '../components/ProjectCard';
import AddProjectModal from '../components/AddProjectModal';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // ✅ Added Authorization header
        const res = await fetch(`/api/users/${user.id}/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        // ✅ Guard against non-JSON responses (fix for "<!doctype..." error)
        if (!res.ok || res.headers.get('Content-Type')?.includes('html')) {
          throw new Error('Invalid response format');
        }

        const data = await res.json();

        setProjects(data.projects || []);
        setTimeline(data.experienceTimeline || []);
        setNotes(data.privateData?.notes || []);
        setMessages(data.privateData?.messages || []);

        // ✅ Safely set editable fields
        setFormData({
          bio: data.bio || '',
          tags: data.tags || [],
          links: data.links || {
            github: '',
            linkedin: '',
            tiktok: '',
            website: ''
          }
        });

        // ✅ Also sync to user for View Mode to work
        setUser(prev => ({
          ...prev,
          bio: data.bio || '',
          tags: data.tags || [],
          links: data.links || {
            github: '',
            linkedin: '',
            tiktok: '',
            website: ''
          }
        }));
      } catch (err) {
        console.error(err);
        setError('Oops. Could not load your profile data.');
      }
    };

    if (user) fetchUserData();
  }, [user]);

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${user.id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updatedUser = await res.json();
      setUser(updatedUser);  // ✅ Sync AuthContext with updated info
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setError('Could not save changes.');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <p className="text-lg text-gray-600">Log in to customize your journey.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ProfileBanner user={user} />
  
      {/* ✏️ Edit Button */}
      <div className="flex flex-col justify-end mt-2 text-sm text-blue-600 hover:underline sm:items-end gap-2">
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Update Info
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
  
      {/* 👁️ View Mode */}
      {!editMode && (
        <>
          <QuickInfoGrid user={user} />
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Bio</h3>
            <p className="text-gray-700">{user.bio || formData?.bio || 'No bio set yet.'}</p>
  
            <h3 className="mt-4 text-lg font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2 text-sm text-white">
              {(user.tags || formData?.tags || []).map((tag, idx) => (
                <span key={idx} className="bg-indigo-600 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
  
            <h3 className="mt-4 text-lg font-semibold">Links</h3>
            <ul className="text-blue-600 underline space-y-1">
              {Object.entries(user.links || formData?.links || {}).map(([key, val]) => (
                val && (
                  <li key={key}>
                    <a href={val} target="_blank" rel="noreferrer">{key}</a>
                  </li>
                )
              ))}
            </ul>
          </div>
        </>
      )}
  
      {/* ✍️ Edit Mode */}
      {editMode && formData && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block font-medium">Bio</label>
            <textarea
              className="w-full border px-3 py-2 rounded"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>
  
          <div>
            <label className="block font-medium">Tags (comma-separated)</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={formData.tags.join(', ')}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })
              }
            />
          </div>
  
          <div>
            <label className="block font-medium mb-1">Links</label>
            {Object.entries(formData.links).map(([key, val]) => (
              <div key={key} className="mb-2">
                <input
                  className="w-full border px-3 py-2 rounded"
                  placeholder={`${key} URL`}
                  value={val}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      links: { ...formData.links, [key]: e.target.value }
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
  
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
  
      {/* ❌ Show error messages */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
  
      {/* 🧩 Project Cards */}
      <div className="grid gap-6 mt-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <p className="text-gray-500 col-span-full">No quests yet. Let’s build something epic.</p>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id || project._id} project={project} />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
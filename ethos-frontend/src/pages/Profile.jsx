import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

import ProfileBanner from '../components/ProfileBanner';
import QuestCard from '../components/QuestCard';
import PostEditor from '../components/PostEditor';
import PostTimeline from '../components/PostTimeline';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);

  const [quests, setQuests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false); // ✨ controls editor visibility

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (!res.ok || res.headers.get('Content-Type')?.includes('html')) {
          throw new Error('Invalid response format');
        }

        const data = await res.json();

        setQuests(data.quests || []);
        setPosts(data.posts || []);
        setRequests(data.requests || []);

        setFormData({
          bio: data.bio || '',
          links: data.links || {
            github: '',
            linkedin: '',
            tiktok: '',
            website: ''
          }
        });

        setUser(prev => ({
          ...prev,
          bio: data.bio || '',
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <p className="text-lg text-gray-600">Log in to customize your journey.</p>
      </div>
    );
  }

  const questLogs = posts.filter(p => p.type === 'quest_log');
  const nonQuestPosts = posts.filter(p => p.type !== 'quest_log');

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ProfileBanner user={user} />

      {/* 🧭 Active Quests */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Active Quests</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {quests.filter(q => q.status === 'active').map((quest) => {
            const latestLog = questLogs
              .filter(p => p.questId === quest.id)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            return (
              <QuestCard key={quest.id} quest={quest} latestLog={latestLog} />
            );
          })}
        </div>
      </section>

      {/* ✏️ New Post Button */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => setShowEditor(prev => !prev)}
        >
          {showEditor ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {/* 🧾 Post Editor */}
      {showEditor && (
        <PostEditor
          user={user}
          quests={quests}
          onPostCreated={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setShowEditor(false); // auto-close after post
          }}
        />
      )}

      {/* 🗓️ Post Timeline */}
      <section>
        <h2 className="text-xl font-bold mb-4">Timeline</h2>
        <PostTimeline
          user={user}
          posts={posts}
          setPosts={setPosts}
          emptyMessage="No posts available."
        />
      </section>
    </div>
  );
};

export default Profile;
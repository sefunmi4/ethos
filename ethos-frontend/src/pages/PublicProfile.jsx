// src/pages/PublicProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ProfileBanner from '../components/ProfileBanner';
import QuestCard from '../components/QuestCard';
import PostTimeline from '../components/PostTimeline';

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/profile`);
        if (!res.ok) throw new Error('Failed to load public profile');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError('Profile not found or inaccessible.');
      }
    };
    load();
  }, [userId]);

  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!profile) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  const questLogs = profile.posts.filter(p => p.type === 'quest_log');
  const otherPosts = profile.posts.filter(p => p.type !== 'quest_log');

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <ProfileBanner user={profile} readOnly />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Public Quests</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {profile.quests.map((quest) => {
            const latestLog = questLogs
              .filter(p => p.questId === quest.id)
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            return (
              <QuestCard key={quest.id} quest={quest} latestLog={latestLog} />
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Public Timeline</h2>
        <PostTimeline 
          user={user}
          posts={profile.posts} 
          emptyMessage="No posts available."
        />
      </section>
    </div>
  );
};

export default PublicProfile;
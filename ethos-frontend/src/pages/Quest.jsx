import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';


import PostTimeline from '../components/PostTimeline';
import PostEditor from '../components/PostEditor'; // optional for inline new log

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Quest = () => {
  const { id } = useParams(); // Quest ID from URL
  const [quest, setQuest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchQuest = async () => {
      try {
        const res = await fetch(`/api/quests/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (!res.ok) throw new Error('Failed to fetch quest');

        const data = await res.json();
        setQuest(data);
        setLogs(data.logs || []);
      } catch (err) {
        console.error('[QUEST FETCH ERROR]', err);
        setError('Could not load quest.');
      }
    };

    fetchQuest();
  }, [id]);

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading quest...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* 🧭 Quest Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-indigo-700">{quest.title}</h1>
        {quest.description && (
          <p className="mt-2 text-gray-600">{quest.description}</p>
        )}
        <div className="mt-1 text-sm text-gray-400 uppercase tracking-wider">
          Status: {quest.status}
        </div>
      </header>

      {/* 📝 New Log Editor (optional) */}
      <div className="mb-6">
        <PostEditor
          user={{ id: quest.authorId }} // or pass real user from context
          quests={[quest]}
          onPostCreated={(newPost) => {
            if (newPost.questId === quest.id) {
              setLogs(prev => [newPost, ...prev]);
            }
          }}
        />
      </div>

      {/* 📜 Quest Log Timeline */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quest Logs</h2> 
        <PostTimeline
          user={user}
          posts={posts}
          setPosts={setPosts}
          emptyMessage="No logs yet. Be the first to write one!"
        />
      </section>
    </div>
  );
};

export default Quest;
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { axiosWithAuth } from '../../utils/authUtils';
import { useAuth } from '../../contexts/AuthContext';
import QuestMapRenderer from '../../components/renderers/QuestMapRenderer';
import ThreadRenderer from '../../components/renderers/ThreadRenderer';
import PostCard from '../../components/posts/PostCard';
import QuestCard from '../../components/quests/QuestCard';

const QuestPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [quest, setQuest] = useState(null);
  const [questTree, setQuestTree] = useState([]);
  const [logPosts, setLogPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestData = async () => {
      try {
        const [questRes, treeRes, logsRes] = await Promise.all([
          axiosWithAuth.get(`/api/quests/${id}`),
          axiosWithAuth.get(`/api/quests/${id}/tree`),     // tree or graph data
          axiosWithAuth.get(`/api/posts/quest/${id}/logs`) // quest_log posts
        ]);

        setQuest(questRes.data);
        setQuestTree(treeRes.data || []);
        setLogPosts(logsRes.data || []);
      } catch (err) {
        console.error('Failed to load quest:', err);
        setError('This quest could not be loaded or is private.');
      }
    };

    fetchQuestData();
  }, [id]);

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!quest) {
    return <div className="p-6 text-center text-gray-500">Loading quest...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Quest Summary Header */}
      <QuestCard quest={quest} user={user} readOnly />

      {/* Quest Map (Tree Layout) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">🗺 Quest Map</h2>
        {questTree.length > 0 ? (
          <QuestMapRenderer items={questTree} rootId={id} />
        ) : (
          <p className="text-sm text-gray-500">This quest has no subtasks or branches yet.</p>
        )}
      </section>

      {/* Quest Log Timeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">📜 Quest Log</h2>
        {logPosts.length > 0 ? (
          <ThreadRenderer
            items={logPosts}
            rootId={logPosts[0].id}
            type="timeline"
            renderItem={(post) => (
              <PostCard key={post.id} post={post} user={user} compact />
            )}
          />
        ) : (
          <p className="text-sm text-gray-500">No quest logs yet. Start journaling progress.</p>
        )}
      </section>
    </main>
  );
};

export default QuestPage;
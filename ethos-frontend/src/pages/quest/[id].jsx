// src/pages/quest/[id].tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { axiosWithAuth } from '../../utils/authUtils';
import { useAuth } from '../../contexts/AuthContext';

import QuestMapRenderer from '../../components/renderers/QuestMapRenderer';
import ThreadRenderer from '../../components/renderers/ThreadRenderer';
import PostCard from '../../components/posts/PostCard';
import QuestCard from '../../components/quests/QuestCard';
import CreateContribution from '../../components/contribution/CreateContribution';

import type { Quest } from '../../types/quests';
import type { Post } from '../../types/posts';
import type { TreeNode } from '../../types/tree';

/**
 * QuestPage component displays a full-page view of a specific quest.
 * It includes the quest summary, a tree-structured quest map, and a timeline-style log of progress.
 */
const QuestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [questTree, setQuestTree] = useState<TreeNode[]>([]);
  const [logPosts, setLogPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>('');
  const [showCreate, setShowCreate] = useState<boolean>(false);

  /**
   * Fetches quest details, quest tree structure, and associated log posts.
   */
  useEffect(() => {
    const fetchQuestData = async () => {
      try {
        const [questRes, treeRes, logsRes] = await Promise.all([
          axiosWithAuth.get<Quest>(`/api/quests/${id}`),
          axiosWithAuth.get<TreeNode[]>(`/api/quests/${id}/tree`),
          axiosWithAuth.get<Post[]>(`/api/posts/quest/${id}/logs`)
        ]);

        setQuest(questRes.data);
        setQuestTree(treeRes.data || []);
        setLogPosts(logsRes.data || []);
      } catch (err) {
        console.error('[QuestPage] Failed to load quest data:', err);
        setError('This quest could not be loaded or is private.');
      }
    };

    if (id) fetchQuestData();
  }, [id]);

  /**
   * Handles the addition of a new log post.
   * @param newPost - The newly created post to prepend to the log.
   */
  const handleNewLog = (newPost: Post) => {
    setLogPosts([newPost, ...logPosts]);
    setShowCreate(false);
  };

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
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">📜 Quest Log</h2>
          {user && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showCreate ? 'Cancel' : '+ Add Log Entry'}
            </button>
          )}
        </div>

        {showCreate && (
          <div className="border rounded p-4 bg-white shadow">
            <CreateContribution
              typeOverride="post"
              quests={[quest]}
              onSave={handleNewLog}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {logPosts.length > 0 ? (
          <ThreadRenderer
            items={logPosts}
            rootId={logPosts[0].id}
            type="timeline"
            renderItem={(post: Post) => (
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
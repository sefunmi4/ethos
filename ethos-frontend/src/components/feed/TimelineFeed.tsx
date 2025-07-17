import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchActiveQuests } from '../../api/quest';
import {
  fetchPostsByQuestId,
  fetchPostsByBoardId,
} from '../../api/post';
import { Spinner } from '../ui';
import CreatePost from '../post/CreatePost';
import { Button } from '../ui';

import type { Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';
import type { User } from '../../types/userTypes';

const PostCard = lazy(() => import('../post/PostCard'));

interface TimelineFeedProps {
  boardId?: string;
}

const TimelineFeed: React.FC<TimelineFeedProps> = ({ boardId = 'timeline-board' }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const quests = await fetchActiveQuests(user.id);
        const questPosts = await Promise.all(
          quests.map(q => fetchPostsByQuestId(q.id))
        );
        const myPosts = await fetchPostsByBoardId('my-posts', user.id);
        const combined = [
          ...myPosts,
          ...questPosts.flat(),
        ];
        const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
        unique.sort((a, b) =>
          (b.timestamp || '').localeCompare(a.timestamp || '')
        );
        setItems(unique);
      } catch (err) {
        console.warn('[TimelineFeed] Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleAdd = (post: Post | Quest) => {
    setItems(prev => [post as Post, ...prev]);
    setShowForm(false);
  };

  if (!user) return null;
  if (loading) return <Spinner />;

  if (items.length === 0) {
    return (
      <div className="text-center text-secondary py-12 text-sm">No activity yet.</div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <CreatePost
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
          boardId={boardId}
        />
      )}
      <div className="text-right">
        <Button variant="contrast" onClick={() => setShowForm((p) => !p)}>
          {showForm ? '- Cancel Post' : '+ Add Post'}
        </Button>
      </div>
      <div className="grid gap-4 overflow-auto max-h-[65vh] snap-y snap-mandatory p-2">
        <Suspense fallback={<Spinner />}>
          {items.map(item => (
            <div key={item.id} className="snap-start">
              <PostCard post={item} user={user as User} />
            </div>
          ))}
        </Suspense>
      </div>
    </div>
  );
};

export default TimelineFeed;

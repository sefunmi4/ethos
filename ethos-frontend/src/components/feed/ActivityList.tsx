import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRecentPosts } from '../../api/post';
import { Spinner } from '../ui';
import PostListItem from '../post/PostListItem';
import type { Post } from '../../types/postTypes';

const ActivityList: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const recent = await fetchRecentPosts(user.id);
        setPosts(recent);
      } catch (err) {
        console.warn('[ActivityList] Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return null;
  if (loading) return <Spinner />;
  if (posts.length === 0)
    return <div className="text-center text-secondary py-12 text-sm">No activity yet.</div>;

  return (
    <div>
      {posts.map((p) => (
        <PostListItem key={p.id} post={p} />
      ))}
    </div>
  );
};

export default ActivityList;

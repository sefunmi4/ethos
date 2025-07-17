import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRecentPosts } from '../../api/post';
import PostCard from '../post/PostCard';
import { Spinner } from '../ui';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

const ActivityFeed: React.FC = () => {
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
        console.warn('[ActivityFeed] Failed to load recent posts:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return null;
  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {posts.map(p => (
        <PostCard key={p.id} post={p} user={user as User} />
      ))}
    </div>
  );
};

export default ActivityFeed;

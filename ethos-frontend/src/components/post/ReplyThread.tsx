import React, { useEffect, useState } from 'react';
import PostCard from './PostCard';
import { fetchRepliesByPostId } from '../../api/post';
import { Spinner } from '../ui';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';

interface ReplyThreadProps {
  postId: string;
  user?: User;
}

const ReplyThread: React.FC<ReplyThreadProps> = ({ postId, user }) => {
  const [replies, setReplies] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchRepliesByPostId(postId)
      .then(setReplies)
      .finally(() => setLoaded(true));
  }, [postId]);

  if (!loaded) return <Spinner />;
  if (replies.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 border-l-2 border-blue-200 pl-4">
      {replies.map((r) => (
        <PostCard key={r.id} post={r} user={user} compact />
      ))}
    </div>
  );
};

export default ReplyThread;

import React, { useEffect, useState } from 'react';
import PostCard from './PostCard';
import { fetchRepliesByPostId } from '../../api/post';
import { Spinner } from '../ui';
import type { Post } from '../../types/postTypes';
import type { User } from '../../types/userTypes';
import { useSocket } from '../../hooks/useSocket';

interface ReplyThreadProps {
  postId: string;
  user?: User;
}

const ReplyThread: React.FC<ReplyThreadProps> = ({ postId, user }) => {
  const [replies, setReplies] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchRepliesByPostId(postId)
      .then(setReplies)
      .finally(() => setLoaded(true));
  }, [postId]);

  useEffect(() => {
    if (!socket) return;
    const room = `post-${postId}`;
    const handleJoinRequestUpdate = (payload: { postId: string; status: string }) => {
      setReplies(prev =>
        prev.map(r => (r.id === payload.postId ? { ...r, status: payload.status } : r))
      );
    };
    socket.emit('join', { room });
    socket.on('join_request:update', handleJoinRequestUpdate);
    return () => {
      socket.emit('leave', { room });
      socket.off('join_request:update', handleJoinRequestUpdate);
    };
  }, [socket, postId]);

  if (!loaded) return <Spinner />;
  if (replies.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 border-l-2 border-blue-200 pl-4">
      {replies.map(r => {
        const eventType = (r as any).system_event;
        if (eventType === 'join_request') {
          const status = ((r as any).status || 'Pending') as string;
          const username = r.author?.username || 'unknown';
          return (
            <div key={r.id} className="text-sm text-secondary italic">
              @{username} requested to join this task • {status}
            </div>
          );
        }
        return <PostCard key={r.id} post={r} user={user} compact />;
      })}
    </div>
  );
};

export default ReplyThread;

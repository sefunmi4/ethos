import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Board from '../../components/boards/Board';
import { useSocket } from '../../hooks/useSocket';
import { usePost } from '../../hooks/usePost';

import type { Post } from '../../types/postTypes';
import type { BoardData } from '../../types/boardTypes';

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { socket } = useSocket();

  const [post, setPost] = useState<Post | null>(null);
  const [replyBoard, setReplyBoard] = useState<BoardData | null>(null);
  const [viewMode, setViewMode] = useState<'thread' | 'timeline'>('thread');
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPostData = usePost(id, {
    onPost: setPost,
    onBoard: setReplyBoard,
    onError: setError,
    setPage,
    setHasMore,
  });

  const loadMoreReplies = useCallback(async () => {
    if (!id || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/boards/thread/${id}?enrich=true&page=${page + 1}`);
      const data: BoardData = await res.json();
      if (data.items?.length) {
        setReplyBoard(prev =>
          prev
            ? {
                ...prev,
                items: [...prev.items, ...data.items],
                enrichedItems: [...(prev.enrichedItems ?? []), ...(data.enrichedItems ?? [])],
              }
            : data
        );
        setPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('[PostPage] Pagination failed:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [id, page, hasMore, loadingMore]);

  useEffect(() => {
    if (id) fetchPostData();
  }, [id, fetchPostData]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join', { room: `post-${id}` });
    socket.on('post:update', fetchPostData);
    return () => {
      socket.emit('leave', { room: `post-${id}` });
      socket.off('post:update', fetchPostData);
    };
  }, [socket, id, fetchPostData]);

  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!post) return <div className="text-center py-12 text-gray-500">Loading post...</div>;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-12">
      {post.repostedFrom && (
        <section className="border-l-4 border-gray-300 pl-4 mb-4 text-sm text-gray-500">
          ♻️ Reposted from @{post.repostedFrom.username}
        </section>
      )}

      {/* 🎯 Primary Post Card via Board */}
      <section>
        <Board
          board={{
            id: `post-${post.id}`,
            title: 'Post',
            structure: 'list',
            items: [post],
            enrichedItems: [post],
          }}
          editable={false}
          compact={false}
        />
      </section>

      {/* 💬 Replies View Toggle */}
      {replyBoard?.items?.length > 0 && (
        <div className="flex justify-end mb-4 text-sm text-gray-600 gap-2">
          <button
            className={`px-3 py-1 rounded ${viewMode === 'thread' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setViewMode('thread')}
          >
            Thread View
          </button>
          <button
            className={`px-3 py-1 rounded ${viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setViewMode('timeline')}
          >
            Timeline View
          </button>
        </div>
      )}

      {/* 🧵 Replies */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💬 Replies</h2>
        {replyBoard ? (
          <Board
            board={replyBoard}
            structure={viewMode}
            onScrollEnd={loadMoreReplies}
            loading={loadingMore}
            editable={false}
            compact={true}
          />
        ) : (
          <p className="text-sm text-gray-500">No replies yet.</p>
        )}
      </section>
    </main>
  );
};

export default PostPage;
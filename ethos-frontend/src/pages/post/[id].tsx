import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Board from '../../components/board/Board';
import { createMockBoard } from '../../utils/boardUtils';
import { useSocket } from '../../hooks/useSocket';

import { fetchPostById, fetchReplyBoard } from '../../api/post';

import type { Post } from '../../types/postTypes';
import type { BoardData } from '../../types/boardTypes';

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { socket } = useSocket();

  const [post, setPost] = useState<Post | null>(null);
  const [replyBoard, setReplyBoard] = useState<BoardData | null>(null);
  const [viewMode, setViewMode] = useState<'thread' | 'grid'>('thread');
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPostData = useCallback(async () => {
    if (!id) return;
    try {
      const post = await fetchPostById(id);
      setPost(post);

      const board = await fetchReplyBoard(id, {
        enrich: true,
        page: 1,
      });
      setReplyBoard(board);

      setPage(1);
      setHasMore(true);
    } catch (err) {
      console.error('[PostPage] Failed to fetch post or replies:', err);
      setError('Failed to load post');
    }
  }, [id]);

  const loadMoreReplies = useCallback(async () => {
    if (!id || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const board = await fetchReplyBoard(id, {
        enrich: true,
        page: nextPage,
      });

      if (board.items?.length) {
        setReplyBoard(prev =>
          prev
            ? {
                ...prev,
                items: [...prev.items, ...board.items],
                enrichedItems: [...(prev.enrichedItems ?? []), ...(board.enrichedItems ?? [])],
              }
            : board
        );
        setPage(nextPage);
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

      <section>
        <Board
          board={createMockBoard(`post-${post.id}`, 'Post', [post])}
          editable={false}
          compact={false}
        />
      </section>

      {(replyBoard?.items?.length ?? 0) > 0 && (
        <div className="flex justify-end mb-4 text-sm text-gray-600 gap-2">
          <button
            className={`px-3 py-1 rounded ${viewMode === 'thread' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setViewMode('thread')}
          >
            Thread View
          </button>
          <button
            className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setViewMode('grid')}
          >
            Timeline View
          </button>
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💬 Replies</h2>
        {replyBoard ? (
          <Board
            boardId={`thread-${id}`}
            board={replyBoard}
            layout={viewMode}
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
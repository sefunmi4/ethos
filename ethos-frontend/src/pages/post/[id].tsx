import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Board from '../../components/board/Board';
import PostCard from '../../components/post/PostCard';
import CreatePost from '../../components/post/CreatePost';
import { useSocket } from '../../hooks/useSocket';
import { Spinner } from '../../components/ui';
import type { User } from '../../types/userTypes';
import { useAuth } from '../../contexts/AuthContext';

import { ROUTES } from '../../constants/routes';

import { fetchPostById, fetchReplyBoard } from '../../api/post';
import { DEFAULT_PAGE_SIZE } from '../../constants/pagination';

import type { Post, PostType } from '../../types/postTypes';
import type { BoardData } from '../../types/boardTypes';
import QuestNodeInspector from '../../components/quest/QuestNodeInspector';
import GitFileBrowserInline from '../../components/git/GitFileBrowserInline';
import TeamPanel from '../../components/quest/TeamPanel';

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTypeParam = searchParams.get('initialType') as PostType | null;
  const introParam = searchParams.get('intro') === '1';

  const [post, setPost] = useState<Post | null>(null);
  const [replyBoard, setReplyBoard] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [parentPost, setParentPost] = useState<Post | null>(null);

  const boardWithPost = useMemo<BoardData | null>(() => {
    if (!replyBoard || !post) return null;
    return {
      ...replyBoard,
      title: replyBoard.title || 'Thread',
      items: [post.id, ...(replyBoard.items || [])],
      enrichedItems: [post, ...(replyBoard.enrichedItems ?? [])],
    };
  }, [replyBoard, post]);

  const taskBoard = useMemo<BoardData | null>(() => {
    if (!replyBoard) return null;
    const tasks =
      replyBoard.enrichedItems?.filter(
        (item): item is Post => 'type' in item && (item as Post).type === 'task'
      ) || [];
    if (!tasks.length) return null;
    return {
      ...replyBoard,
      items: tasks.map(t => t.id),
      enrichedItems: tasks,
    };
  }, [replyBoard]);

  useEffect(() => {
    if (searchParams.get('reply') === '1') {
      setShowReplyForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (post?.tags?.includes('review') && post.replyTo) {
      fetchPostById(post.replyTo)
        .then(setParentPost)
        .catch(() => setParentPost(null));
    } else {
      setParentPost(null);
    }
  }, [post]);

  const fetchPostData = useCallback(async () => {
    if (!id) return;
    try {
      const post = await fetchPostById(id);
      setPost(post);

      const board = await fetchReplyBoard(id, {
        enrich: true,
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
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
        limit: DEFAULT_PAGE_SIZE,
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
  if (!post) return <Spinner />;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-12 bg-soft dark:bg-soft-dark text-primary">
      <section>
        {post.repostedFrom && (
          <div className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 mb-4 text-sm text-secondary">
            ♻️ Reposted from @{post.repostedFrom.username}
          </div>
        )}
        <PostCard post={post} showDetails />
        {showReplyForm && (
          <div className="mt-4">
            <CreatePost
              replyTo={post}
              initialType={initialTypeParam || undefined}
              initialContent={
                introParam && user
                  ? `Hi @${post.author?.username}, I'm @${user.username} and would like to join.`
                  : undefined
              }
              onSave={() => {
                setShowReplyForm(false);
                navigate(ROUTES.POST(post.id), { replace: true });
                fetchPostData();
              }}
              onCancel={() => {
                setShowReplyForm(false);
                navigate(ROUTES.POST(post.id), { replace: true });
              }}
            />
          </div>
        )}
      </section>

      <section>
        {post.tags?.includes('request') && taskBoard && (
          <Board
            boardId={`tasks-${id}`}
            board={taskBoard}
            layout="grid"
            editable={false}
            compact={true}
            user={user as User}
          />
        )}
        {post.type === 'task' && post.questId && (
          <div className="grid md:grid-cols-2 gap-4">
            <QuestNodeInspector questId={post.questId} node={post} user={user as User} showPost={false} />
            <div className="space-y-4">
              <GitFileBrowserInline questId={post.questId} />
              <TeamPanel questId={post.questId} node={post} canEdit={!!user} />
            </div>
          </div>
        )}
        {post.type === 'change' && post.questId && (
          <GitFileBrowserInline questId={post.questId} />
        )}
        {post.tags?.includes('review') && parentPost && (
          <PostCard post={parentPost} />
        )}
      </section>

      <section>
        {boardWithPost ? (
          <Board
            boardId={`thread-${id}`}
            board={boardWithPost}
            layout="grid"
            onScrollEnd={loadMoreReplies}
            loading={loadingMore}
            editable={false}
            compact={true}
            user={user as User}
          />
        ) : (
          <Spinner />
        )}
      </section>
    </main>
  );
};

export default PostPage;
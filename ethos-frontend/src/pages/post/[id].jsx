// src/pages/posts/[id].jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '../../components/posts/PostCard';
import Board from '../../components/boards/Board';
import BoardItemCard from '../../components/boards/BoardItemCard';
import ThreadRenderer from '../../components/renderers/ThreadRenderer';
import { axiosWithAuth } from '../../utils/authUtils';

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('thread'); // 'thread' | 'timeline'

  useEffect(() => {
    const fetchPostAndReplies = async () => {
      try {
        const postRes = await axiosWithAuth.get(`/api/posts/${id}`);
        const replyRes = await axiosWithAuth.get(`/api/posts/${id}/replies`);

        setPost(postRes.data);
        setReplies(replyRes.data || []);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post.');
      }
    };

    fetchPostAndReplies();
  }, [id]);

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!post) {
    return <div className="text-center py-12 text-gray-500">Loading post...</div>;
  }

  const isQuestLog = post.type === 'quest_log';
  const linkedThread = post.links?.find(l => l.type === 'thread');

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 space-y-12">
      {/* 🔁 Repost Chain */}
      {post.repostedFrom && (
        <section className="border-l-4 border-gray-300 pl-4 mb-4 text-sm text-gray-500">
          ♻️ Reposted from @{post.repostedFrom.username}
        </section>
      )}

      {/* 🧾 Original Post */}
      <section>
        <PostCard post={post} user={post.author} />
      </section>

      {/* 🧭 View Mode Toggle */}
      {replies.length > 0 && (
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

      {/* 💬 Replies */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💬 Replies</h2>

        {isQuestLog || linkedThread ? (
          // ✅ Structured thread view
          <Board
            board={{
              id: `thread-${post.id}`,
              title: 'Replies',
              structure: 'thread',
              items: replies.map(r => r.id)
            }}
            structure="thread"
            renderItem={(item) => (
              <BoardItemCard key={item.id} item={item} user={post.author} />
            )}
          />
        ) : viewMode === 'thread' ? (
          <Board
            board={{
              id: `replies-${post.id}`,
              title: 'Replies',
              structure: 'thread',
              items: replies.map(r => r.id)
            }}
            structure="thread"
            renderItem={(item) => (
              <BoardItemCard key={item.id} item={item} user={post.author} />
            )}
          />
        ) : (
          <ThreadRenderer
            items={replies}
            rootId={replies[0]?.id || null}
            type="timeline"
            renderItem={(reply) => (
              <PostCard key={reply.id} post={reply} user={reply.author} compact />
            )}
          />
        )}
      </section>
    </main>
  );
};

export default PostPage;
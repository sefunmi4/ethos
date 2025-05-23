import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BoardProvider } from '../../contexts/BoardContext';
import PostCard from '../../components/posts/PostCard';
import Board from '../../components/boards/Board';
import BoardItemCard from '../../components/boards/BoardItemCard';

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostAndReplies = async () => {
      try {
        const postRes = await axios.get(`/api/posts/${id}`);
        const replyRes = await axios.get(`/api/posts/${id}/replies`);
        setPost(postRes.data);
        setReplies(replyRes.data);
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

  return (
    <BoardProvider initialStructure="thread">
      <main className="container mx-auto max-w-3xl px-4 py-10">
        {/* Original Post */}
        <section className="mb-10">
          <PostCard post={post} user={post.author} />
        </section>

        {/* Threaded Replies */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💬 Thread</h2>
          <Board
            board={{
              id: `thread-${post.id}`,
              title: 'Replies',
              structure: 'thread',
              items: replies,
            }}
            structure="thread"
            renderItem={(reply) => (
              <BoardItemCard
                key={reply.id}
                title={reply.title || 'Reply'}
                subtitle={reply.type}
                data={reply}
              />
            )}
          />
        </section>
      </main>
    </BoardProvider>
  );
};

export default PostPage;
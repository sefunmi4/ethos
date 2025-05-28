import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostCard from '../../components/posts/PostCard';
import Board from '../../components/boards/Board';
import BoardItemCard from '../../components/boards/BoardItemCard';
import { axiosWithAuth } from '../../utils/authUtils';

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [replyIds, setReplyIds] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostAndReplies = async () => {
      try {
        const postRes = await axiosWithAuth.get(`/api/posts/${id}`);
        const replyRes = await axiosWithAuth.get(`/api/posts/${id}/replies`);

        setPost(postRes.data);
        setReplyIds(replyRes.data.map(r => r.id)); // Only use reply IDs
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
            items: replyIds,
          }}
          structure="thread"
          renderItem={(item) => (
            <BoardItemCard
              key={item.id}
              title={item.title || 'Reply'}
              subtitle={item.type}
              data={item}
            />
          )}
        />
      </section>
    </main>
  );
};

export default PostPage;
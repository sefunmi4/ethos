import React, { useEffect, useState, useContext } from 'react';
import PostTimeline from '../components/PostTimeline';
import { AuthContext } from '../contexts/AuthContext';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        if (!res.ok) throw new Error('Failed to fetch posts');
        const data = await res.json();
        const publicPosts = data.filter(post => post.visibility === 'public');
        setPosts(publicPosts.reverse()); // newest first
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not load posts');
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Welcome to Ethos
          </h1>
          <p className="mt-6 text-base sm:text-lg text-gray-600">
            A network for creators, developers, makers, and dreamers.
          </p>
          <p className="text-sm sm:text-md text-gray-500 mt-2">
            Explore. Connect. Take on real-world quests.
          </p>
        </div>
      </section>

      {/* Public Posts */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 ">Latest Posts</h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}     
          <PostTimeline
            user={user}
            posts={posts}
            setPosts={setPosts}
            emptyMessage="No posts available."
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
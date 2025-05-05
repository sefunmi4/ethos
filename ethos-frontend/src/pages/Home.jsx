// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import Navbar from '../components/NavBar';
import getProblems from '../api/problems';

const Home = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const data = await getProblems();
        setProblems(data);
      } catch (err) {
        setError('Failed to load quests.');
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Navbar />

      {/* Hero Banner */}
      <section className="text-center py-12 bg-white shadow-md">
        <h1 className="text-3xl font-bold">Welcome to Ethos</h1>
        <p className="mt-2 text-lg text-gray-600">
          A guild hall for creators, developers, dreamers, and doers.
        </p>
        <p className="text-gray-500">
          Explore. Connect. Take on real-world quests.
        </p>
      </section>

      {/* Call to Action */}
      <div className="text-center mt-8">
        <a
          href="/post"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          ➕ Post a New Quest
        </a>
      </div>

      {/* Open Quests */}
      <section className="max-w-5xl mx-auto mt-10 px-4">
        <h2 className="text-xl font-semibold mb-4">Open Quests</h2>

        {loading ? (
          <p>Loading quests...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : problems.length === 0 ? (
          <p>No quests available. Be the first to post one!</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {problems.map((problem) => (
              <div key={problem._id} className="bg-white p-4 rounded shadow">
                <h3 className="font-bold">{problem.title}</h3>
                <p className="text-sm text-gray-600">{problem.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Starter Quests */}
      <section className="max-w-4xl mx-auto mt-12 px-4">
        <h2 className="text-lg font-semibold mb-2">Starter Quests</h2>
        <ul className="list-disc pl-6 text-sm text-gray-700">
          <li>Create your adventurer profile</li>
          <li>React to or comment on a quest</li>
          <li>Complete the intro scavenger hunt (coming soon)</li>
        </ul>
      </section>

      {/* Adventurer Spotlight */}
      <section className="max-w-5xl mx-auto mt-12 px-4">
        <h2 className="text-lg font-semibold mb-2">Adventurer Spotlight</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="bg-white p-4 rounded shadow w-60">
            <h3 className="font-semibold">Maya the Maker</h3>
            <p className="text-xs text-gray-500">Creative Tech Builder</p>
          </div>
          <div className="bg-white p-4 rounded shadow w-60">
            <h3 className="font-semibold">Zeke the Zero-to-One</h3>
            <p className="text-xs text-gray-500">Product Dev Explorer</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto mt-16 px-4 mb-20">
        <details className="bg-white p-4 rounded shadow">
          <summary className="font-medium cursor-pointer">
            ❓ What is Ethos and how does it work?
          </summary>
          <div className="mt-2 text-sm text-gray-700 space-y-2">
            <p>
              <strong>Ethos</strong> is a modern-day adventurer's guild. Post
              real-life requests (quests), or find collaborators to solve them.
            </p>
            <p>
              You can <em>gain experience</em> from participating, grow your
              profile, and eventually form or join guilds with others.
            </p>
            <p>
              No pressure. No info dumps. Explore at your own pace — and learn
              as you go.
            </p>
          </div>
        </details>
      </section>
    </div>
  );
};

export default Home;

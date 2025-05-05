// src/pages/Home.jsx
import { useEffect, useState } from 'react';
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
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Welcome to Ethos
          </h1>
          <p className="mt-6 text-base sm:text-lg text-gray-600">
            A guild hall for creators, developers, dreamers, and doers.
          </p>
          <p className="text-sm sm:text-md text-gray-500 mt-2">
            Explore. Connect. Take on real-world quests.
          </p>
          <a
            href="/post"
            className="inline-block mt-8 bg-black text-white font-medium px-6 py-3 rounded-full hover:bg-gray-900 transition-all"
          >
            ➕ Post a New Quest
          </a>
        </div>
      </section>

      {/* Open Quests */}
      <section className="px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-8">Open Quests</h2>
          {loading ? (
            <p className="text-center text-gray-500">Loading quests...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : problems.length === 0 ? (
            <p className="text-center text-gray-500">No quests yet. Be the first to post one!</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr">
              {problems.map((problem) => (
                <div
                  key={problem._id}
                  className="bg-gray-50 p-5 rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-lg">{problem.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{problem.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Starter Quests */}
      <section className="max-w-4xl mx-auto mt-20 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Starter Quests</h2>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
            <li>Create your adventurer profile</li>
            <li>React to or comment on a quest</li>
            <li>Complete the intro scavenger hunt (coming soon)</li>
          </ul>
        </div>
      </section>

      {/* Adventurer Spotlight */}
      <section className="max-w-4xl mx-auto mt-20 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Adventurer Spotlight</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-gray-100 p-4 rounded-lg w-[clamp(8rem,20vw,14rem)] text-center">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">Maya the Maker</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Creative Tech Builder</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg w-[clamp(8rem,20vw,14rem)] text-center">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">Zeke the Zero-to-One</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Product Dev Explorer</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-3xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 pb-32">
        <details className="bg-white p-6 rounded-xl shadow-sm">
          <summary className="font-medium cursor-pointer text-lg text-gray-800">
            ❓ What is Ethos and how does it work?
          </summary>
          <div className="mt-4 text-sm text-gray-700 space-y-3">
            <p>
              <strong>Ethos</strong> is a modern-day adventurer's guild. Post real-life requests
              (quests), or find collaborators to solve them.
            </p>
            <p>
              You can <em>gain experience</em> from participating, grow your profile, and eventually
              form or join guilds with others.
            </p>
            <p>No pressure. No info dumps. Explore at your own pace — and learn as you go.</p>
          </div>
        </details>
      </section>
    </div>
  );
};

export default Home;
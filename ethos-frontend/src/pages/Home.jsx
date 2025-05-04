// src/pages/Home.jsx
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Navbar from '../components/NavBar';

const Home = () => {
  const { user } = useContext(AuthContext);

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

      {/* Preview Quests */}
      <section className="max-w-5xl mx-auto mt-10 px-4">
        <h2 className="text-xl font-semibold mb-4">Open Quests</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Placeholder Cards */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">🎤 Host a local open mic night</h3>
            <p className="text-sm text-gray-600">Looking for a venue partner & social media help</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">📹 Document a maker's journey</h3>
            <p className="text-sm text-gray-600">Need a videographer to follow a creative week</p>
          </div>
        </div>
      </section>

      {/* Starter Quests (XP grinding) */}
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
            <p><strong>Ethos</strong> is a modern-day adventurer's guild. Post real-life requests (quests), or find collaborators to solve them.</p>
            <p>You can <em>gain experience</em> from participating, grow your profile, and eventually form or join guilds with others.</p>
            <p>No pressure. No info dumps. Explore at your own pace — and learn as you go.</p>
          </div>
        </details>
      </section>
    </div>
  );
};

export default Home;
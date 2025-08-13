import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import RecentActivityBoard from '../components/feed/RecentActivityBoard';
import { Spinner } from '../components/ui';
import QuestBoard from '../components/quest/QuestBoard';


const HomePage: React.FC = () => {
  const { loading: authLoading } = useAuth();


  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl space-y-12 bg-soft dark:bg-soft-dark text-primary">
      <header className="mb-4">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">
          Welcome to Ethos
        </h1>
        <p className="text-lg text-secondary">
          A place to explore ideas, share quests, and collaborate.
        </p>
      </header>

      <QuestBoard />

      <RecentActivityBoard />

    </main>
  );
};

export default HomePage;

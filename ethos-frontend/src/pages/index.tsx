import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBoardContext } from '../contexts/BoardContext';
import RecentActivityBoard from '../components/feed/RecentActivityBoard';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { BOARD_PREVIEW_LIMIT } from '../constants/pagination';
import { Spinner } from '../components/ui';
import { getRenderableBoardItems } from '../utils/boardUtils';


const HomePage: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { boards } = useBoardContext();

  const timelineBoard = boards['timeline-board'];


  const timelineItems = useMemo(
    () => getRenderableBoardItems(timelineBoard?.enrichedItems || []),
    [timelineBoard?.enrichedItems]
  );

  const showTimelineSeeAll = timelineItems.length >= BOARD_PREVIEW_LIMIT;

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

      {/* <section className="space-y-4">
    quest board
      </section> */}

      <section>
        <h2 className="text-xl font-semibold mb-2">⏳ Recent Activity</h2>
        <RecentActivityBoard />
        {showTimelineSeeAll && (
          <div className="text-right">
            <Link to={ROUTES.BOARD('timeline-board')} className="text-blue-600 underline text-sm">
              → See all
            </Link>
          </div>
        )}
      </section>

    </main>
  );
};

export default HomePage;

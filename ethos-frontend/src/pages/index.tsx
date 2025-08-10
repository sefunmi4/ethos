import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBoardContext } from '../contexts/BoardContext';
import Board from '../components/board/Board';
import PostTypeFilter from '../components/board/PostTypeFilter';
import RecentActivityBoard from '../components/feed/RecentActivityBoard';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { BOARD_PREVIEW_LIMIT } from '../constants/pagination';
import { Spinner } from '../components/ui';
import { getRenderableBoardItems } from '../utils/boardUtils';

import type { User } from '../types/userTypes';

const HomePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { boards } = useBoardContext();
  const [postType, setPostType] = useState('');

  const questBoard = boards['quest-board'];
  const timelineBoard = boards['timeline-board'];

  const questItems = useMemo(
    () => getRenderableBoardItems(questBoard?.enrichedItems || []),
    [questBoard?.enrichedItems]
  );

  const timelineItems = useMemo(
    () => getRenderableBoardItems(timelineBoard?.enrichedItems || []),
    [timelineBoard?.enrichedItems]
  );

  const showQuestSeeAll = questItems.length > BOARD_PREVIEW_LIMIT;
  const showTimelineSeeAll = timelineItems.length >= BOARD_PREVIEW_LIMIT;

  const postTypes = useMemo(() => {
    if (!questItems.length) return [] as string[];
    const types = new Set<string>();
    questItems.forEach((it) => {
      if ('type' in it) types.add((it as { type?: string }).type as string);
    });
    return Array.from(types);
  }, [questItems]);
  const showPostFilter = postTypes.length > 1 && questItems.length > 0;
  const hasQuestItems = questItems.length > 0;
  const hasTimelineItems = timelineItems.length > 0;

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

      {hasQuestItems && (
        <section className="space-y-4">
          {showPostFilter && (
            <PostTypeFilter value={postType} onChange={setPostType} />
          )}
          <Board
            boardId="quest-board"
            title="🗺️ Quest Board"
            layout="grid"
            gridLayout="horizontal"
            compact
            user={user as User}
            hideControls
            filter={postType ? { postType } : {}}
          />
          {showQuestSeeAll && (
            <div className="text-right">
              <Link to={ROUTES.BOARD('quest-board')} className="text-blue-600 underline text-sm">
                → See all
              </Link>
            </div>
          )}
        </section>
      )}

      {hasTimelineItems && (
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
      )}

    </main>
  );
};

export default HomePage;

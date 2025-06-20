import React, { useEffect, useState } from 'react';
import { fetchFeaturedQuests } from '../../api/quest';
import type { Quest } from '../../types/questTypes';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Spinner } from '../ui';

interface QuestWithScore extends Quest {
  popularity?: number;
}

const FeaturedQuestBoard: React.FC = () => {
  const [quests, setQuests] = useState<QuestWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchFeaturedQuests();
        setQuests(data || []);
      } catch (err) {
        console.error('[FeaturedQuestBoard] Failed to load quests', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-2">
      {quests.map(q => (
        <div key={q.id} className="p-2 border rounded bg-surface dark:bg-background">
          <Link to={ROUTES.QUEST(q.id)} className="font-semibold text-blue-600 underline">
            {q.title}
          </Link>
          {typeof q.popularity === 'number' && (
            <span className="ml-2 text-sm text-secondary">Score: {q.popularity}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default FeaturedQuestBoard;

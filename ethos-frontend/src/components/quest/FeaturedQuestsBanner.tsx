import React from 'react';
import { Link } from 'react-router-dom';
import type { Quest } from '../../types/questTypes';

interface FeaturedQuestsBannerProps {
  /** Array of public quest objects */
  quests: Quest[];
}

/**
 * Simple banner displaying up to three featured quests.
 * Each quest card shows the title, creator, status and a short summary.
 */
const FeaturedQuestsBanner: React.FC<FeaturedQuestsBannerProps> = ({ quests }) => {
  const featured = quests.slice(0, 3);

  const summarize = (desc?: string) => {
    if (!desc) return 'No summary available.';
    const trimmed = desc.trim();
    return trimmed.length > 100 ? trimmed.slice(0, 97) + '…' : trimmed;
  };

  const statusLabel = (q: Quest) => (q.status === 'active' ? 'Open' : 'Closed');

  return (
    <div className="bg-accent-muted p-4 rounded-lg shadow">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {featured.map((q) => (
          <Link
            key={q.id}
            to={`/quest/${q.id}`}
            className="block hover:shadow-lg transition-shadow"
          >
            <div className="h-full border border-secondary rounded-md bg-surface dark:bg-background p-4 flex flex-col">
              <h3 className="font-semibold text-primary text-lg mb-1">{q.title}</h3>
              <div className="text-sm text-secondary mb-2">@{q.authorId}</div>
              <span className="text-xs font-medium text-secondary mb-2">
                {statusLabel(q)}
              </span>
              <p className="text-sm text-primary flex-grow">{summarize(q.description)}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-right mt-4">
        <Link to="/board/quests" className="text-blue-600 hover:underline">
          → See more
        </Link>
      </div>
    </div>
  );
};

export default FeaturedQuestsBanner;

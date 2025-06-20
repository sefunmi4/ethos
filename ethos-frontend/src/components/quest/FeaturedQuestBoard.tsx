import React, { useEffect, useState, useRef, useMemo } from 'react';
import { fetchFeaturedQuests } from '../../api/quest';
import type { Quest } from '../../types/questTypes';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Spinner } from '../ui';

interface QuestWithScore extends Quest {
  popularity?: number;
}

const CARD_WIDTH = 240; // px
const GAP = 16; // px gap between cards

const FeaturedQuestBoard: React.FC = () => {
  const [quests, setQuests] = useState<QuestWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const maxDots = 5;
  const visibleIndices = useMemo(() => {
    const total = quests.length;
    const count = Math.min(maxDots, total);
    let start = Math.max(0, Math.min(current - Math.floor(count / 2), total - count));
    return Array.from({ length: count }, (_, i) => start + i);
  }, [current, quests]);

  const scrollToIndex = (idx: number) => {
    const el = containerRef.current;
    if (!el) return;
    const offset = (CARD_WIDTH + GAP) * idx - el.clientWidth / 2 + CARD_WIDTH / 2;
    el.scrollTo({ left: offset, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToIndex(current);
  }, [current]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (CARD_WIDTH + GAP));
    if (idx !== current) setCurrent(idx);
  };

  return (
    <div>
      <div className="relative overflow-hidden">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4"
        >
          {quests.map((q, idx) => (
            <div
              key={q.id}
              className={
                'snap-center flex-shrink-0 w-60 transition-all duration-300 ' +
                (idx === current ? 'opacity-100 scale-100' : Math.abs(idx - current) === 1 ? 'opacity-80 scale-95' : 'opacity-50 scale-90')
              }
            >
              <div className="p-4 border rounded bg-surface dark:bg-background w-full">
                <Link to={ROUTES.QUEST(q.id)} className="font-semibold text-blue-600 underline">
                  {q.title}
                </Link>
                {typeof q.popularity === 'number' && (
                  <div className="text-sm text-secondary mt-1">Score: {q.popularity}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-soft to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-soft to-transparent" />
      </div>
      <div className="flex justify-center mt-3 gap-2">
        {visibleIndices.map(i => (
          <button
            key={i}
            className={
              'h-2 w-2 rounded-full transition-all ' +
              (i === current ? 'bg-accent opacity-100' : 'bg-secondary/40 opacity-70')
            }
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedQuestBoard;

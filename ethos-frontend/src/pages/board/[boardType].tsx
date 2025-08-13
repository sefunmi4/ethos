import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAllQuests, fetchActiveQuests } from '../../api/quest';
import { fetchAllPosts } from '../../api/post';
import ContributionCard from '../../components/contribution/ContributionCard';
import QuestSummaryCard from '../../components/quest/QuestSummaryCard';
import { Spinner, Button } from '../../components/ui';
import type { Quest } from '../../types/questTypes';
import type { Post } from '../../types/postTypes';

const PAGE_SIZE = 12;

const BoardTypePage: React.FC = () => {
  const { boardType } = useParams<{ boardType: string }>();
  const [items, setItems] = useState<(Post | Quest)[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [compact, setCompact] = useState(false);
  const loader = useRef<HTMLDivElement | null>(null);

  // Fetch data based on board type
  useEffect(() => {
    const load = async () => {
      if (!boardType) return;
      setLoading(true);
      try {
        if (boardType === 'quests' || boardType === 'active') {
          if (boardType === 'active') {
            const active = await fetchActiveQuests();
            setItems(active);
          } else {
            const quests = await fetchAllQuests();
            setItems(quests);
          }
        } else if (boardType === 'requests') {
          const posts = await fetchAllPosts();
          setItems(posts.filter(p => p.tags?.includes('request') || p.helpRequest));
        } else {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [boardType]);

  // Infinite scroll
  useEffect(() => {
    const node = loader.current;
    if (!node) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1);
      }
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const visible = items.slice(0, page * PAGE_SIZE);

  if (loading) return <Spinner />;

  if (!['quests', 'requests', 'active'].includes(boardType || '')) {
    return <div className="p-6 text-red-500">Invalid board type.</div>;
  }

  return (
    <main className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold capitalize">{boardType}</h1>
        <Button variant="secondary" size="sm" onClick={() => setCompact(c => !c)}>
          {compact ? 'Grid View' : 'List View'}
        </Button>
      </div>
      <div
        className={
          compact
            ? 'flex flex-col gap-4'
            : 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {visible.map(it =>
          !compact && (it as Quest).headPostId ? (
            <QuestSummaryCard key={(it as Quest).id} quest={it as Quest} />
          ) : (
            <ContributionCard key={(it as Post).id} contribution={it as Post} compact={compact} />
          )
        )}
      </div>
      {visible.length < items.length && <div ref={loader} className="h-4" />}
    </main>
  );
};

export default BoardTypePage;

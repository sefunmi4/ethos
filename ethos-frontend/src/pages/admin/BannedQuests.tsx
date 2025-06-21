import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAllQuests } from '../../api/quest';
import type { Quest } from '../../types/questTypes';
import QuestCard from '../../components/quest/QuestCard';
import { Spinner } from '../../components/ui';

const BannedQuestsPage: React.FC = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAllQuests();
        setQuests(data.filter(q => q.approvalStatus === 'banned'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (user?.role !== 'moderator' && user?.role !== 'admin') {
    return <div>Forbidden</div>;
  }

  if (loading) return <Spinner />;

  return (
    <main className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Banned Quests</h1>
      {quests.map(q => (
        <QuestCard key={q.id} quest={q} defaultExpanded />
      ))}
      {quests.length === 0 && <p>No banned quests.</p>}
    </main>
  );
};

export default BannedQuestsPage;

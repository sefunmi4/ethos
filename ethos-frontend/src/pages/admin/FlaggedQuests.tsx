import React, { useEffect, useState } from 'react';
import { fetchAllQuests } from '../../api/quest';
import { useAuth } from '../../contexts/AuthContext';
import ModReviewPanel from '../../components/mod/ModReviewPanel';
import type { Quest } from '../../types/questTypes';
import { Spinner } from '../../components/ui';

const FlaggedQuestsPage: React.FC = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAllQuests();
        setQuests(data.filter(q => q.approvalStatus === 'flagged'));
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
      <h1 className="text-2xl font-bold">Flagged Quests</h1>
      {quests.map(q => (
        <ModReviewPanel key={q.id} quest={q} onUpdated={() => {}} />
      ))}
      {quests.length === 0 && <p>No flagged quests.</p>}
    </main>
  );
};

export default FlaggedQuestsPage;

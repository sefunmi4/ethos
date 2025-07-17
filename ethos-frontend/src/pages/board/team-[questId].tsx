import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchQuestById } from '../../api/quest';
import { fetchUserById } from '../../api/auth';
import { Spinner, AvatarStack } from '../../components/ui';

interface Collaborator {
  userId?: string;
  username?: string;
  roles?: string[];
  avatarUrl?: string;
}

const TeamBoardPage: React.FC = () => {
  const { questId } = useParams<{ questId: string }>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    if (!questId) return;
    const load = async () => {
      setLoading(true);
      try {
        const quest = await fetchQuestById(questId);
        setTitle(quest.title);
        const filled = (quest.collaborators || []).filter(c => c.userId);
        const enriched: Collaborator[] = await Promise.all(
          filled.map(async c => {
            try {
              const u = await fetchUserById(c.userId!);
              return { ...c, username: u.username || c.username, avatarUrl: u.avatarUrl };
            } catch {
              return { ...c };
            }
          })
        );
        setCollaborators(enriched);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [questId]);

  if (loading) return <Spinner />;

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Team for {title}</h1>
      {collaborators.length === 0 ? (
        <p className="text-secondary">No collaborators yet.</p>
      ) : (
        <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {collaborators.map((c) => (
            <li key={c.userId} className="border rounded-lg p-4 bg-surface space-y-2">
              <AvatarStack users={[{ avatarUrl: c.avatarUrl, username: c.username }]} max={1} />
              <div className="text-sm font-semibold">@{c.username || c.userId}</div>
              {c.roles && c.roles.length > 0 && (
                <div className="text-xs text-secondary">Roles: {c.roles.join(', ')}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default TeamBoardPage;

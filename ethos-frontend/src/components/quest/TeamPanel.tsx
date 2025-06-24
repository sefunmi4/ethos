import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CollaberatorControls from '../controls/CollaberatorControls';
import { updateQuestById, fetchQuestById, linkPostToQuest } from '../../api/quest';
import { updatePost, addPost, requestHelp } from '../../api/post';
import { AvatarStack } from '../ui';
import { ROUTES } from '../../constants/routes';
import type { CollaberatorRoles, Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

interface TeamPanelProps {
  questId: string;
  node: Post;
  canEdit?: boolean;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ questId, node, canEdit = true }) => {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [roles, setRoles] = useState<CollaberatorRoles[]>(node.collaborators || []);
  const [saving, setSaving] = useState(false);

  const isRoot = quest ? quest.headPostId === node.id : false;

  useEffect(() => {
    fetchQuestById(questId)
      .then(setQuest)
      .catch(() => {});
  }, [questId]);

  useEffect(() => {
    if (isRoot) setRoles(quest?.collaborators || []);
    else setRoles(node.collaborators || []);
  }, [isRoot, quest?.collaborators, node.collaborators]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isRoot && quest) {
        await updateQuestById(quest.id, { collaborators: roles });
      } else {
        await updatePost(node.id, { collaborators: roles });
      }

      for (const r of roles) {
        if (!r.userId) {
          const content = r.roles && r.roles.length
            ? `Open Role: ${r.roles.join(', ')}`
            : 'Open Role';
          try {
            const task = await addPost({
              type: 'task',
              content,
              visibility: 'public',
              questId,
              status: 'To Do',
            });
            await linkPostToQuest(questId, {
              postId: task.id,
              parentId: node.id,
              title: task.content.slice(0, 50),
            });
            await requestHelp(task.id, 'task');
          } catch (err) {
            console.error('[TeamPanel] Failed to create open role task', err);
          }
        }
      }
    } catch (err) {
      console.error('[TeamPanel] Failed to save roles', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {quest && (
        <div className="flex items-center justify-between">
          <AvatarStack
            users={(quest.collaborators || [])
              .filter(c => c.userId)
              .map(c => ({ avatarUrl: (c as any).avatarUrl, username: c.username }))}
          />
          <Link
            to={ROUTES.TEAM_BOARD(quest.id)}
            className="text-xs text-blue-600 underline"
          >
            View All
          </Link>
        </div>
      )}
      {canEdit ? (
        <>
          <CollaberatorControls value={roles} onChange={setRoles} />
          <button
            onClick={handleSave}
            className="text-xs text-accent underline"
          >
            {saving ? 'Saving...' : 'Save Roles'}
          </button>
        </>
      ) : (
        <div className="text-sm">
          <p className="font-semibold">Team Members:</p>
          <ul className="list-disc ml-4 space-y-1">
            {roles.map((r, i) => (
              <li key={i}>
                {r.username ? `@${r.username}` : 'Open Role'}
                {r.roles && r.roles.length ? ` - ${r.roles.join(', ')}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamPanel;

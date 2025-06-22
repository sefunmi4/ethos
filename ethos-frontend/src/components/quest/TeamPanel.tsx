import React, { useEffect, useState } from 'react';
import CollaberatorControls from '../controls/CollaberatorControls';
import { updateQuestById, fetchQuestById } from '../../api/quest';
import { updatePost } from '../../api/post';
import type { CollaberatorRoles, Post } from '../../types/postTypes';
import type { Quest } from '../../types/questTypes';

interface TeamPanelProps {
  questId: string;
  node: Post;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ questId, node }) => {
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
    } catch (err) {
      console.error('[TeamPanel] Failed to save roles', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <CollaberatorControls value={roles} onChange={setRoles} />
      <button
        onClick={handleSave}
        className="text-xs text-accent underline"
      >
        {saving ? 'Saving...' : 'Save Roles'}
      </button>
    </div>
  );
};

export default TeamPanel;

import React, { useState } from 'react';
import type { Quest } from '../../types/questTypes';
import { moderateQuest } from '../../api/quest';
import { Select, Button } from '../ui';

interface ModReviewPanelProps {
  quest: Quest;
  onUpdated?: (quest: Quest) => void;
}

const visibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'hidden', label: 'Hidden' },
];

const approvalOptions = [
  { value: 'approved', label: 'Approved' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'banned', label: 'Banned' },
];

const ModReviewPanel: React.FC<ModReviewPanelProps> = ({ quest, onUpdated }) => {
  const [visibility, setVisibility] = useState<Quest['visibility']>(quest.visibility);
  const [approval, setApproval] = useState<Quest['approvalStatus']>(quest.approvalStatus);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await moderateQuest(quest.id, { visibility, approvalStatus: approval });
      onUpdated?.(updated);
    } catch (err) {
      console.error('[ModReviewPanel] failed to update quest', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 border p-3 rounded bg-surface dark:bg-background">
      <div className="font-semibold">{quest.title}</div>
      <div className="flex gap-2">
        <Select value={visibility} onChange={e => setVisibility(e.target.value as Quest['visibility'])} options={visibilityOptions} />
        <Select value={approval} onChange={e => setApproval(e.target.value as Quest['approvalStatus'])} options={approvalOptions} />
        <Button onClick={handleSave} disabled={saving}>Save</Button>
      </div>
    </div>
  );
};

export default ModReviewPanel;

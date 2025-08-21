import React, { useState } from 'react';
import { createJoinRequest } from '../../api/joinRequest';
import { searchUsers } from '../../api/auth';

interface InviteFormProps {
  taskId: string;
}

const InviteForm: React.FC<InviteFormProps> = ({ taskId }) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const results = await searchUsers(trimmed);
      const user = results[0];
      if (!user) {
        alert('User not found');
        return;
      }
      await createJoinRequest(taskId, user.id);
      alert('Invitation sent');
      setUsername('');
    } catch (err) {
      console.error('[InviteForm] failed to invite user', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = role.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await createJoinRequest(taskId, `role:${trimmed}`, undefined, { role: trimmed });
      alert('Role request sent');
      setRole('');
    } catch (err) {
      console.error('[InviteForm] failed to create role request', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleInviteUser} className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Invite by username"
          className="flex-1 border px-2 py-1 rounded"
        />
        <button type="submit" className="text-xs px-2 py-1 bg-blue-600 text-white rounded" disabled={loading}>
          Invite
        </button>
      </form>
      <form onSubmit={handleInviteRole} className="flex gap-2">
        <input
          type="text"
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="Request by role"
          className="flex-1 border px-2 py-1 rounded"
        />
        <button type="submit" className="text-xs px-2 py-1 bg-blue-600 text-white rounded" disabled={loading}>
          Request
        </button>
      </form>
    </div>
  );
};

export default InviteForm;

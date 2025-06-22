import React, { useEffect, useState } from 'react';
import type { CollaberatorRoles } from '../../types/postTypes';
import { searchUsers } from '../../api/auth';

const ALL_ROLES = [
  'Leader',
  'Developer',
  'Designer',
  'Writer',
  'Analyst',
  'Caster',
  'Creator',
  'Merchant',
  'Tester',
  'Strategist',
];

type Props = {
  value: CollaberatorRoles[];
  onChange: (collaborators: CollaberatorRoles[]) => void;
};

const CollaberatorControls: React.FC<Props> = ({ value, onChange }) => {
  const [username, setUsername] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; username: string }[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (username.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      searchUsers(username.trim())
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [username]);

  const addCollaborator = () => {
    if (!username.trim()) return;
    const id =
      selectedUser?.id ||
      suggestions.find(s => s.username === username)?.id ||
      crypto.randomUUID();
    const newCollaborator: CollaberatorRoles = {
      userId: id,
      username,
      roles: selectedRoles,
    };
    onChange([...value, newCollaborator]);
    setUsername('');
    setSelectedUser(null);
    setSelectedRoles([]);
  };

  const removeCollaborator = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Collaborator */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Collaborator Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSelectedUser(null);
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="e.g. alice, bob123"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 bg-surface border border-secondary rounded shadow w-full text-sm max-h-40 overflow-y-auto">
                {suggestions.map((u) => (
                  <li
                    key={u.id}
                    className="px-2 py-1 cursor-pointer hover:bg-background"
                    onClick={() => {
                      setUsername(u.username);
                      setSelectedUser(u);
                      setSuggestions([]);
                    }}
                  >
                    @{u.username}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={addCollaborator}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {/* Select Roles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Roles for this collaborator
          </label>
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-3 py-1 rounded-full border text-sm ${
                selectedRoles.includes(role)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-surface text-gray-700 border-gray-300 dark:bg-background dark:text-gray-200 dark:border-gray-600'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Current Collaborators */}
      {value.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Assigned Collaborators:</p>
          <ul className="space-y-2 text-sm">
            {value.map((c, index) => (
              <li
                key={index}
                className="flex justify-between items-start bg-background dark:bg-surface p-2 rounded-md border"
              >
                <div>
                  <strong>@{c.username}</strong>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Roles: {(c.roles || []).join(', ') || 'None'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCollaborator(index)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CollaberatorControls;

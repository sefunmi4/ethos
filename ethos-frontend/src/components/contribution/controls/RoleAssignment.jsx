// src/components/contribution/controls/RoleAssignment.jsx

import React from 'react';

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

const RoleAssignment = ({ value = [], onChange }) => {
  const toggleRole = (role) => {
    if (value.includes(role)) {
      onChange(value.filter(r => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Assigned Roles
      </label>
      <div className="flex flex-wrap gap-2">
        {ALL_ROLES.map(role => (
          <button
            key={role}
            type="button"
            onClick={() => toggleRole(role)}
            className={`px-3 py-1 rounded-full border text-sm ${
              value.includes(role)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleAssignment;
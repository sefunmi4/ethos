import React from 'react';

const allRoles = ['Leader', 'Builder', 'Researcher', 'Designer', 'Support'];

const RoleAssignment = ({ value = [], onChange }) => {
  const toggleRole = (role) => {
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Assign Roles</label>
      <div className="flex flex-wrap gap-2">
        {allRoles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => toggleRole(role)}
            className={`text-xs px-3 py-1 rounded border ${
              value.includes(role)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-300'
            } hover:shadow-sm transition`}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleAssignment;

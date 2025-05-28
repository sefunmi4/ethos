// src/components/ui/Select.jsx
import React from 'react';
import clsx from 'clsx';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  error = '',
  className = '',
}) => {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={clsx(
          'w-full p-3 text-sm rounded-md border shadow-sm focus:outline-none',
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : error
            ? 'border-red-500 focus:ring-2 focus:ring-red-400'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
        )}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
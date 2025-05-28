// src/components/ui/TextArea.jsx
import React from 'react';
import clsx from 'clsx';

const TextArea = ({
  label,
  value,
  onChange,
  maxLength,
  error,
  disabled = false,
  placeholder = '',
  rows = 4,
  name,
  className = '',
}) => {
  const remainingChars = maxLength ? maxLength - value.length : null;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={name} className="block mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        className={clsx(
          'w-full p-3 text-sm rounded-md border shadow-sm focus:outline-none',
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : error
            ? 'border-red-500 focus:ring-2 focus:ring-red-400'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500',
        )}
      />

      <div className="mt-1 flex justify-between text-sm text-gray-500">
        {error ? <span className="text-red-600">{error}</span> : <span />}
        {maxLength && (
          <span className={remainingChars < 0 ? 'text-red-600' : ''}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

export default TextArea;
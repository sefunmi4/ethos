// src/components/ui/Label.jsx
import React from 'react';
import clsx from 'clsx';

const Label = ({ htmlFor, children, required = false, disabled = false, className = '' }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx(
        'block mb-1 text-sm font-medium',
        disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700',
        className
      )}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default Label;
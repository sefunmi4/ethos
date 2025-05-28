// src/components/ui/Tag.jsx

import React from 'react';
import clsx from 'clsx';

const TAG_VARIANTS = {
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  neutral: 'bg-gray-100 text-gray-800',
};

const Tag = ({
  children,
  variant = 'neutral',
  className = '',
  icon: Icon,
  rounded = true,
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium',
        TAG_VARIANTS[variant] || TAG_VARIANTS.neutral,
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

export default Tag;
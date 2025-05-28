// src/components/ui/Button.jsx
import React from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded transition focus:outline-none focus:ring-2 focus:ring-offset-2';

const variants = {
  primary: 'bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
  danger: 'bg-red-600 text-white border-transparent hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-gray-400',
};

const disabledStyles = 'opacity-50 cursor-not-allowed';

const Button = ({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) => {
  const combinedClasses = clsx(
    baseStyles,
    variants[variant],
    (disabled || isLoading) && disabledStyles,
    className
  );

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

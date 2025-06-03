import React from 'react';
import clsx from 'clsx';

// Button variants available throughout the app
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'disabled';

/**
 * Props for the Button component.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;         // Visual style of the button
  full?: boolean;                  // Stretch to full width
  className?: string;              // Optional additional class names
}

/**
 * Button - A consistent and accessible button component.
 *
 * Design Considerations:
 * - Variant-based styling supports multiple use cases (primary action, cancel, destructive, etc.)
 * - Supports `disabled`, `type`, `onClick`, etc. from native button props
 * - Optional `full` prop stretches button to full container width
 * - Recommended to keep labels concise and action-focused (e.g., “Save”, “Submit”, “Cancel”)
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  full = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-150';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500',
    disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        full && 'w-full',
        className
      )}
      disabled={disabled || variant === 'disabled'}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'disabled';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'; // optional: 'md' is default

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors duration-150';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-300',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500',
    disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
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
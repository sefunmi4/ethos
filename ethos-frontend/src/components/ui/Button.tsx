import React from 'react';
import clsx from 'clsx';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'disabled'
  | 'contrast';
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
  const baseStyles = 'btn';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-accent text-white hover:bg-accent focus:ring-2 focus:ring-accent',
    secondary:
      'bg-soft text-primary hover:bg-surface focus:ring-2 focus:ring-secondary',
    contrast:
      'bg-primary text-surface dark:text-background hover:bg-primary focus:ring-2 focus:ring-primary',
    ghost:
      'bg-transparent text-secondary hover:bg-soft focus:ring-2 focus:ring-background',
    danger:
      'bg-error text-white hover:bg-error focus:ring-2 focus:ring-error',
    disabled:
      'bg-soft text-secondary cursor-not-allowed',
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
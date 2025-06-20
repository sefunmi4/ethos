import React from 'react';
import clsx from 'clsx';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  id?: string;
  srOnlyLabel?: string;
  className?: string;
  helperText?: string;
  error?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, srOnlyLabel, className = '', helperText, error, prefix, suffix, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {srOnlyLabel && <label htmlFor={id} className="sr-only">{srOnlyLabel}</label>}

        <div className="flex items-center border border-secondary rounded-md shadow-sm focus-within:ring-2 focus-within:ring-accent focus-within:border-accent overflow-hidden bg-surface">
          {prefix && (
            <span className="px-2 text-secondary bg-background">
              {prefix}
            </span>
          )}
          <input
            id={id}
            ref={ref}
            className={clsx(
              'w-full px-3 py-2 text-sm bg-surface text-primary',
              error ? 'border-error' : 'border-secondary',
              'focus:outline-none',
              className
            )}
            {...props} // only standard input attributes passed here
          />
          {suffix && (
            <span className="px-2 text-secondary bg-background">
              {suffix}
            </span>
          )}
        </div>

          {helperText && (
            <p
              className={clsx(
                'text-xs',
                error ? 'text-error' : 'text-secondary'
              )}
            >
              {helperText}
            </p>
          )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
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

        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-accent focus-within:border-accent overflow-hidden bg-white dark:bg-gray-700">
          {prefix && (
            <span className="px-2 text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-600">
              {prefix}
            </span>
          )}
          <input
            id={id}
            ref={ref}
            className={clsx(
              'w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
              'focus:outline-none',
              className
            )}
            {...props} // only standard input attributes passed here
          />
          {suffix && (
            <span className="px-2 text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-600">
              {suffix}
            </span>
          )}
        </div>

        {helperText && (
          <p className={clsx('text-xs', error ? 'text-red-600' : 'text-gray-500')}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
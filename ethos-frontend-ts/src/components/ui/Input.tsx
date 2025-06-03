import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Unique identifier for accessibility and form labeling */
  id?: string;
  /** Label visually hidden but accessible for screen readers */
  srOnlyLabel?: string;
  /** Optional external className to customize input styling */
  className?: string;
}

/**
 * ✅ Input Component
 * Reusable, styled input element designed for use across forms.
 *
 * - Supports all native input props
 * - Styled consistently with utility-first classes
 * - Allows external overrides through `className`
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, srOnlyLabel, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {srOnlyLabel && (
          <label htmlFor={id} className="sr-only">
            {srOnlyLabel}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={clsx(
            'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
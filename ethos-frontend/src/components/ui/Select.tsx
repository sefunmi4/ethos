import React from 'react';
import clsx from 'clsx';
import type { option } from '../../constants/options';


export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: option[];
  className?: string;
  helperText?: string;
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, value, onChange, options, className = '', helperText, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <select
          id={id}
          ref={ref}
          value={value}
          onChange={onChange}
          className={clsx(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-accent focus:border-accent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && (
          <p className={clsx('text-xs', error ? 'text-red-600' : 'text-gray-500')}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
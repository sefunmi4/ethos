import React from 'react';
import clsx from 'clsx';

export interface TextAreaProps {
  id?: string;
  name?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  helperText?: string;
  error?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  value,
  placeholder = '',
  rows = 4,
  className,
  disabled = false,
  required = false,
  readOnly = false,
  helperText,
  error,
  onChange,
}) => {
  return (
    <div className="w-full space-y-1">
      <textarea
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        onChange={onChange}
        className={clsx(
          'w-full p-3 rounded-md border shadow-sm resize-y text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none',
          error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-accent focus:border-accent',
          {
            'bg-gray-100 dark:bg-gray-600 cursor-not-allowed': disabled || readOnly,
          },
          className
        )}
      />
      {helperText && (
        <p className={clsx('text-xs', error ? 'text-red-600' : 'text-gray-500')}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default TextArea;
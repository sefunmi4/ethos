// src/components/ui/FormSection.jsx
import React from 'react';
import clsx from 'clsx';

const FormSection = ({ title, description, children, className = '' }) => {
  return (
    <section className={clsx('mb-8', className)}>
      {title && (
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-sm text-gray-500 mb-4">
          {description}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
};

export default FormSection;
import React from 'react';

/**
 * Simple centered spinner using Tailwind for loading states.
 */
const Spinner: React.FC = () => (
  <div className="flex justify-center items-center py-8 w-full">
    <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

export default Spinner;

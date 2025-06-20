import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Simple footer with navigation links and credits.
 */
const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-sm text-gray-600 dark:text-gray-300">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <nav className="flex gap-4">
          <Link to="/about" className="hover:text-accent transition-colors">
            About
          </Link>
          <Link to="/privacy" className="hover:text-accent transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-accent transition-colors">
            Terms
          </Link>
        </nav>
        <span className="text-xs">&copy; {year} Ethos</span>
      </div>
    </footer>
  );
};

export default Footer;

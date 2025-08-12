import React, { useEffect, useState } from 'react';
import { Input, Select, Button } from '../ui';
import { POST_TYPES, type option } from '../../constants/options';

export interface FilterState {
  search: string;
  tags: string[];
  status: string;
  postType: string;
  role: string;
  sortBy: string;
  view: 'grid' | 'list';
}

interface BoardSearchFilterProps {
  tags?: string[];
  onChange?: (filters: FilterState) => void;
  className?: string;
}

const STATUS_OPTIONS: option[] = [
  { value: '', label: 'Any Status' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

const POST_TYPE_OPTIONS: option[] = [
  { value: '', label: 'All Types' },
  ...POST_TYPES,
];

const ROLE_OPTIONS: option[] = [
  { value: '', label: 'Any Role' },
  { value: 'developer', label: 'Developer' },
  { value: 'wizard', label: 'Wizard' },
  { value: 'creator', label: 'Creator' },
];

const SORT_OPTIONS: option[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'replies', label: 'Most Replies' },
  { value: 'trending', label: 'Trending' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_FILTERS: FilterState = {
  search: '',
  tags: [],
  status: '',
  postType: '',
  role: '',
  sortBy: 'recent',
  view: 'list',
};

const STORAGE_KEY = 'boardFilters';

const BoardSearchFilter: React.FC<BoardSearchFilterProps> = ({
  tags = [],
  onChange,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_FILTERS, ...JSON.parse(stored) } as FilterState;
        }
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_FILTERS;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    if (onChange) onChange(filters);
  }, [filters, onChange]);

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const reset = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        placeholder="Search..."
      />
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((e) => !e)}
        >
          + Filters
        </Button>
        {expanded && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        )}
      </div>
      {expanded && (
        <div className="space-y-3 border rounded-md p-3 bg-surface">
          {tags.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag} className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    <span>#{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={STATUS_OPTIONS}
          />
          <Select
            value={filters.postType}
            onChange={(e) => setFilters({ ...filters, postType: e.target.value })}
            options={POST_TYPE_OPTIONS}
          />
          <Select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            options={ROLE_OPTIONS}
          />
          <Select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            options={SORT_OPTIONS}
          />
        </div>
      )}
    </div>
  );
};

export default BoardSearchFilter;

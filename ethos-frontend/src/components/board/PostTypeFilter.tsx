import React from 'react';
import Select from '../ui/Select';

interface PostTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { value: '', label: 'All Posts' },
  { value: 'request', label: 'Requests' },
  { value: 'review', label: 'Reviews' },
  { value: 'issue', label: 'Issues' },
];

const PostTypeFilter: React.FC<PostTypeFilterProps> = ({ value, onChange }) => {
  return (
    <div className="max-w-xs">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
      />
    </div>
  );
};

export default PostTypeFilter;

import React from 'react';
import Select from '../ui/Select';

interface PostTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  { value: '', label: 'All Posts' },
  { value: 'project', label: 'Projects' },
  { value: 'request', label: 'Requests' },
  { value: 'review', label: 'Reviews' },
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

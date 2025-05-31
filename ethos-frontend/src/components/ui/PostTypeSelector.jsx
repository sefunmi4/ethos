// src/components/ui/PostTypeSelector.jsx
import React from 'react';
import { POST_TYPES } from '../../constants/POST_TYPES';

const PostTypeSelector = ({ value, onChange }) => (
  <div className="text-sm">
    <label className="block font-medium mb-1">Post Type</label>
    <select
      className="border rounded px-2 py-1 w-full"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {POST_TYPES.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default PostTypeSelector;
import React from 'react';

const PostContentInput = ({ value, onChange, placeholder = 'Write something...' }) => (
  <textarea
    className="w-full border rounded px-3 py-2 text-sm"
    rows={4}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    required
  />
);

export default PostContentInput;


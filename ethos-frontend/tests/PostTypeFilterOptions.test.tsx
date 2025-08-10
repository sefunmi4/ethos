import React from 'react';
import { render, screen } from '@testing-library/react';
import PostTypeFilter from '../src/components/board/PostTypeFilter';

describe('PostTypeFilter options', () => {
  it('shows quest board filter options', () => {
    render(<PostTypeFilter value="" onChange={() => {}} />);
    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option')).map(o => o.textContent);
    expect(options).toEqual(['All Posts', 'Requests', 'Reviews']);
  });
});

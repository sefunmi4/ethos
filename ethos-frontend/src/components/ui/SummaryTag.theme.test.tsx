import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SummaryTag from './SummaryTag';

describe('SummaryTag theme switching', () => {
  beforeAll(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .bg-green-100 { background-color: #dcfce7; }
      .dark .dark\\:bg-green-800 { background-color: #065f46; }
      .text-green-800 { color: #166534; }
      .dark .dark\\:text-green-200 { color: #bbf7d0; }
    `;
    document.head.appendChild(style);
  });

  it('updates colors when toggling dark mode', () => {
    const { getByTestId } = render(
      <BrowserRouter>
        <SummaryTag type="quest" label="Quest" />
      </BrowserRouter>
    );

    const tag = getByTestId('summary-tag');
    expect(getComputedStyle(tag).backgroundColor).toBe('rgb(220, 252, 231)');

    document.documentElement.classList.add('dark');
    expect(getComputedStyle(tag).backgroundColor).toBe('rgb(6, 95, 70)');

    document.documentElement.classList.remove('dark');
    expect(getComputedStyle(tag).backgroundColor).toBe('rgb(220, 252, 231)');
  });
});

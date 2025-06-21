import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../src/contexts/ThemeContext';

function setupMatchMedia(matches) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe('ThemeProvider', () => {
  it('applies system preference when theme is system', () => {
    setupMatchMedia(true);
    localStorage.setItem('theme', 'system');
    render(React.createElement(ThemeProvider, {}, React.createElement('div')));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies selected theme', () => {
    setupMatchMedia(false);
    localStorage.setItem('theme', 'dark');
    render(React.createElement(ThemeProvider, {}, React.createElement('div')));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

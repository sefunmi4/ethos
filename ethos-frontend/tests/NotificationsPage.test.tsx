import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationsPage from '../src/pages/Notifications';

const mockMarkRead = jest.fn();
jest.mock('../src/contexts/NotificationContext', () => ({
  __esModule: true,
  useNotifications: () => ({
    notifications: [
      { id: 'n1', message: 'Join request', link: '/posts/p1', read: false },
    ],
    markRead: mockMarkRead,
  }),
}));

describe('NotificationsPage', () => {
  it('shows mark read CTA and handles action', () => {
    render(
      <BrowserRouter>
        <NotificationsPage />
      </BrowserRouter>
    );
    const btn = screen.getByText('Mark read');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockMarkRead).toHaveBeenCalledWith('n1');
    expect(screen.getByText('View').getAttribute('href')).toBe('/posts/p1');
  });
});

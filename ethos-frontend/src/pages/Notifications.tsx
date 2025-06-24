import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
  const { notifications, markRead } = useNotifications();

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {notifications.length === 0 && <p>No notifications.</p>}
      <ul className="space-y-4">
        {notifications.map(n => (
          <li key={n.id} className="border p-3 rounded flex justify-between items-start">
            <div>
              <p className={n.read ? 'text-secondary' : 'font-semibold'}>{n.message}</p>
              {n.link && (
                <Link to={n.link} className="text-blue-600 underline text-sm" onClick={() => markRead(n.id)}>
                  View
                </Link>
              )}
            </div>
            {!n.read && (
              <button className="text-sm" onClick={() => markRead(n.id)}>
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { approveJoinRequest, declineJoinRequest } from '../api/post';
import type { Notification } from '../types/notificationTypes';

const NotificationsPage: React.FC = () => {
  const { notifications, markRead } = useNotifications();

  const handleApprove = async (n: Notification) => {
    if (!n.joinRequestId || !n.taskId) return;
    try {
      await approveJoinRequest(n.taskId, n.joinRequestId);
      // Optimistically update collaborator count & thread badge
      window.dispatchEvent(
        new CustomEvent('join-request-approved', { detail: { taskId: n.taskId } })
      );
      await markRead(n.id);
    } catch (err) {
      console.error('[Notifications] Failed to approve join request', err);
    }
  };

  const handleDecline = async (n: Notification) => {
    if (!n.joinRequestId || !n.taskId) return;
    try {
      await declineJoinRequest(n.taskId, n.joinRequestId);
      await markRead(n.id);
    } catch (err) {
      console.error('[Notifications] Failed to decline join request', err);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {notifications.length === 0 && <p>No notifications.</p>}
      <ul className="space-y-4">
        {notifications.map(n => {
          const isJoinRequest = !!n.joinRequestId && !!n.taskId;
          return (
            <li key={n.id} className="border p-3 rounded flex justify-between items-start">
              <div>
                <p className={n.read ? 'text-secondary' : 'font-semibold'}>{n.message}</p>
                {n.link && (
                  <Link to={n.link} className="text-blue-600 underline text-sm" onClick={() => markRead(n.id)}>
                    View
                  </Link>
                )}
              </div>
              {isJoinRequest ? (
                <div className="flex gap-2">
                  <button
                    className="text-sm text-green-600"
                    onClick={() => handleApprove(n)}
                  >
                    Approve
                  </button>
                  <button
                    className="text-sm text-red-600"
                    onClick={() => handleDecline(n)}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                !n.read && (
                  <button className="text-sm" onClick={() => markRead(n.id)}>
                    Mark read
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NotificationsPage;

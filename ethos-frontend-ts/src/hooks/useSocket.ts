import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Types for supported socket events
type SocketEvents = {
  'board:update': (data: any) => void;
  'user_connected': (payload: { userId: string }) => void;
  'auth:reset-page-visited': (payload: { token: string }) => void;
  'auth:password-reset-success': (payload: { userId: string }) => void;
  'navigation:404': (payload: { userId: string | null }) => void;
  [event: string]: (...args: any[]) => void;
};

// Singleton socket instance
let socket: Socket | null = null;

/**
 * Initializes and returns a singleton Socket.io client.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      autoConnect: false,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }

  return socket;
};

/**
 * Hook to access the singleton socket instance.
 */
export const useSocket = () => {
  const socketRef = useRef<Socket>(getSocket());

  return {
    socket: socketRef.current,
  };
};


/**
 * A generic React hook for registering and cleaning up Socket.IO event listeners.
 * Only supports string-based custom event names.
 *
 * @template K - A string key from the SocketEvents interface
 * @param event - The name of the custom socket event
 * @param handler - The function to call when the event is triggered
 */
export const useSocketListener = <K extends keyof SocketEvents>(
  event: K,
  handler: SocketEvents[K]
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Cast event to string to avoid TypeScript conflict with reserved Socket.IO events
    const eventName = event as string;

    socket.on(eventName, handler as (...args: any[]) => void);
    return () => {
      socket.off(eventName, handler as (...args: any[]) => void);
    };
  }, [event, handler, socket]);
};
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// ---------------------------
// 🔌 Define supported socket events
// ---------------------------
type SocketEvents = {
  'board:update': (data: any) => void;
  'user_connected': (payload: { userId: string }) => void;
  'auth:reset-page-visited': (payload: { token: string }) => void;
  'auth:password-reset-success': (payload: { userId: string }) => void;
  'navigation:404': (payload: { userId: string | null }) => void;
  [event: string]: (...args: any[]) => void;
};

// ---------------------------
// 🌐 Singleton socket instance
// ---------------------------
let socket: Socket | null = null;

/**
 * Initializes and returns a singleton Socket.IO client instance.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      autoConnect: false,
      transports: ['websocket'],
    });

    // 🌱 Base lifecycle logging
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });
  }

  return socket;
};

/**
 * Custom hook to access the socket instance.
 * Includes connect/disconnect helpers if needed.
 */
export const useSocket = () => {
  const socketRef = useRef<Socket>(getSocket());

  /**
   * Manually connect the socket (if autoConnect: false).
   */
  const connect = () => {
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  /**
   * Gracefully disconnect the socket.
   */
  const disconnect = () => {
    if (socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  };

  return {
    socket: socketRef.current,
    connect,
    disconnect,
  };
};

/**
 * React hook to register and clean up a Socket.IO event listener.
 *
 * @template K - Event name key from the SocketEvents map
 * @param event - The event name to listen to
 * @param handler - The function to run when the event is received
 */
export const useSocketListener = <K extends keyof SocketEvents>(
  event: K,
  handler: SocketEvents[K]
) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const eventName = event as string;

    socket.on(eventName, handler as (...args: any[]) => void);
    return () => {
      socket.off(eventName, handler as (...args: any[]) => void);
    };
  }, [event, handler, socket]);
};
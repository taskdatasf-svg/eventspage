/**
 * lib/useViewerCount.ts
 *
 * React hook that connects to the Socket.io presence server and
 * returns the live viewer count for a given event page.
 *
 * Usage:
 *   const viewerCount = useViewerCount(eventId);
 */
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// The URL of the Socket.io server.
// In dev: ws://localhost:3001
// In production: set NEXT_PUBLIC_SOCKET_URL env var to the deployed server URL.
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

// Singleton socket so all hooks on the page share one connection
let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
  }
  return _socket;
}

export function useViewerCount(eventId: string | null | undefined): number {
  const [count, setCount] = useState<number>(1); // optimistic: at least the viewer themselves

  useEffect(() => {
    if (!eventId) return;

    const socket = getSocket();

    const handleCount = ({ count }: { count: number }) => {
      setCount(count);
    };

    // Join event room as soon as connected (or immediately if already connected)
    const joinRoom = () => {
      socket.emit('join_event', eventId);
    };

    socket.on('connect', joinRoom);
    socket.on('viewer_count', handleCount);

    // If already connected, join immediately
    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.emit('leave_event', eventId);
      socket.off('connect', joinRoom);
      socket.off('viewer_count', handleCount);
    };
  }, [eventId]);

  return count;
}

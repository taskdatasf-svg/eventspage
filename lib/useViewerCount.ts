'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

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
  const [count, setCount] = useState<number>(1);

  useEffect(() => {
    if (!eventId) return;

    const socket = getSocket();

    const handleCount = ({ count }: { count: number }) => {
      setCount(count);
    };

    const joinRoom = () => {
      socket.emit('join_event', eventId);
    };

    socket.on('connect', joinRoom);
    socket.on('viewer_count', handleCount);

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

import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.SOCKET_PORT || 3001;

const ALLOWED_ORIGINS = (process.env.SOCKET_ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const viewers = new Map();

function broadcastCount(eventId) {
  const count = viewers.get(eventId)?.size ?? 0;
  io.to(eventId).emit('viewer_count', { count });
}

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join_event', (eventId) => {
    if (typeof eventId !== 'string' || eventId.length > 100) return;

    if (currentRoom) {
      socket.leave(currentRoom);
      viewers.get(currentRoom)?.delete(socket.id);
      broadcastCount(currentRoom);
    }

    currentRoom = eventId;
    socket.join(eventId);

    if (!viewers.has(eventId)) viewers.set(eventId, new Set());
    viewers.get(eventId).add(socket.id);

    broadcastCount(eventId);
  });

  socket.on('leave_event', (eventId) => {
    if (typeof eventId !== 'string') return;
    socket.leave(eventId);
    viewers.get(eventId)?.delete(socket.id);
    broadcastCount(eventId);
    if (viewers.get(eventId)?.size === 0) viewers.delete(eventId);
    currentRoom = null;
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      viewers.get(currentRoom)?.delete(socket.id);
      broadcastCount(currentRoom);
      if (viewers.get(currentRoom)?.size === 0) viewers.delete(currentRoom);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io presence server running on port ${PORT}`);
});

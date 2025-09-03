import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketManager {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) return;
    
    this.disconnect();
    this.userId = userId;
    
    const token = localStorage.getItem('auth_token');
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      // Join user-specific rooms
      this.socket?.emit('join:user', userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }

  joinPool(pool: string) {
    if (this.socket && this.userId) {
      this.socket.emit('join:pool', { pool, userId: this.userId });
    }
  }

  joinSession(sessionId: string) {
    if (this.socket) {
      this.socket.emit('join:session', sessionId);
    }
  }

  leaveSession(sessionId: string) {
    if (this.socket) {
      this.socket.emit('leave:session', sessionId);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketManager = new SocketManager();
export default socketManager;
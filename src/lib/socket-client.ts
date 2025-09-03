import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  
  connect() {
    if (this.socket?.connected) return this.socket;
    
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to WhatsApp backend');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WhatsApp backend');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  onQRCode(callback: (data: { session: string; qr: string }) => void) {
    if (this.socket) {
      this.socket.on('qr', callback);
    }
  }
  
  onStatusUpdate(callback: (data: { session: string; status: string }) => void) {
    if (this.socket) {
      this.socket.on('wa:status', callback);
    }
  }
  
  offQRCode(callback?: (data: { session: string; qr: string }) => void) {
    if (this.socket) {
      this.socket.off('qr', callback);
    }
  }
  
  offStatusUpdate(callback?: (data: { session: string; status: string }) => void) {
    if (this.socket) {
      this.socket.off('wa:status', callback);
    }
  }
  
  getSocket() {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
export default socketClient;
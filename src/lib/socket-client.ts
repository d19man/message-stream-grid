import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  
  connect() {
    if (this.socket?.connected) return this.socket;
    
    const SOCKET_URL = 'http://localhost:3001';
    console.log('Connecting to socket server:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WhatsApp backend', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WhatsApp backend:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔥 Reconnect error:', error);
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
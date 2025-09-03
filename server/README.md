# WhatsApp Baileys Server

Server Express.js dengan Socket.io untuk WhatsApp integration menggunakan Baileys library.

## Features

- ✅ WhatsApp session management dengan Baileys
- ✅ Real-time QR code via Socket.io  
- ✅ Real-time status updates
- ✅ Message sending/receiving
- ✅ Session persistence
- ✅ Authentication dengan Supabase
- ✅ Auto-reconnection

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   PORT=3001
   SUPABASE_URL=https://fkviagopdmfytphpwtha.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Run server:**
   ```bash
   # Development
   npm run dev
   
   # Production  
   npm start
   ```

## API Endpoints

### Health Check
- **GET** `/health` - Server status

### WhatsApp Management (Auth required)
- **POST** `/api/whatsapp/create` - Create session
- **POST** `/api/whatsapp/connect` - Connect session (generates QR)
- **POST** `/api/whatsapp/disconnect` - Disconnect session
- **POST** `/api/whatsapp/send` - Send message

## Socket.io Events

### Client → Server
- `request_qr` - Request QR code for session

### Server → Client  
- `qr` - QR code generated
- `wa:status` - Session status update
- `wa:message` - New incoming message

## Usage Example

### Frontend Socket.io Setup
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Listen for QR codes
socket.on('qr', (data) => {
  console.log('QR Code:', data.qr);
  // data = { session: 'sessionId', qr: 'data:image/png;base64,...' }
});

// Listen for status updates
socket.on('wa:status', (data) => {
  console.log('Status:', data.status);
  // data = { session: 'sessionId', status: 'connected|disconnected|qr_required' }
});
```

### Create & Connect Session
```javascript
// 1. Create session
const createResponse = await fetch('/api/whatsapp/create', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    sessionName: 'My Session',
    sessionId: 'uuid-here'
  })
});

// 2. Connect session (QR will come via Socket.io)
const connectResponse = await fetch('/api/whatsapp/connect', {
  method: 'POST', 
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ 
    sessionId: 'uuid-here',
    sessionName: 'My Session'
  })
});
```

## File Structure

```
server/
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env.example      # Environment template
├── sessions/         # WhatsApp auth sessions (auto-created)
└── README.md         # This file
```

## Notes

- Session credentials disimpan di `sessions/` directory
- QR codes dikirim real-time via Socket.io  
- Auto-reconnection untuk sessions yang terputus
- Authentication menggunakan Supabase JWT tokens
- CORS dikonfigurasi untuk frontend development
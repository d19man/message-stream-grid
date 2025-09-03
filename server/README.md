# WhatsApp Baileys Server

Express server dengan integrasi Baileys untuk WhatsApp dan Socket.io untuk real-time communication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Edit `.env` file dengan konfigurasi yang benar:
```env
SUPABASE_URL=https://fkviagopdmfytphpwtha.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

4. Run server:
```bash
npm run dev
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/whatsapp/create` - Create new session
- `POST /api/whatsapp/connect` - Connect session  
- `POST /api/whatsapp/disconnect` - Disconnect session
- `POST /api/whatsapp/send` - Send message

## Socket.io Events

- `qr` - QR code untuk pairing
- `wa:status` - Status update session
- `wa:message` - Incoming messages

## File Structure

```
server/
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env.example       # Environment template
├── .gitignore        # Git ignore rules
├── sessions/         # WhatsApp session data (auto-created)
└── README.md         # This file
```
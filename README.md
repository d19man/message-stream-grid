# WhatsApp Integration with Baileys + Supabase

## Project Overview

This project combines a React frontend with a Node.js backend that uses Baileys for WhatsApp integration and Supabase for authentication, database, and storage.

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for development and build
- Tailwind CSS + shadcn-ui components
- Socket.io client for real-time communication

**Backend:**
- Node.js v20.x LTS (CommonJS)
- Express.js server
- Socket.io for real-time communication
- Baileys (@whiskeysockets/baileys) for WhatsApp integration
- Supabase integration via @supabase/supabase-js

## Prerequisites

- Node.js v20.x LTS
- npm
- Supabase project (configured)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Database Setup (Supabase)

Run the following SQL in your Supabase SQL editor:

```sql
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create wa_sessions table
CREATE TABLE IF NOT EXISTS wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('qr_ready','connected','disconnected')) NOT NULL DEFAULT 'qr_ready',
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create wa_outbox table  
CREATE TABLE IF NOT EXISTS wa_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  to_jid TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text','image','video','document','template')) NOT NULL DEFAULT 'text',
  payload_json JSONB NOT NULL,
  status TEXT CHECK (status IN ('queued','sent','failed')) NOT NULL DEFAULT 'queued',
  error_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wa_sessions_status ON wa_sessions(status);
CREATE INDEX IF NOT EXISTS idx_outbox_session ON wa_outbox(session_name, status);

-- Enable RLS
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_outbox ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wa_sessions
CREATE POLICY "Superadmin can manage all wa_sessions" 
ON wa_sessions 
FOR ALL 
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Users can view wa_sessions" 
ON wa_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for wa_outbox
CREATE POLICY "Superadmin can manage all wa_outbox" 
ON wa_outbox 
FOR ALL 
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Users can view their own wa_outbox" 
ON wa_outbox 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
```

### 4. Directory Structure

The project will automatically create the following directory structure:

```
project-root/
├─ server/
│  ├─ server.js              # Main Express server
│  ├─ routes/wa.routes.js    # WhatsApp API routes
│  ├─ services/wa.service.js # Baileys WhatsApp service
│  ├─ middleware/auth.js     # Authentication middleware
│  ├─ sessions/              # Baileys credentials (auto-created)
│  └─ uploads/               # File uploads (auto-created)
├─ src/                      # React frontend
├─ .env                      # Environment variables
├─ .env.example              # Environment template
├─ package.json
└─ README.md
```

## Running the Application

### Option 1: Run Both Frontend + Backend Together

```bash
npm run dev
```

This will start:
- Frontend (Vite) on http://localhost:5173
- Backend (Express) on http://localhost:3001

### Option 2: Run Frontend and Backend Separately

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET http://localhost:3001/health
Response: { "ok": true }
```

### Send WhatsApp Message
```
POST http://localhost:3001/wa/device1/sendText
Headers: 
  Content-Type: application/json
  Authorization: Bearer <token> (optional in development)
Body: {
  "jid": "6281234567890@s.whatsapp.net",
  "text": "Hello from Baileys!"
}
Response: { "ok": true, "messageId": "..." }
```

### Get Session Status
```
GET http://localhost:3001/wa/device1/status
Response: { "ok": true, "session": "device1", "status": "connected" }
```

## Socket.io Events

The frontend can listen to these real-time events:

### QR Code Event
```javascript
socket.on('qr', (data) => {
  // data = { session: 'device1', qr: 'data:image/png;base64,...' }
  // Display QR code for WhatsApp scanning
});
```

### Status Updates
```javascript
socket.on('wa:status', (data) => {
  // data = { session: 'device1', status: 'connected'|'disconnected'|'qr_ready' }
  // Update UI based on WhatsApp connection status
});
```

## WhatsApp Integration Flow

1. **Initialization:** Backend starts and initializes WhatsApp session 'device1'
2. **QR Generation:** If not connected, generates QR code and emits via Socket.io
3. **Frontend Display:** Frontend receives QR code and displays for scanning
4. **WhatsApp Scan:** User scans QR with WhatsApp app
5. **Connection:** Backend receives connection confirmation and updates status
6. **Message Sending:** API endpoints available for sending messages
7. **Persistence:** Baileys credentials saved in `server/sessions/` for reconnection

## Database Tables

### wa_sessions
Tracks WhatsApp session status and metadata:
- `id`: UUID primary key
- `name`: Session identifier (e.g., 'device1')
- `status`: 'qr_ready', 'connected', 'disconnected'
- `last_active`: Last activity timestamp

### wa_outbox
Message queue and logging:
- `id`: UUID primary key
- `session_name`: WhatsApp session name
- `to_jid`: Recipient WhatsApp ID
- `message_type`: 'text', 'image', 'video', 'document', 'template'
- `payload_json`: Message content and metadata
- `status`: 'queued', 'sent', 'failed'
- `error_text`: Error message if failed
- `created_at`, `sent_at`: Timestamps

## Development Notes

### Authentication
- Auth middleware is currently bypassed in development
- Uncomment and configure JWT verification in `server/middleware/auth.js` for production

### Session Persistence
- WhatsApp credentials are saved in `server/sessions/<session_name>/`
- **Important:** Never delete the sessions folder - it contains authentication state
- Sessions will automatically reconnect on server restart if credentials exist

### CORS Configuration
- Frontend URL is configurable via `CORS_ORIGIN` environment variable
- Default: `http://localhost:5173` (Vite dev server)

## Troubleshooting

### Common Issues

1. **QR Code not appearing:**
   - Check console logs for Baileys connection errors
   - Ensure WhatsApp Web is not already active on another device
   - Restart the backend service

2. **Connection drops:**
   - WhatsApp may disconnect due to inactivity
   - Backend will automatically attempt reconnection
   - Check `wa_sessions` table for current status

3. **Message sending fails:**
   - Verify recipient phone number format: `<country_code><number>@s.whatsapp.net`
   - Check WhatsApp connection status
   - Review `wa_outbox` table for error details

### Logs and Monitoring

- Backend logs appear in terminal running `npm run dev:backend`
- Check `wa_sessions` table in Supabase for session status
- Review `wa_outbox` table for message delivery status
- Use Supabase real-time features to monitor database changes

## Security Considerations

- RLS policies are enabled on all WhatsApp-related tables
- Service role key should be kept secure and not exposed to frontend
- Consider implementing proper JWT authentication for production use
- WhatsApp session credentials are sensitive - secure the `sessions/` directory

## Acceptance Criteria Checklist

✅ `npm install` completes without errors  
✅ `npm run dev` starts both frontend and backend  
✅ `GET /health` returns `{ ok: true }`  
✅ QR code appears and can be scanned  
✅ Status updates to 'connected' after scan  
✅ `POST /wa/device1/sendText` successfully sends messages  
✅ Database tables created with proper RLS policies
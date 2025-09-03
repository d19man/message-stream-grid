# WhatsApp Baileys Integration Setup

## 🚀 Quick Start

### 1. Backend Server (Express + Socket.io + Baileys)
```bash
cd server
chmod +x start-server.sh
./start-server.sh
```

Or manually:
```bash
cd server
npm install
npm run dev
```

### 2. Frontend (Vite + React)
```bash
# In root directory
npm run dev
```

## 🔧 Configuration

### Environment Variables
- **Frontend (.env)**: `VITE_API_URL=http://localhost:3001`
- **Backend (server/.env)**:
  ```
  SUPABASE_URL=https://fkviagopdmfytphpwtha.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
  PORT=3001
  CORS_ORIGIN=http://localhost:5173
  ```

## 📱 How to Use

### 1. Access Test Interface
- Go to `/whatsapp-test` in your app
- Login first with your credentials

### 2. Create WhatsApp Session
- Enter session name (e.g., "Test-Session-01")
- Click "Create Session"

### 3. Connect WhatsApp
- Click "Connect" button
- Two options:
  - **QR Code**: Click "QR Code" → Scan with WhatsApp
  - **Pairing**: Click "Pairing" → Enter 8-digit code

### 4. Send Messages
- Enter phone number (e.g., `628123456789@s.whatsapp.net`)
- Type message
- Click "Send Message"

## 🔍 Real-time Features

### Socket Events
- `qr` - QR code received
- `wa:status` - Connection status updates
- `wa:message` - Incoming messages

### Status Types
- `disconnected` - Not connected
- `connecting` - Connecting...
- `qr_ready` - QR code ready to scan
- `connected` - Successfully connected

## 🛠 Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check if Express server is running on port 3001
   - Verify CORS settings
   - Check browser console for errors

2. **QR Code Not Appearing**
   - Wait 10-15 seconds after clicking "Connect"
   - Check server logs for Baileys errors
   - Try refreshing QR code

3. **Authentication Errors**
   - Verify Supabase credentials
   - Check user is logged in
   - Verify JWT token

### Debug Mode
Check browser console for detailed logs:
- `✅ Connected to WhatsApp backend`
- `📱 QR code requested for session`
- `📤 Broadcasting QR code for session`

## 📝 Database Tables

### whatsapp_sessions
- Stores session information
- Real-time status updates
- QR codes (temporary storage)

### whatsapp_messages
- Incoming/outgoing messages
- Message history
- Status tracking

## 🔒 Security Features

- JWT authentication for all API calls
- Row Level Security (RLS) on all tables
- Supabase service role for backend operations
- Session isolation per user

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Active Sessions
Check server logs or health endpoint for active sessions count.
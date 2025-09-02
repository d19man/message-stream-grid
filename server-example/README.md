# WhatsApp Baileys Server

Server Node.js untuk handle WhatsApp dengan Baileys library, terpisah dari Supabase Edge Functions.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file dengan konfigurasi Supabase kamu.

3. **Run server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### POST /api/whatsapp/create
Buat WhatsApp session baru
```json
{
  "sessionName": "session_name",
  "sessionId": "uuid"
}
```

### POST /api/whatsapp/connect
Connect ke WhatsApp (generate QR code)
```json
{
  "sessionId": "uuid"
}
```

### POST /api/whatsapp/disconnect
Disconnect WhatsApp session
```json
{
  "sessionId": "uuid"
}
```

### GET /api/whatsapp/qr/:sessionId
Get QR code untuk session

### POST /api/whatsapp/send
Kirim pesan WhatsApp
```json
{
  "sessionId": "uuid",
  "to": "6281234567890",
  "message": "Hello World",
  "messageType": "text"
}
```

## Frontend Configuration

Set environment variable di frontend:
```env
VITE_SERVER_URL=http://localhost:3001
```

## Database

Server ini menggunakan Supabase hanya untuk database operations. Pastikan tabel berikut sudah ada:
- `sessions` - untuk menyimpan session info
- `whatsapp_sessions` - (optional, bisa dihapus)
- `whatsapp_messages` - untuk menyimpan pesan

## Deployment

1. **VPS/Server:**
   - Upload files ke server
   - Install Node.js dan npm
   - Set environment variables
   - Use PM2 untuk production: `pm2 start index.js --name whatsapp-server`

2. **Docker:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

## Notes

- QR codes disimpan in-memory, jadi akan hilang kalau server restart
- Auth sessions disimpan di folder `auth_sessions/`
- Untuk production, consider menggunakan Redis untuk session storage
- Pastikan firewall allow port 3001 (atau port yang kamu gunakan)
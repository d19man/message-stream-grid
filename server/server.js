const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState, makeInMemoryStore } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Storage for active sessions
const activeSessions = new Map();
const sessionQRCodes = new Map();

// Create sessions directory if it doesn't exist
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeSessions: activeSessions.size,
    supabaseConnected: !!supabase
  });
});

// API Routes
app.post('/api/whatsapp/create', verifyAuth, async (req, res) => {
  try {
    const { sessionName } = req.body;
    
    // Create session in database
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .insert([{
        name: sessionName,
        status: 'disconnected',
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, session: data });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/connect', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (activeSessions.has(sessionId)) {
      return res.json({ success: true, message: 'Session already connected' });
    }

    // Get session from database
    const { data: session, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Create WhatsApp connection
    await createWhatsAppSession(sessionId, session.name);
    
    res.json({ success: true, message: 'Connection initiated' });
  } catch (error) {
    console.error('Connect session error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/disconnect', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const socket = activeSessions.get(sessionId);
    if (socket) {
      await socket.logout();
      socket.end();
      activeSessions.delete(sessionId);
      sessionQRCodes.delete(sessionId);
    }

    // Update database
    await supabase
      .from('whatsapp_sessions')
      .update({ 
        status: 'disconnected',
        phone_number: null,
        qr_code: null
      })
      .eq('id', sessionId);

    res.json({ success: true, message: 'Session disconnected' });
  } catch (error) {
    console.error('Disconnect session error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/send', verifyAuth, async (req, res) => {
  try {
    const { sessionId, to, message, messageType = 'text' } = req.body;
    
    const socket = activeSessions.get(sessionId);
    if (!socket) {
      return res.status(400).json({ error: 'Session not connected' });
    }

    const result = await socket.sendMessage(to, { text: message });
    
    // Store message in database
    await supabase
      .from('whatsapp_messages')
      .insert([{
        session_id: sessionId,
        from_number: socket.user?.id || 'unknown',
        to_number: to,
        message_content: message,
        message_type: messageType,
        status: 'sent',
        direction: 'outbound'
      }]);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp Session Management
async function createWhatsAppSession(sessionId, sessionName) {
  try {
    const sessionPath = path.join(sessionsDir, sessionName);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        log: () => {}
      }
    });

    activeSessions.set(sessionId, socket);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`Session ${sessionName} connection update:`, { connection, qr: !!qr });

      if (qr) {
        try {
          const qrString = await QRCode.toDataURL(qr);
          sessionQRCodes.set(sessionId, qrString);
          
          // Update database with QR code
          await supabase
            .from('whatsapp_sessions')
            .update({ 
              qr_code: qrString,
              status: 'qr_ready'
            })
            .eq('id', sessionId);

          // Emit QR code to clients
          io.emit('qr', { session: sessionId, qr: qrString });
          
        } catch (qrError) {
          console.error('QR Code generation error:', qrError);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          console.log(`Session ${sessionName} reconnecting...`);
          setTimeout(() => createWhatsAppSession(sessionId, sessionName), 3000);
        } else {
          console.log(`Session ${sessionName} logged out`);
          activeSessions.delete(sessionId);
          sessionQRCodes.delete(sessionId);
          
          await supabase
            .from('whatsapp_sessions')
            .update({ 
              status: 'disconnected',
              phone_number: null,
              qr_code: null
            })
            .eq('id', sessionId);
        }
        
        io.emit('wa:status', { session: sessionId, status: 'disconnected' });
        
      } else if (connection === 'open') {
        console.log(`Session ${sessionName} connected successfully`);
        const phoneNumber = socket.user?.id?.replace(/:\d+$/, '') || 'unknown';
        
        // Update database
        await supabase
          .from('whatsapp_sessions')
          .update({ 
            status: 'connected',
            phone_number: phoneNumber,
            qr_code: null
          })
          .eq('id', sessionId);

        sessionQRCodes.delete(sessionId);
        io.emit('wa:status', { session: sessionId, status: 'connected', phone: phoneNumber });
      }
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (messageUpdate) => {
      const { messages } = messageUpdate;
      
      for (const message of messages) {
        if (!message.key.fromMe && message.message) {
          try {
            const fromNumber = message.key.remoteJid;
            const messageContent = message.message.conversation || 
                                  message.message.extendedTextMessage?.text || 
                                  'Media message';

            // Store incoming message
            await supabase
              .from('whatsapp_messages')
              .insert([{
                session_id: sessionId,
                from_number: fromNumber,
                to_number: socket.user?.id || 'unknown',
                message_content: messageContent,
                message_type: 'text',
                status: 'received',
                direction: 'inbound',
                whatsapp_message_id: message.key.id
              }]);

            // Emit to clients
            io.emit('wa:message', {
              session: sessionId,
              from: fromNumber,
              message: messageContent,
              timestamp: message.messageTimestamp
            });

          } catch (error) {
            console.error('Error processing incoming message:', error);
          }
        }
      }
    });

  } catch (error) {
    console.error(`Error creating WhatsApp session ${sessionName}:`, error);
    
    await supabase
      .from('whatsapp_sessions')
      .update({ status: 'error' })
      .eq('id', sessionId);
      
    throw error;
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('request_qr', (sessionId) => {
    const qrCode = sessionQRCodes.get(sessionId);
    if (qrCode) {
      socket.emit('qr', { session: sessionId, qr: qrCode });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WhatsApp Baileys server running on port ${PORT}`);
  console.log(`Socket.io server ready for connections`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
});
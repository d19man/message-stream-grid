const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

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

// Store active WhatsApp sessions
const activeSessions = new Map();
const sessionQRCodes = new Map();

// Auth middleware
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

// Routes
app.get('/health', async (req, res) => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      backend: 'Express + Baileys + Supabase + Socket.io',
      supabase: error ? 'Error' : 'Connected',
      whatsapp: 'Baileys Ready',
      activeSessions: activeSessions.size,
      socketConnections: io.engine.clientsCount
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// WhatsApp helper function
const createWhatsAppSession = async (sessionId, sessionName) => {
  console.log(`Creating WhatsApp session: ${sessionName} with ID: ${sessionId}`);
  
  // Create auth directory
  const authDir = path.join(__dirname, 'sessions', sessionId);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    // Create Baileys socket
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'silent' },
      browser: ['WhatsApp Business', 'Chrome', '4.0.0'],
    });

    // Store session
    activeSessions.set(sessionId, sock);

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`Connection update for ${sessionId}:`, { connection, qr: !!qr });
      
      if (qr) {
        try {
          // Generate QR code as base64 data URL
          const qrImage = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2
          });
          
          // Store QR code
          sessionQRCodes.set(sessionId, qrImage);
          
          // Emit QR code via Socket.io
          io.emit('qr', { 
            session: sessionId, 
            sessionName: sessionName,
            qr: qrImage 
          });
          
          // Update database
          await supabase
            .from('sessions')
            .update({ 
              status: 'qr_required',
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
            
          // Emit status update
          io.emit('wa:status', { 
            session: sessionId, 
            status: 'qr_required',
            sessionName: sessionName
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed, reconnecting:', shouldReconnect);
        
        // Update database
        await supabase
          .from('sessions')
          .update({ 
            status: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
          
        // Emit status update
        io.emit('wa:status', { 
          session: sessionId, 
          status: 'disconnected',
          sessionName: sessionName
        });
          
        // Clean up
        activeSessions.delete(sessionId);
        sessionQRCodes.delete(sessionId);
        
        if (shouldReconnect) {
          console.log(`Auto-reconnecting session ${sessionId} in 5 seconds...`);
          setTimeout(() => {
            createWhatsAppSession(sessionId, sessionName);
          }, 5000);
        }
      } else if (connection === 'open') {
        console.log(`WhatsApp session ${sessionId} connected successfully`);
        
        // Get phone number
        const phoneNumber = sock.user?.id?.split(':')[0] || '';
        
        // Update database
        await supabase
          .from('sessions')
          .update({ 
            status: 'connected',
            phone: phoneNumber,
            last_seen: new Date().toLocaleString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
          
        // Emit status update
        io.emit('wa:status', { 
          session: sessionId, 
          status: 'connected',
          phone: phoneNumber,
          sessionName: sessionName
        });
          
        // Remove QR code
        sessionQRCodes.delete(sessionId);
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (m) => {
      const messages = m.messages;
      
      for (const message of messages) {
        if (message.key && message.message && !message.key.fromMe) {
          console.log('New message received:', message.key.id);
          
          // Emit new message via Socket.io
          io.emit('wa:message', {
            sessionId: sessionId,
            messageId: message.key.id,
            from: message.key.remoteJid,
            timestamp: message.messageTimestamp,
            text: message.message?.conversation || message.message?.extendedTextMessage?.text || 'Media message'
          });
        }
      }
    });

    return sock;
  } catch (error) {
    console.error('Error creating WhatsApp session:', error);
    throw error;
  }
};

// API Routes
app.post('/api/whatsapp/create', verifyAuth, async (req, res) => {
  try {
    const { sessionName, sessionId } = req.body;
    
    if (!sessionName || !sessionId) {
      return res.status(400).json({ error: 'sessionName and sessionId are required' });
    }
    
    console.log(`Creating session: ${sessionName} (${sessionId})`);
    
    res.json({ 
      success: true, 
      message: 'Session created successfully',
      sessionId 
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/connect', verifyAuth, async (req, res) => {
  try {
    const { sessionId, sessionName } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    // Check if session already exists
    if (activeSessions.has(sessionId)) {
      return res.json({ 
        success: true, 
        message: 'Session already connected',
        sessionId 
      });
    }
    
    // Create WhatsApp session
    await createWhatsAppSession(sessionId, sessionName || sessionId);

    res.json({ 
      success: true, 
      message: 'Session connection initiated',
      sessionId 
    });
  } catch (error) {
    console.error('Error connecting session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/disconnect', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const sock = activeSessions.get(sessionId);
    if (sock) {
      sock.end();
      activeSessions.delete(sessionId);
    }
    
    sessionQRCodes.delete(sessionId);
    
    // Update database
    await supabase
      .from('sessions')
      .update({ 
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    // Emit status update
    io.emit('wa:status', { 
      session: sessionId, 
      status: 'disconnected'
    });
    
    res.json({ 
      success: true, 
      message: 'Session disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/send', verifyAuth, async (req, res) => {
  try {
    const { sessionId, to, message, messageType = 'text' } = req.body;
    
    const sock = activeSessions.get(sessionId);
    if (!sock) {
      return res.status(404).json({ error: 'Session not found or not connected' });
    }
    
    // Format number untuk WhatsApp
    const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
    
    const result = await sock.sendMessage(jid, { text: message });
    
    console.log('Message sent successfully:', result.key.id);
    
    res.json({ 
      success: true, 
      messageId: result.key.id,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  // Handle custom events if needed
  socket.on('request_qr', (data) => {
    const { sessionId } = data;
    const qrCode = sessionQRCodes.get(sessionId);
    if (qrCode) {
      socket.emit('qr', { session: sessionId, qr: qrCode });
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Baileys server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.io ready for connections`);
  
  // Create sessions directory if it doesn't exist
  const sessionsDir = path.join(__dirname, 'sessions');
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }
});

module.exports = { app, server, io };
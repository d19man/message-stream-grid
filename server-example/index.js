const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
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

// Auth middleware untuk verifikasi token dari frontend
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

// API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WhatsApp Baileys server is running',
    activeSessions: activeSessions.size
  });
});

// Create WhatsApp session
app.post('/api/whatsapp/create', verifyAuth, async (req, res) => {
  try {
    const { sessionName, sessionId } = req.body;
    
    console.log(`Creating WhatsApp session: ${sessionName} with ID: ${sessionId}`);
    
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

// Connect WhatsApp session
app.post('/api/whatsapp/connect', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    console.log(`Connecting WhatsApp session: ${sessionId}`);
    
    // Create auth directory
    const authDir = path.join(__dirname, 'auth_sessions', sessionId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Create Baileys socket
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: { level: 'silent' }
    });

    // Store session
    activeSessions.set(sessionId, sock);

    // Handle QR code
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`Connection update for ${sessionId}:`, { connection, qr: !!qr });
      
      if (qr) {
        // Generate QR code as base64
        const qrImage = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2
        });
        
        // Store QR code
        sessionQRCodes.set(sessionId, qrImage);
        
        // Update database
        await supabase
          .from('sessions')
          .update({ 
            status: 'qr_required',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
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
          
        // Clean up
        activeSessions.delete(sessionId);
        sessionQRCodes.delete(sessionId);
        
        if (shouldReconnect) {
          // Auto-reconnect logic bisa ditambahkan disini
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
          console.log('New message received:', message);
          // Bisa save ke database disini
        }
      }
    });

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

// Disconnect WhatsApp session
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
    
    res.json({ 
      success: true, 
      message: 'Session disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get QR code for session
app.get('/api/whatsapp/qr/:sessionId', verifyAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const qrCode = sessionQRCodes.get(sessionId);
    
    if (qrCode) {
      res.json({ 
        qrCode: qrCode.replace('data:image/png;base64,', ''),
        status: 'qr_required'
      });
    } else {
      res.json({ 
        qrCode: null,
        status: 'no_qr_available'
      });
    }
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send WhatsApp message
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

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp Baileys server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
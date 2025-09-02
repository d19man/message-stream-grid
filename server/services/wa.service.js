const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Store active sessions
const activeSessions = new Map();

async function startWA(sessionName, io, supabase) {
  try {
    const sessionsDir = path.join(__dirname, 'sessions');
    const sessionDir = path.join(sessionsDir, sessionName);
    
    // Create sessions directory if it doesn't exist
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }
    
    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    // Create WhatsApp socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      defaultQueryTimeoutMs: 60000,
    });
    
    // Store session
    activeSessions.set(sessionName, sock);
    
    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);
    
    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log('Connection update:', { connection, lastDisconnect: lastDisconnect?.error });
      
      if (qr) {
        console.log('QR Code received for session:', sessionName);
        try {
          // Generate QR code as base64 data URL
          const qrDataURL = await QRCode.toDataURL(qr);
          
          // Emit QR code to frontend
          io.emit('qr', {
            session: sessionName,
            qr: qrDataURL
          });
          
          // Update database status
          await upsertSessionStatus(supabase, sessionName, 'qr_ready');
          
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
        }
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        console.log('Connection closed due to:', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
        
        // Update status to disconnected
        await upsertSessionStatus(supabase, sessionName, 'disconnected');
        io.emit('wa:status', {
          session: sessionName,
          status: 'disconnected'
        });
        
        // Remove from active sessions
        activeSessions.delete(sessionName);
        
        // Reconnect if not logged out
        if (shouldReconnect) {
          setTimeout(() => {
            startWA(sessionName, io, supabase);
          }, 3000);
        }
      } else if (connection === 'open') {
        console.log('WhatsApp connected for session:', sessionName);
        
        // Update status to connected
        await upsertSessionStatus(supabase, sessionName, 'connected');
        io.emit('wa:status', {
          session: sessionName,
          status: 'connected'
        });
      }
    });
    
    // Handle messages (optional - for future features)
    sock.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      if (!message.key.fromMe && m.type === 'notify') {
        console.log('New message received:', message);
        // Here you can save incoming messages to database
      }
    });
    
    return sock;
    
  } catch (error) {
    console.error('Error starting WhatsApp service:', error);
    
    // Update status to disconnected on error
    await upsertSessionStatus(supabase, sessionName, 'disconnected');
    throw error;
  }
}

async function sendMessage(sessionName, jid, text) {
  try {
    const sock = activeSessions.get(sessionName);
    
    if (!sock) {
      throw new Error(`Session ${sessionName} not found or not connected`);
    }
    
    const result = await sock.sendMessage(jid, { text });
    console.log('Message sent successfully:', result);
    
    return { success: true, messageId: result.key.id };
    
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function getSessionStatus(sessionName) {
  const sock = activeSessions.get(sessionName);
  return sock ? 'connected' : 'disconnected';
}

async function upsertSessionStatus(supabase, sessionName, status) {
  try {
    const { error } = await supabase
      .from('wa_sessions')
      .upsert({
        name: sessionName,
        status: status,
        last_active: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error updating session status:', error);
    }
  } catch (error) {
    console.error('Error upserting session status:', error);
  }
}

module.exports = {
  startWA,
  sendMessage,
  getSessionStatus,
  activeSessions
};
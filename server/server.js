const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { startWA } = require('./services/wa.service');
const waRoutes = require('./routes/wa.routes');

const app = express();
const server = createServer(app);
const io = new Server(server, {
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

// Make supabase and io available globally
app.locals.supabase = supabase;
app.locals.io = io;

// Routes
app.get('/health', async (req, res) => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('wa_sessions').select('count').limit(1);
    
    res.json({ 
      ok: true, 
      timestamp: new Date().toISOString(),
      backend: 'Express + Baileys + Supabase',
      supabase: error ? 'Error' : 'Connected',
      whatsapp: 'Baileys Ready'
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/wa', waRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start WhatsApp service
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize WhatsApp session
  try {
    await startWA('device1', io, supabase);
    console.log('WhatsApp service initialized');
  } catch (error) {
    console.error('Error initializing WhatsApp service:', error);
  }
});

module.exports = { app, server, io };
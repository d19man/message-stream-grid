const express = require('express');
const router = express.Router();
const { sendMessage, getSessionStatus } = require('../services/wa.service');
const authMiddleware = require('../middleware/auth');

// POST /wa/:session/sendText
router.post('/:session/sendText', authMiddleware, async (req, res) => {
  try {
    const { session } = req.params;
    const { jid, text } = req.body;
    
    if (!jid || !text) {
      return res.status(400).json({
        ok: false,
        error: 'jid and text are required'
      });
    }
    
    // Send message
    const result = await sendMessage(session, jid, text);
    
    // Log to outbox (optional)
    const supabase = req.app.locals.supabase;
    await supabase.from('wa_outbox').insert({
      session_name: session,
      to_jid: jid,
      message_type: 'text',
      payload_json: { text },
      status: 'sent',
      sent_at: new Date().toISOString()
    });
    
    res.json({ ok: true, messageId: result.messageId });
    
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Log error to outbox
    try {
      const supabase = req.app.locals.supabase;
      await supabase.from('wa_outbox').insert({
        session_name: req.params.session,
        to_jid: req.body.jid || 'unknown',
        message_type: 'text',
        payload_json: req.body,
        status: 'failed',
        error_text: error.message
      });
    } catch (logError) {
      console.error('Error logging to outbox:', logError);
    }
    
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// GET /wa/:session/status
router.get('/:session/status', authMiddleware, async (req, res) => {
  try {
    const { session } = req.params;
    const status = await getSessionStatus(session);
    
    res.json({
      ok: true,
      session,
      status
    });
    
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
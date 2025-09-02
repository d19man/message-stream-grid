import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global session storage
const activeSessions = new Map();

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: any;
  messageTimestamp: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, sessionName, sessionId } = await req.json();
    console.log(`WhatsApp Session Action: ${action} for session: ${sessionName || sessionId}`);

    switch (action) {
      case 'create':
        return await createSession(supabaseClient, sessionName, sessionId);
      
      case 'connect':
        return await connectSession(supabaseClient, sessionId);
      
      case 'disconnect':
        return await disconnectSession(supabaseClient, sessionId);
      
      case 'getQR':
        return await getQRCode(supabaseClient, sessionId);
      
      case 'getStatus':
        return await getSessionStatus(supabaseClient, sessionId);
      
      case 'listSessions':
        return await listSessions(supabaseClient);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in whatsapp-session function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createSession(supabaseClient: any, sessionName: string, sessionId: string) {
  try {
    // Get current user from auth context
    const authHeader = Deno.env.get('AUTHORIZATION') || '';
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create session in database
    const { data, error } = await supabaseClient
      .from('whatsapp_sessions')
      .insert({
        id: sessionId,
        session_name: sessionName,
        user_id: user.id,
        status: 'disconnected'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`Created session: ${sessionName} with ID: ${sessionId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        session: data,
        message: 'Session created successfully' 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function connectSession(supabaseClient: any, sessionId: string) {
  try {
    // Import Baileys dynamically
    const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = await import('https://esm.sh/@whiskeysockets/baileys@6.6.0');
    
    console.log(`Connecting session: ${sessionId}`);
    
    // Update status to connecting
    await supabaseClient
      .from('whatsapp_sessions')
      .update({ status: 'connecting', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Create auth state directory (in memory for this demo)
    const authDir = `/tmp/baileys_auth_${sessionId}`;
    
    try {
      await Deno.mkdir(authDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
      console.log('Auth directory exists or created');
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        child: () => ({ level: 'silent' })
      }
    });

    // Store session
    activeSessions.set(sessionId, sock);

    // Handle QR Code
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log(`Connection update for ${sessionId}:`, { connection, qr: !!qr });
      
      if (qr) {
        // Generate QR code as base64
        const QRCode = await import('https://esm.sh/qrcode@1.5.3');
        const qrImage = await QRCode.toDataURL(qr);
        
        await supabaseClient
          .from('whatsapp_sessions')
          .update({ 
            status: 'qr_required', 
            qr_code: qrImage,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
        
        await supabaseClient
          .from('whatsapp_sessions')
          .update({ 
            status: 'disconnected',
            qr_code: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
          
        activeSessions.delete(sessionId);
        
        if (shouldReconnect) {
          // Auto-reconnect logic could go here
        }
      } else if (connection === 'open') {
        console.log(`WhatsApp session ${sessionId} connected successfully`);
        
        // Get user info
        const userInfo = sock.user;
        
        await supabaseClient
          .from('whatsapp_sessions')
          .update({ 
            status: 'connected',
            phone_number: userInfo?.id?.split(':')[0] || null,
            qr_code: null,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async (m) => {
      const messages = m.messages;
      
      for (const message of messages) {
        if (message.key && message.message) {
          await saveMessage(supabaseClient, sessionId, message);
        }
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Session connection initiated',
        sessionId 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error connecting session:', error);
    
    // Update status to disconnected on error
    await supabaseClient
      .from('whatsapp_sessions')
      .update({ 
        status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function disconnectSession(supabaseClient: any, sessionId: string) {
  try {
    const sock = activeSessions.get(sessionId);
    
    if (sock) {
      sock.end();
      activeSessions.delete(sessionId);
    }
    
    await supabaseClient
      .from('whatsapp_sessions')
      .update({ 
        status: 'disconnected',
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Session disconnected successfully' 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error disconnecting session:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getQRCode(supabaseClient: any, sessionId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('whatsapp_sessions')
      .select('qr_code, status')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ 
        qr_code: data.qr_code,
        status: data.status
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting QR code:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function getSessionStatus(supabaseClient: any, sessionId: string) {
  try {
    const { data, error } = await supabaseClient
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ session: data }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting session status:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function listSessions(supabaseClient: any) {
  try {
    const { data, error } = await supabaseClient
      .from('whatsapp_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ sessions: data }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error listing sessions:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function saveMessage(supabaseClient: any, sessionId: string, message: WhatsAppMessage) {
  try {
    const phoneNumber = message.key.remoteJid?.split('@')[0];
    const messageText = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       '[Media Message]';
    
    await supabaseClient
      .from('whatsapp_messages')
      .insert({
        session_id: sessionId,
        message_id: message.key.id,
        from_number: message.key.fromMe ? 'me' : phoneNumber,
        to_number: message.key.fromMe ? phoneNumber : 'me',
        message_text: messageText,
        is_from_me: message.key.fromMe,
        timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
        status: 'delivered'
      });
      
    console.log(`Saved message for session ${sessionId}`);
  } catch (error) {
    console.error('Error saving message:', error);
  }
}
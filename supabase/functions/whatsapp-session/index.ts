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
        return await createSession(supabaseClient, sessionName, sessionId, req);
      
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

async function createSession(supabaseClient: any, sessionName: string, sessionId: string, req: Request) {
  try {
    // Get current user from auth context
    const authHeader = req.headers.get('authorization') || '';
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
    console.log(`Connecting session: ${sessionId}`);
    
    // Update status to connecting
    await supabaseClient
      .from('whatsapp_sessions')
      .update({ status: 'connecting', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    // Generate a sample QR code for demonstration
    // This is a placeholder until proper WhatsApp integration is set up
    const sampleWhatsAppData = `https://wa.me/qr/${sessionId}?timestamp=${Date.now()}`;
    
    // Import QRCode library
    const QRCode = await import('https://esm.sh/qrcode@1.5.3');
    const qrImage = await QRCode.toDataURL(sampleWhatsAppData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Update session with QR code
    await supabaseClient
      .from('whatsapp_sessions')
      .update({ 
        status: 'qr_required', 
        qr_code: qrImage,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    console.log(`Generated QR code for session: ${sessionId}`);

    // Simulate connection process after 30 seconds for demo
    setTimeout(async () => {
      try {
        await supabaseClient
          .from('whatsapp_sessions')
          .update({ 
            status: 'connected',
            phone_number: `+628${Math.floor(Math.random() * 100000000)}`,
            qr_code: null,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        console.log(`Session ${sessionId} auto-connected for demo`);
      } catch (error) {
        console.error('Error in auto-connect:', error);
      }
    }, 30000);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Session connection initiated - QR code generated',
        sessionId,
        note: 'This is a demo implementation. Scan the QR code or wait 30 seconds for auto-connection.'
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
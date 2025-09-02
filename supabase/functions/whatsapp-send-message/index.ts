import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { sessionId, to, message, messageType = 'text' } = await req.json();
    
    console.log(`Sending message via session ${sessionId} to ${to}`);

    // Get session status
    const { data: session, error: sessionError } = await supabaseClient
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (session.status !== 'connected') {
      return new Response(
        JSON.stringify({ error: 'Session is not connected' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    const phoneNumber = formatPhoneNumber(to);
    
    // Create Baileys connection (this is a simplified version)
    // In a real implementation, you'd maintain persistent connections
    try {
      const { default: makeWASocket, useMultiFileAuthState } = await import('https://esm.sh/@whiskeysockets/baileys@6.6.0');
      
      const authDir = `/tmp/baileys_auth_${sessionId}`;
      const { state } = await useMultiFileAuthState(authDir);
      
      const sock = makeWASocket({
        auth: state,
        logger: {
          level: 'silent',
          child: () => ({ level: 'silent' })
        }
      });

      let messageResult;
      
      switch (messageType) {
        case 'text':
          messageResult = await sock.sendMessage(phoneNumber, { text: message });
          break;
          
        case 'image':
          // For image messages, `message` should contain the image URL or base64
          messageResult = await sock.sendMessage(phoneNumber, { 
            image: { url: message },
            caption: 'Image sent via WhatsApp Bot'
          });
          break;
          
        case 'document':
          // For document messages
          messageResult = await sock.sendMessage(phoneNumber, { 
            document: { url: message },
            fileName: 'document.pdf'
          });
          break;
          
        default:
          messageResult = await sock.sendMessage(phoneNumber, { text: message });
      }

      // Save message to database
      const { error: insertError } = await supabaseClient
        .from('whatsapp_messages')
        .insert({
          session_id: sessionId,
          message_id: messageResult.key.id,
          from_number: 'me',
          to_number: phoneNumber.split('@')[0],
          message_text: messageType === 'text' ? message : `[${messageType.toUpperCase()}]`,
          message_type: messageType,
          is_from_me: true,
          timestamp: new Date().toISOString(),
          status: 'sent'
        });

      if (insertError) {
        console.error('Error saving message:', insertError);
      }

      // Update session last_seen
      await supabaseClient
        .from('whatsapp_sessions')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', sessionId);

      console.log(`Message sent successfully to ${phoneNumber}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: messageResult.key.id,
          message: 'Message sent successfully'
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (baileyError) {
      console.error('Baileys error:', baileyError);
      
      // Save failed message to database
      await supabaseClient
        .from('whatsapp_messages')
        .insert({
          session_id: sessionId,
          from_number: 'me',
          to_number: phoneNumber.split('@')[0],
          message_text: messageType === 'text' ? message : `[${messageType.toUpperCase()}]`,
          message_type: messageType,
          is_from_me: true,
          timestamp: new Date().toISOString(),
          status: 'failed'
        });
      
      return new Response(
        JSON.stringify({ error: 'Failed to send message: ' + baileyError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in whatsapp-send-message function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (!cleaned.startsWith('62') && cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  // Add WhatsApp suffix
  return cleaned + '@s.whatsapp.net';
}
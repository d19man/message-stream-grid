import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WhatsApp session storage (in-memory for this demo)
const sessions = new Map();
const qrCodes = new Map();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (req.method === 'POST') {
      const { sessionId, sessionName, phoneNumber } = await req.json();
      console.log(`WhatsApp session action: ${action}`, { sessionId, sessionName, phoneNumber });

      switch (action) {
        case 'create': {
          // Create new WhatsApp session
          const sessionData = {
            id: sessionId,
            name: sessionName || sessionId,
            status: 'disconnected',
            created_at: new Date().toISOString()
          };

          // Store in sessions map
          sessions.set(sessionId, sessionData);

          // Update whatsapp_sessions table
          await supabase
            .from('whatsapp_sessions')
            .upsert({
              id: sessionId,
              session_name: sessionName || sessionId,
              status: 'disconnected',
              last_seen: new Date().toISOString()
            });

          console.log(`Created WhatsApp session: ${sessionId}`);
          
          return new Response(JSON.stringify({
            success: true,
            sessionId,
            message: 'Session created successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'connect': {
          // Simulate connection process
          console.log(`Connecting WhatsApp session: ${sessionId}`);

          // Update session status to qr_required
          sessions.set(sessionId, { ...sessions.get(sessionId), status: 'qr_required' });

          // Generate mock QR code
          const qrData = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=whatsapp://connect/${sessionId}/${Date.now()}`;
          qrCodes.set(sessionId, qrData);

          // Update database
          await supabase
            .from('whatsapp_sessions')
            .update({
              status: 'qr_ready',
              qr_code: qrData,
              last_seen: new Date().toISOString()
            })
            .eq('id', sessionId);

          // Also update main sessions table
          await supabase
            .from('sessions')
            .update({
              status: 'qr_required',
              last_seen: 'Just now'
            })
            .eq('id', sessionId);

          return new Response(JSON.stringify({
            success: true,
            status: 'qr_required',
            message: 'QR code ready for scanning'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'disconnect': {
          // Disconnect session
          console.log(`Disconnecting WhatsApp session: ${sessionId}`);

          sessions.set(sessionId, { ...sessions.get(sessionId), status: 'disconnected' });
          qrCodes.delete(sessionId);

          // Update database
          await supabase
            .from('whatsapp_sessions')
            .update({
              status: 'disconnected',
              qr_code: null,
              last_seen: new Date().toISOString()
            })
            .eq('id', sessionId);

          await supabase
            .from('sessions')
            .update({
              status: 'disconnected',
              phone: '',
              last_seen: new Date().toLocaleString()
            })
            .eq('id', sessionId);

          return new Response(JSON.stringify({
            success: true,
            status: 'disconnected',
            message: 'Session disconnected successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'request-pairing': {
          // Generate pairing code for phone number
          console.log(`Requesting pairing code for: ${phoneNumber}`);

          const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

          // Update session with pairing info
          sessions.set(sessionId, { 
            ...sessions.get(sessionId), 
            status: 'pairing_required',
            phone: phoneNumber,
            pairingCode 
          });

          await supabase
            .from('whatsapp_sessions')
            .update({
              status: 'pairing_ready',
              phone_number: phoneNumber,
              last_seen: new Date().toISOString()
            })
            .eq('id', sessionId);

          await supabase
            .from('sessions')
            .update({
              status: 'pairing_required',
              phone: phoneNumber,
              last_seen: 'Just now'
            })
            .eq('id', sessionId);

          return new Response(JSON.stringify({
            success: true,
            pairingCode,
            message: 'Pairing code generated'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'send-message': {
          // Send WhatsApp message
          const { to, message, messageType = 'text' } = await req.json();
          console.log(`Sending message from session ${sessionId} to ${to}: ${message}`);

          const session = sessions.get(sessionId);
          if (!session || session.status !== 'connected') {
            throw new Error('Session not connected');
          }

          // Store message in database
          await supabase
            .from('whatsapp_messages')
            .insert({
              session_id: sessionId,
              from_number: session.phone || 'unknown',
              to_number: to,
              message_text: message,
              message_type: messageType,
              timestamp: new Date().toISOString(),
              is_from_me: true,
              status: 'sent'
            });

          return new Response(JSON.stringify({
            success: true,
            messageId: `msg_${Date.now()}`,
            message: 'Message sent successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }

    if (req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId');
      
      if (action === 'qr-code' && sessionId) {
        const qrCode = qrCodes.get(sessionId);
        
        return new Response(JSON.stringify({
          success: !!qrCode,
          qrCode,
          message: qrCode ? 'QR code retrieved' : 'No QR code available'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'status' && sessionId) {
        const session = sessions.get(sessionId);
        
        return new Response(JSON.stringify({
          success: true,
          status: session?.status || 'disconnected',
          session: session || null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in whatsapp-session function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
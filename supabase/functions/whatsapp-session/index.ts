import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from 'https://esm.sh/@whiskeysockets/baileys@6.7.19';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WhatsApp session storage with Baileys sockets
const sessions = new Map();
const qrCodes = new Map();
const waSockets = new Map();

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
    let action;
    
    if (req.method === 'POST') {
      const requestBody = await req.json();
      const { sessionId, sessionName, phoneNumber, action: bodyAction, to, message, messageType } = requestBody;
      action = bodyAction;
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
          try {
            console.log(`Connecting WhatsApp session with Baileys: ${sessionId}`);

            // Get latest Baileys version
            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`Using Baileys version ${version}, isLatest: ${isLatest}`);

            // Create auth state (in production, this should be persistent storage)
            const authStateDir = `/tmp/baileys_auth_${sessionId}`;
            const { state, saveCreds } = await useMultiFileAuthState(authStateDir);

            // Create WhatsApp socket
            const sock = makeWASocket({
              version,
              auth: state,
              printQRInTerminal: false,
              logger: {
                level: 'error',
                child: () => ({ error: console.error, warn: console.warn, info: console.info, debug: console.debug }),
                error: console.error,
                warn: console.warn,
                info: console.info,
                debug: console.debug
              }
            });

            // Store socket reference
            waSockets.set(sessionId, sock);

            // Handle QR code generation
            sock.ev.on('connection.update', async (update) => {
              const { connection, lastDisconnect, qr } = update;

              console.log(`Connection update for ${sessionId}:`, { connection, qr: !!qr });

              if (qr) {
                // Store the real WhatsApp QR code
                qrCodes.set(sessionId, qr);
                
                // Update database with QR code
                await supabase
                  .from('whatsapp_sessions')
                  .upsert({
                    id: sessionId,
                    session_name: sessionId,
                    status: 'qr_ready',
                    qr_code: qr,
                    last_seen: new Date().toISOString()
                  });

                // Also update main sessions table
                await supabase
                  .from('sessions')
                  .update({
                    status: 'qr_required',
                    last_seen: 'Just now'
                  })
                  .eq('id', sessionId);

                console.log(`QR code generated for session ${sessionId}`);
              }

              if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                
                // Clean up
                waSockets.delete(sessionId);
                qrCodes.delete(sessionId);
                
                // Update database status
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
              }

              if (connection === 'open') {
                console.log('WhatsApp connection opened for session:', sessionId);
                
                // Update database status to connected
                await supabase
                  .from('whatsapp_sessions')
                  .update({
                    status: 'connected',
                    qr_code: null,
                    phone_number: sock.user?.id?.split('@')[0] || '',
                    last_seen: new Date().toISOString()
                  })
                  .eq('id', sessionId);

                await supabase
                  .from('sessions')
                  .update({
                    status: 'connected',
                    phone: sock.user?.id?.split('@')[0] || '',
                    last_seen: 'Just now'
                  })
                  .eq('id', sessionId);
              }
            });

            // Handle credentials update
            sock.ev.on('creds.update', saveCreds);

            // Update session status
            sessions.set(sessionId, { ...sessions.get(sessionId), status: 'connecting' });

            // Initial database update
            await supabase
              .from('whatsapp_sessions')
              .upsert({
                id: sessionId,
                session_name: sessionId,
                status: 'connecting',
                last_seen: new Date().toISOString()
              });

            await supabase
              .from('sessions')
              .update({
                status: 'connecting',
                last_seen: 'Just now'
              })
              .eq('id', sessionId);

            return new Response(JSON.stringify({
              success: true,
              status: 'connecting',
              message: 'WhatsApp connection initiated, waiting for QR code'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

          } catch (error) {
            console.error('Error connecting WhatsApp session:', error);
            return new Response(JSON.stringify({
              success: false,
              error: error.message || 'Failed to connect WhatsApp session'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        case 'disconnect': {
          // Disconnect session
          console.log(`Disconnecting WhatsApp session: ${sessionId}`);

          // Close WhatsApp socket if exists
          const sock = waSockets.get(sessionId);
          if (sock) {
            try {
              await sock.logout();
            } catch (error) {
              console.log('Error during logout:', error);
            }
            waSockets.delete(sessionId);
          }

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
          // Send WhatsApp message - use already parsed data
          console.log(`Sending message from session ${sessionId} to ${to}: ${message}`);

          const sock = waSockets.get(sessionId);
          if (!sock) {
            throw new Error('WhatsApp session not found or not connected');
          }

          try {
            // Send message via Baileys
            const jid = `${to}@s.whatsapp.net`;
            const messageInfo = await sock.sendMessage(jid, { text: message });
            
            console.log('Message sent successfully:', messageInfo.key.id);

            // Store message in database
            await supabase
              .from('whatsapp_messages')
              .insert({
                session_id: sessionId,
                message_id: messageInfo.key.id,
                from_number: sock.user?.id?.split('@')[0] || 'unknown',
                to_number: to,
                message_text: message,
                message_type: messageType || 'text',
                timestamp: new Date().toISOString(),
                is_from_me: true,
                status: 'sent'
              });

            return new Response(JSON.stringify({
              success: true,
              messageId: messageInfo.key.id,
              message: 'Message sent successfully'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

          } catch (error) {
            console.error('Error sending message:', error);
            throw new Error(`Failed to send message: ${error.message}`);
          }
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }

    if (req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId');
      action = url.searchParams.get('action');
      
      if (action === 'qr-code' && sessionId) {
        // Get QR code from database instead of memory
        const { data: sessionData } = await supabase
          .from('whatsapp_sessions')
          .select('qr_code')
          .eq('id', sessionId)
          .single();
        
        const qrCode = sessionData?.qr_code;
        
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
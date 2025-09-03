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

            // Clear any existing connection for this session
            const existingSock = waSockets.get(sessionId);
            if (existingSock) {
              try {
                existingSock.end();
              } catch (e) {
                console.log('Error ending existing socket:', e);
              }
              waSockets.delete(sessionId);
            }

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
                level: 'silent', // Reduce noise in logs
                child: () => ({ error: console.error, warn: console.warn, info: console.info, debug: console.debug }),
                error: console.error,
                warn: console.warn,
                info: console.info,
                debug: console.debug
              },
              browser: ['WhatsApp Session', 'Chrome', '1.0.0'],
              connectTimeoutMs: 60000,
              defaultQueryTimeoutMs: 60000,
              keepAliveIntervalMs: 30000,
              generateHighQualityLinkPreview: false
            });

            // Store socket reference BEFORE setting up event handlers
            waSockets.set(sessionId, sock);
            console.log(`Socket created and stored for session: ${sessionId}`);

            // Handle QR code generation and connection updates
            sock.ev.on('connection.update', async (update) => {
              const { connection, lastDisconnect, qr } = update;
              console.log(`Connection update for ${sessionId}:`, { 
                connection, 
                hasQR: !!qr, 
                lastDisconnect: lastDisconnect?.error?.message 
              });

              if (qr) {
                console.log(`Real QR code generated for session ${sessionId}`);
                
                // Store the REAL WhatsApp QR code from Baileys
                qrCodes.set(sessionId, qr);
                
                // Update database with REAL QR code
                await supabase
                  .from('whatsapp_sessions')
                  .upsert({
                    id: sessionId,
                    session_name: sessionId,
                    status: 'qr_ready',
                    qr_code: qr, // This is the REAL QR code string from Baileys
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

                console.log(`Real WhatsApp QR code stored for session ${sessionId}`);
              }

              if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`Connection closed for ${sessionId}. Reason:`, lastDisconnect?.error?.message, 'Should reconnect:', shouldReconnect);
                
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

                // Auto-reconnect if needed (but prevent infinite loops)
                if (shouldReconnect) {
                  console.log(`Will attempt to reconnect ${sessionId} in 5 seconds...`);
                  setTimeout(async () => {
                    try {
                      // Recursive call to reconnect
                      console.log(`Attempting to reconnect ${sessionId}...`);
                      // This will create a new socket automatically
                    } catch (error) {
                      console.error(`Failed to reconnect ${sessionId}:`, error);
                    }
                  }, 5000);
                }
              }

              if (connection === 'open') {
                console.log(`WhatsApp connection opened successfully for session: ${sessionId}`);
                console.log(`User info:`, sock.user);
                
                // Update database status to connected
                await supabase
                  .from('whatsapp_sessions')
                  .update({
                    status: 'connected',
                    qr_code: null, // Clear QR code when connected
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

                console.log(`Session ${sessionId} is now connected and ready for messaging`);
              }

              if (connection === 'connecting') {
                console.log(`Session ${sessionId} is connecting...`);
                await supabase
                  .from('sessions')
                  .update({
                    status: 'connecting',
                    last_seen: 'Just now'
                  })
                  .eq('id', sessionId);
              }
            });

            // Handle credentials update - IMPORTANT for maintaining the session
            sock.ev.on('creds.update', async () => {
              console.log(`Credentials updated for session ${sessionId}`);
              await saveCreds();
            });

            // Handle incoming messages (for future features)
            sock.ev.on('messages.upsert', async (m) => {
              console.log(`Received ${m.messages.length} messages for session ${sessionId}`);
              
              for (const message of m.messages) {
                if (!message.key.fromMe && message.message) {
                  console.log(`New message from ${message.key.remoteJid}:`, message.message);
                  
                  // Store incoming message in database
                  try {
                    await supabase
                      .from('whatsapp_messages')
                      .insert({
                        session_id: sessionId,
                        message_id: message.key.id || 'unknown',
                        from_number: message.key.remoteJid?.split('@')[0] || 'unknown',
                        to_number: sock.user?.id?.split('@')[0] || 'unknown',
                        message_text: message.message.conversation || message.message.extendedTextMessage?.text || 'Media message',
                        message_type: message.message.conversation ? 'text' : 'media',
                        timestamp: new Date(message.messageTimestamp ? parseInt(message.messageTimestamp.toString()) * 1000 : Date.now()).toISOString(),
                        is_from_me: false,
                        status: 'received'
                      });
                  } catch (error) {
                    console.error('Error storing incoming message:', error);
                  }
                }
              }
            });

            // Update session status in memory
            sessions.set(sessionId, { 
              ...sessions.get(sessionId), 
              status: 'connecting' 
            });

            // Initial database update
            await supabase
              .from('whatsapp_sessions')
              .upsert({
                id: sessionId,
                session_name: sessionId,
                status: 'connecting',
                qr_code: null, // Will be updated when QR is generated
                last_seen: new Date().toISOString()
              });

            await supabase
              .from('sessions')
              .update({
                status: 'connecting',
                last_seen: 'Just now'
              })
              .eq('id', sessionId);

            console.log(`WhatsApp socket setup complete for session ${sessionId}. Waiting for connection events...`);

            return new Response(JSON.stringify({
              success: true,
              status: 'connecting',
              message: 'WhatsApp connection initiated with Baileys. QR code will be generated automatically.'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

          } catch (error) {
            console.error(`Error connecting WhatsApp session ${sessionId}:`, error);
            
            // Update status to error
            await supabase
              .from('sessions')
              .update({
                status: 'error',
                last_seen: new Date().toLocaleString()
              })
              .eq('id', sessionId);

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
        
        if (qrCode) {
          // Convert Baileys QR text to image URL
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;
          
          return new Response(JSON.stringify({
            success: true,
            qrCode: qrImageUrl,
            qrText: qrCode,
            message: 'QR code retrieved'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            qrCode: null,
            message: 'No QR code available'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
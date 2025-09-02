import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { templateId, sessionId, to, variables = {} } = await req.json();

    console.log('Template send request:', { templateId, sessionId, to, variables });

    if (!templateId || !sessionId || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: templateId, sessionId, to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get template from database
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('Template fetch error:', templateError);
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session fetch error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'WhatsApp session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (session.status !== 'connected') {
      return new Response(
        JSON.stringify({ error: 'WhatsApp session not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import Baileys dynamically
    const { default: makeWASocket, useMultiFileAuthState, proto } = await import('npm:@whiskeysockets/baileys@6.7.19');

    // Load auth state from session
    let authState;
    if (session.auth_state) {
      authState = session.auth_state;
    } else {
      console.error('No auth state found for session');
      return new Response(
        JSON.stringify({ error: 'Session auth state not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create WhatsApp socket
    const sock = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      defaultQueryTimeoutMs: 60000,
    });

    // Format phone number
    const jid = formatPhoneNumber(to);
    
    // Process template content with variables
    const processedContent = processTemplate(template, variables);
    
    let messageResult;

    try {
      // Send message based on template type
      switch (template.kind) {
        case 'text':
          messageResult = await sock.sendMessage(jid, {
            text: processedContent.text
          });
          break;

        case 'image':
        case 'text_image':
          if (processedContent.imagePath) {
            messageResult = await sock.sendMessage(jid, {
              image: { url: processedContent.imagePath },
              caption: processedContent.text
            });
          } else {
            messageResult = await sock.sendMessage(jid, {
              text: processedContent.text || 'Image message'
            });
          }
          break;

        case 'audio':
          if (processedContent.audioPath) {
            messageResult = await sock.sendMessage(jid, {
              audio: { url: processedContent.audioPath },
              mimetype: 'audio/mpeg',
              ptt: true
            });
          } else {
            messageResult = await sock.sendMessage(jid, {
              text: processedContent.text || 'Audio message'
            });
          }
          break;

        case 'button':
        case 'text_button':
          if (processedContent.buttons && processedContent.buttons.length > 0) {
            const buttons = processedContent.buttons.map((btn: any, index: number) => ({
              buttonId: `btn_${index}`,
              buttonText: { displayText: btn.title },
              type: 1
            }));

            messageResult = await sock.sendMessage(jid, {
              text: processedContent.text || 'Please choose an option:',
              buttons: buttons,
              headerType: 1
            });
          } else {
            messageResult = await sock.sendMessage(jid, {
              text: processedContent.text
            });
          }
          break;

        case 'image_text_button':
          if (processedContent.buttons && processedContent.buttons.length > 0) {
            const buttons = processedContent.buttons.map((btn: any, index: number) => ({
              buttonId: `btn_${index}`, 
              buttonText: { displayText: btn.title },
              type: 1
            }));

            const messageOptions: any = {
              text: processedContent.text || 'Please choose an option:',
              buttons: buttons,
              headerType: processedContent.imagePath ? 4 : 1
            };

            if (processedContent.imagePath) {
              messageOptions.image = { url: processedContent.imagePath };
            }

            messageResult = await sock.sendMessage(jid, messageOptions);
          } else {
            // Fallback to image + text
            if (processedContent.imagePath) {
              messageResult = await sock.sendMessage(jid, {
                image: { url: processedContent.imagePath },
                caption: processedContent.text
              });
            } else {
              messageResult = await sock.sendMessage(jid, {
                text: processedContent.text
              });
            }
          }
          break;

        default:
          messageResult = await sock.sendMessage(jid, {
            text: processedContent.text || template.preview || 'Message sent via template'
          });
      }

      console.log('Message sent successfully:', messageResult?.key?.id);

      // Log message to database
      await supabase.from('whatsapp_messages').insert({
        session_id: sessionId,
        from_number: session.phone_number || 'Unknown',
        to_number: to,
        message_text: processedContent.text || template.preview,
        message_type: template.kind,
        message_id: messageResult?.key?.id,
        is_from_me: true,
        timestamp: new Date().toISOString(),
        status: 'sent'
      });

      // Update session last_seen
      await supabase
        .from('whatsapp_sessions')
        .update({ last_seen: new Date() })
        .eq('id', sessionId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: messageResult?.key?.id,
          templateType: template.kind
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (sendError) {
      console.error('Error sending message:', sendError);
      
      // Log failed message
      await supabase.from('whatsapp_messages').insert({
        session_id: sessionId,
        from_number: session.phone_number || 'Unknown', 
        to_number: to,
        message_text: processedContent.text || template.preview,
        message_type: template.kind,
        is_from_me: true,
        timestamp: new Date().toISOString(),
        status: 'failed'
      });

      return new Response(
        JSON.stringify({ error: 'Failed to send message', details: sendError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if missing (default to Indonesia +62)
  if (!cleaned.startsWith('62')) {
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else {
      cleaned = '62' + cleaned;
    }
  }
  
  return cleaned + '@s.whatsapp.net';
}

function processTemplate(template: any, variables: Record<string, string>) {
  const content = template.content_json;
  let processedText = content.text || '';
  
  // Replace variables in text
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    processedText = processedText.replace(regex, value);
  }

  return {
    text: processedText,
    imagePath: content.imagePath,
    audioPath: content.audioPath,
    buttons: content.tombolList || content.buttons
  };
}
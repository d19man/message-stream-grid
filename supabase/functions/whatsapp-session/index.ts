import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    const { sessionId, phoneNumber } = await req.json()

    if (!sessionId || !phoneNumber) {
      throw new Error('Missing sessionId or phoneNumber')
    }

    // For now, generate a mock pairing code
    // In a real implementation, you would integrate with your WhatsApp service
    const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    console.log(`Generated pairing code ${pairingCode} for session ${sessionId} and phone ${phoneNumber}`)

    // Update the session in the database with the pairing code
    const { error: updateError } = await supabaseClient
      .from('whatsapp_sessions')
      .update({ 
        status: 'pairing_required',
        phone_number: phoneNumber 
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error updating session:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        pairingCode,
        message: 'Pairing code generated successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in whatsapp-session function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
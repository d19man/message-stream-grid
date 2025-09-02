import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    // Client for auth operations (needs service role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Client for getting current user (uses anon key with auth)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get the current user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const currentUser = userData.user;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    logStep("Current user authenticated", { userId: currentUser.id, email: currentUser.email });

    // Get current user's profile to check permissions
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, id')
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }

    logStep("Current user profile", { role: currentProfile.role });

    // Check if user has permission to create users
    if (!['superadmin', 'admin'].includes(currentProfile.role)) {
      throw new Error("You don't have permission to create users");
    }

    // Parse request body
    const { email, password, fullName, role } = await req.json();

    if (!email || !password || !fullName || !role) {
      throw new Error("Missing required fields: email, password, fullName, role");
    }

    logStep("Request data", { email, fullName, role });

    // Check role permissions
    if (currentProfile.role === 'admin' && !['crm', 'blaster', 'warmup'].includes(role)) {
      throw new Error("Admins can only create CRM, Blaster, or Warmup users");
    }

    if (currentProfile.role === 'superadmin' && !['admin', 'user', 'crm', 'blaster', 'warmup'].includes(role)) {
      throw new Error("Invalid role specified");
    }

    // Create the user account using admin client
    logStep("Creating user account");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName
      },
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Error creating user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    logStep("User account created", { userId: authData.user.id });

    // Update the profile with the selected role and admin_id
    const updateData: any = { 
      role: role,
      full_name: fullName 
    };

    // Set admin_id if current user is admin (for their sub-users)
    if (currentProfile.role === 'admin' && ['crm', 'blaster', 'warmup'].includes(role)) {
      updateData.admin_id = currentProfile.id;
      
      // Inherit admin's subscription
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('subscription_type, subscription_start, subscription_end, subscription_active')
        .eq('id', currentProfile.id)
        .single()

      if (adminProfile && adminProfile.subscription_active) {
        updateData.subscription_type = adminProfile.subscription_type;
        updateData.subscription_start = adminProfile.subscription_start;
        updateData.subscription_end = adminProfile.subscription_end;
        updateData.subscription_active = adminProfile.subscription_active;
        logStep("Inheriting admin subscription", { 
          subscriptionType: adminProfile.subscription_type,
          subscriptionActive: adminProfile.subscription_active
        });
      }
    }

    logStep("Updating profile", updateData);

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', authData.user.id);

    if (profileUpdateError) {
      // If profile update fails, we should delete the created user
      logStep("Profile update failed, cleaning up user", { error: profileUpdateError.message });
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Error setting user role: ${profileUpdateError.message}`);
    }

    logStep("Profile updated successfully");

    // Return the created user data
    const userData_response = {
      id: authData.user.id,
      email: email,
      full_name: fullName,
      role: role,
      admin_id: updateData.admin_id || null,
      subscription_type: updateData.subscription_type || null,
      subscription_start: updateData.subscription_start || null,
      subscription_end: updateData.subscription_end || null,
      subscription_active: updateData.subscription_active || false,
      created_at: authData.user.created_at,
      updated_at: new Date().toISOString()
    };

    logStep("User created successfully", { userId: authData.user.id, role });

    return new Response(JSON.stringify({
      success: true,
      user: userData_response,
      message: "User created successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-user", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
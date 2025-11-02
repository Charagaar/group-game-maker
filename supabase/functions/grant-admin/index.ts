import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, user_id } = await req.json();

    if (!email && !user_id) {
      return new Response(
        JSON.stringify({ error: 'Either email or user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is admin OR if no admin exists
    const { data: callerRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isCallerAdmin = callerRoles?.some(r => r.role === 'admin');

    const { data: anyAdmin } = await supabaseClient
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    const hasAnyAdmin = anyAdmin && anyAdmin.length > 0;

    // Only allow if caller is admin OR no admin exists
    if (!isCallerAdmin && hasAnyAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can grant admin role to other users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target user ID
    let targetUserId = user_id;
    if (email) {
      const { data: userData, error: lookupError } = await supabaseClient.auth.admin.listUsers();
      if (lookupError) {
        return new Response(
          JSON.stringify({ error: 'Failed to lookup user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const targetUser = userData.users.find(u => u.email === email);
      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: `User with email ${email} not found` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = targetUser.id;
    }

    // Grant admin role (upsert to avoid conflicts)
    const { error: insertError } = await supabaseClient
      .from('user_roles')
      .upsert({ user_id: targetUserId, role: 'admin' }, { onConflict: 'user_id,role' });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to grant admin role', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin role granted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

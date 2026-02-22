import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, full_name, national_id, phone, address, job_title, role, username, permissions } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let userId: string;

    // 1. Try creating the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) {
      // 2. Handle "Already Registered" case gracefully
      if (authError.message.includes('already been registered')) {
        // Fetch the existing user ID from profiles to update it
        const { data: existingProfile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (fetchError || !existingProfile) {
          // Edge Case: User in Auth but not in Profiles (Ghost User)
          // Try to delete from Auth to allow fresh creation next time, or throw meaningful error
          return NextResponse.json({ 
            error: 'User exists in Auth but not in Profiles. Please delete the user from Supabase Auth dashboard manually.' 
          }, { status: 409 });
        }
        
        userId = existingProfile.id;
      } else {
        throw authError;
      }
    } else {
      userId = authData.user.id;
    }

    // 3. Update the profile (Upsert logic)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        national_id,
        phone,
        address,
        job_title,
        role,
        username,
        permissions,
        status: 'active'
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, userId });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
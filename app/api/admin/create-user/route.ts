import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// إنشاء اتصال بصلاحيات الأدمن الكاملة
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role, jobTitle } = body;

    // 1. إنشاء المستخدم في نظام المصادقة (Auth System)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // تأكيد الإيميل تلقائياً
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;

    // 2. إضافة بيانات المستخدم إلى جدول users العام
    if (authUser.user) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id, // ربط الـ ID
          email: email,
          full_name: fullName,
          role: role,
          job_title: jobTitle,
          is_active: true
        });

      if (dbError) throw dbError;
    }

    return NextResponse.json({ message: 'User created successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Create User Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
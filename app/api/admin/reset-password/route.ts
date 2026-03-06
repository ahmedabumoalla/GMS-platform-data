import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // توليد كلمة مرور جديدة عشوائية (Gms@ متبوعة بـ 5 أرقام عشوائية)
    const randomNumbers = Math.floor(10000 + Math.random() * 90000); // توليد 5 أرقام
    const newPassword = `Gms@${randomNumbers}`;

    // تحديث كلمة المرور في نظام المصادقة الخاص بـ Supabase
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      throw error;
    }

    // نرجع كلمة المرور الجديدة لكي يعرضها النظام للمدير
    return NextResponse.json({ message: 'تم التحديث بنجاح', newPassword }, { status: 200 });

  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
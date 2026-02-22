import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// منع الكاش نهائياً لهذا المسار
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    
    // إنشاء عميل بصلاحيات المدير الكاملة (Service Role)
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

    // البحث في جدول البروفايلات
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .or(`phone.eq.${identifier},username.eq.${identifier},email.eq.${identifier}`)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ email: data.email });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
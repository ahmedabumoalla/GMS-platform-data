import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // استدعاء ملف الاتصال الجديد

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. البحث عن المستخدم في جدول users داخل Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single(); // single لأننا نتوقع مستخدم واحد فقط

    // 2. التحقق من وجود المستخدم وهل هناك خطأ
    if (error || !user) {
      console.error('Supabase Error:', error);
      return NextResponse.json(
        { message: 'البريد الإلكتروني غير صحيح' },
        { status: 401 }
      );
    }

    // 3. التحقق من كلمة المرور (مقارنة مباشرة كما طلبت)
    // ملاحظة: تأكد أن اسم العمود في Supabase هو password_hash
    if (user.password_hash !== password) {
      return NextResponse.json(
        { message: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // 4. التحقق هل الحساب مفعل؟
    if (user.is_active === false) {
      return NextResponse.json(
        { message: 'هذا الحساب معطل، يرجى التواصل مع الإدارة' },
        { status: 403 }
      );
    }

    // 5. نجاح الدخول
    return NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role, // نوع الصلاحية (super_admin, employee...)
        jobTitle: user.job_title
      }
    });

  } catch (error: any) {
    console.error('Login Route Error:', error);
    return NextResponse.json(
      { message: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
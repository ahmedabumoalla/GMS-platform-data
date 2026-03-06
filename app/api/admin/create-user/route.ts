import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        full_name, national_id, job_title, role, phone, email, 
        address, bank_account, start_date, dob, region, branch, 
        manager_id, id_copy_url 
    } = body;

    if (!full_name || !national_id || !job_title) {
        return NextResponse.json({ message: 'Name, ID, and Job Title are required.' }, { status: 400 });
    }

    // 1. توليد الرقم الوظيفي (يستخدم كاسم مستخدم)
    // سنجلب عدد المستخدمين الحاليين لتوليد رقم متسلسل مثل: 1001، 1002
    const { count } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    const employeeNumber = `1${String((count || 0) + 1).padStart(3, '0')}`; // يولد 1001, 1002 ...

    // 2. توليد كلمة مرور ديناميكية (Gms@ متبوعة بـ 5 أرقام عشوائية)
    const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 أرقام
    const generatedPassword = `Gms@${randomDigits}`;
    
    // إنشاء إيميل وهمي في حال لم يدخل الموظف إيميل (لأن Supabase Auth يتطلب إيميل)
    const authEmail = email && email.includes('@') ? email : `emp${employeeNumber}@gms.local`;

    // 3. إنشاء المستخدم في نظام المصادقة (Auth System)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { full_name: full_name }
    });

    if (authError) throw authError;

    // تحديد الصلاحيات الافتراضية بناءً على المنصب
    let defaultPerms: string[] = [];
    if (role === 'engineer') defaultPerms = ['ops.view_projects', 'track.view_live'];
    if (role === 'accountant') defaultPerms = ['fin.gl', 'fin.invoicing', 'fin.expenses', 'fin.reports'];
    if (role === 'technician') defaultPerms = ['track.view_live'];
    if (role === 'project_manager') defaultPerms = ['ops.view_projects', 'ops.assign_tasks', 'ops.approve_milestone'];
    if (role === 'super_admin') defaultPerms = ['ops.view_projects', 'ops.create_project', 'hr.view_employees', 'hr.add_employee', 'fin.gl', 'sys.settings']; // وغيرها

    // 4. إضافة بيانات الموظف الشاملة إلى جدول profiles
   // 4. إضافة بيانات الموظف الشاملة إلى جدول profiles
    if (authUser.user) {
      const { error: dbError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          full_name,
          national_id,
          job_title,
          role,
          phone: phone || null,
          email: email || null,
          address: address || null,
          bank_account: bank_account || null,
          start_date: start_date || null,
          dob: dob || null,
          region: region || null,
          branch: branch || null,
          manager_id: manager_id || null,
          id_copy_url: id_copy_url || null,
          employee_id: employeeNumber,
          username: employeeNumber,
          permissions: defaultPerms,
          status: 'active'
        }, { onConflict: 'id' }); 
        
      if (dbError) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw dbError;
      }
    }

    // إرجاع البيانات لواجهة المستخدم لعرضها للمدير
    return NextResponse.json({ 
        message: 'تم إنشاء المستخدم بنجاح', 
        user: { 
            username: employeeNumber, 
            temp_password: generatedPassword 
        } 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Create User Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
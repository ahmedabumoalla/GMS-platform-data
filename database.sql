-- حذف الجداول القديمة
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;

-- تعريف نوع المستخدمين
CREATE TYPE user_role_type AS ENUM ('super_admin', 'admin', 'manager', 'technician', 'employee');

-- جدول profiles المرتبط بـ Supabase Auth
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    national_id VARCHAR(20),
    address TEXT,
    username VARCHAR(100) UNIQUE,
    role user_role_type DEFAULT 'employee',
    job_title VARCHAR(100),
    permissions TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الصلاحيات
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50)
);

-- إدراج الصلاحيات الافتراضية
INSERT INTO permissions (name, description, category) VALUES
('ALL_ACCESS', 'صلاحية الوصول الكامل', 'admin'),
('REVIEW_PROJECT', 'مراجعة المشاريع', 'projects'),
('APPROVE_CONTRACT', 'الموافقة على العقود', 'contracts'),
('ADD_EMPLOYEE', 'إضافة موظفين', 'hr'),
('STOP_EMPLOYEE', 'إيقاف موظف', 'hr'),
('CREATE_INVOICE', 'إنشاء فاتورة', 'finance'),
('VIEW_REPORTS', 'عرض التقارير', 'reports');

-- RLS Policies (سياسات الأمان)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة: يمكن كل مستخدم رؤية بيانته فقط
CREATE POLICY "users_can_read_own_profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- سياسة التحديث: يمكن المستخدم تحديث بيانته فقط
CREATE POLICY "users_can_update_own_profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- سياسة للـ Admin: يمكن الأدمن رؤية جميع البيانات
CREATE POLICY "admin_can_read_all_profiles"
ON profiles FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'admin')
);
-- 1. تنظيف شامل (حذف الجداول القديمة لضمان عدم التعارض)
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;

-- 2. تعريف أنواع المستخدمين
CREATE TYPE user_role_type AS ENUM ('super_admin', 'admin', 'manager', 'employee');

-- 3. جدول المستخدمين (مع دعم رقم الجوال والمسمى الوظيفي)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- سنخزن كلمة المرور هنا
    phone VARCHAR(20) NOT NULL,          -- رقم الجوال إجباري
    role user_role_type DEFAULT 'employee',
    job_title VARCHAR(100),              -- المسمى الوظيفي (يحدده السوبر أدمن)
    
    -- عمود الصلاحيات: مصفوفة نصوص لتخزين الصلاحيات الممنوحة
    -- مثال: ['STOP_EMPLOYEE', 'APPROVE_CONTRACT']
    granted_permissions TEXT[] DEFAULT '{}', 
    
    is_active BOOLEAN DEFAULT TRUE,      -- لإيقاف الموظف
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. إدخال السوبر أدمن (ببياناتك الخاصة)
-- ملاحظة: كلمة المرور هنا نصية، يفضل تشفيرها لاحقاً في الـ Backend
INSERT INTO users (full_name, email, password_hash, phone, role, job_title, granted_permissions)
VALUES (
    'CEO', 
    'ceo.gmsdata@gmail.com', 
    'Ah_19951995', 
    '0508424401', 
    'super_admin', 
    'General Manager', 
    ARRAY['ALL_ACCESS'] -- صلاحية مطلقة
);

-- 5. إدخال مستخدمين تجريبيين (للتجربة)
INSERT INTO users (full_name, email, password_hash, phone, role, job_title, granted_permissions)
VALUES 
(
    'Project Manager', 
    'manager@gms.com', 
    '123456', 
    '0500000001', 
    'admin', 
    'مدير التشغيل', 
    ARRAY['REVIEW_PROJECT', 'APPROVE_CONTRACT'] -- لديه صلاحيتين فقط
),
(
    'HR Specialist', 
    'hr@gms.com', 
    '123456', 
    '0500000002', 
    'admin', 
    'مسؤول التوظيف', 
    ARRAY['ADD_EMPLOYEE', 'STOP_EMPLOYEE'] -- لديه صلاحيات الموارد البشرية
);
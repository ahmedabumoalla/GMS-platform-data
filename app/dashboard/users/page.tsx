'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, Search, Shield, Mail, Briefcase, Edit, 
  MapPin, DollarSign, Users, Settings, ArrowLeft, CheckCircle2, 
  X, Save, Lock as LockIcon, Check, 
  Phone, Hash, Copy, Target, Star, Filter, Loader2, Key, RefreshCw,
  Building, Calendar, Globe, CreditCard, UserCheck, FileText, AlertCircle, FileX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../layout';

// --- Types ---
type UserRole = 'super_admin' | 'project_manager' | 'engineer' | 'accountant' | 'technician';

type UserData = {
  id: string; 
  full_name: string;
  national_id: string;
  phone: string;
  email: string;
  address: string;
  role: UserRole;
  job_title: string;
  username: string;
  avatar?: string;
  completion_rate: number;
  rating: number;
  status: 'active' | 'inactive' | 'archived'; 
  created_at: string;
  permissions: string[];
  // New Fields
  bank_account?: string;
  start_date?: string;
  dob?: string;
  region?: string;
  branch?: string;
  id_copy_url?: string;
  employee_id?: string;
};

type PendingEmployeeData = {
    id: string;
    requested_by: string;
    manager_name?: string; // 👈 تم إضافة اسم المدير هنا
    full_name: string;
    national_id: string;
    phone: string;
    email: string;
    address: string;
    job_title: string;
    role: string;
    status: string;
    created_at: string;
    iqama_url?: string;
    experience_url?: string;
    rejection_reason?: string;
    // 👈 الحقول الإضافية
    bank_account?: string;
    start_date?: string;
    dob?: string;
    region?: string;
    branch?: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { lang } = useDashboard(); 
  const isRTL = lang === 'ar';

  // --- Dictionaries ---
  const dictionaries = {
    ar: {
      title: 'إدارة المستخدمين والصلاحيات',
      desc: 'إدارة حسابات الموظفين وتوزيع الصلاحيات الدقيقة للنظام.',
      search: 'بحث بالاسم، الهوية، الجوال...',
      allRoles: 'جميع المناصب',
      addUser: 'إضافة موظف جديد',
      pendingRequests: 'طلبات التوظيف',
      table: {
        user: 'بيانات الموظف',
        role: 'المنصب / الصلاحية',
        title: 'المسمى الوظيفي',
        perms: 'حجم الصلاحيات',
        edit: 'تعديل / عرض',
        active: 'نشط',
        inactive: 'غير نشط',
        permCount: 'صلاحية'
      },
      profile: {
        title: 'البطاقة التعريفية للموظف',
        info: 'المعلومات الشخصية وبيانات الدخول',
        credentials: 'بيانات الدخول',
        username: 'اسم المستخدم:',
        password: 'كلمة المرور:',
        hiddenPass: 'مخفية ومشفّرة لدواعي أمنية',
        resetPass: 'إعادة تعيين المرور',
        newPassMsg: 'كلمة المرور الجديدة (انسخها الآن):',
        performance: 'الأداء والإنجاز',
        completion: 'نسبة الإنجاز',
        rating: 'التقييم العام',
        permissions: 'صلاحيات النظام (التصنيفات)',
        selectCategory: 'اختر قسماً لعرض وتعديل صلاحياته الفرعية',
        cancel: 'إلغاء',
        save: 'حفظ التحديثات',
        copied: 'تم النسخ!',
        idNumber: 'الرقم الوظيفي',
        bankAcc: 'الحساب البنكي',
        regionBranch: 'المنطقة والفرع',
        dob: 'تاريخ الميلاد',
        startDate: 'تاريخ المباشرة',
        viewId: 'عرض صورة الهوية'
      },
      pending: {
        modalTitle: 'طلبات التوظيف المعلقة',
        modalDesc: 'مراجعة طلبات إضافة الفنيين المرفوعة من مدراء المشاريع.',
        empty: 'لا توجد طلبات توظيف معلقة حالياً.',
        reviewBtn: 'مراجعة الطلب',
        approve: 'اعتماد وإنشاء الحساب',
        reject: 'رفض الطلب',
        rejectReasonPlaceholder: 'الرجاء كتابة سبب الرفض لإرساله لمدير المشروع...',
        noFile: 'لم يرفق',
        viewExp: 'شهادة الخبرة',
        viewIqama: 'الهوية / الإقامة'
      },
      roles: { super_admin: 'مدير النظام', project_manager: 'مدير مشاريع', engineer: 'مهندس', accountant: 'محاسب', technician: 'فني / عامل' },
      perms: {
        ops: 'العمليات والمشاريع', hr: 'الموارد البشرية', fin: 'الإدارة المالية والمحاسبة', track: 'التتبع والمواقع', sys: 'إعدادات النظام',
        'ops.view_projects': 'عرض المشاريع', 'ops.create_project': 'إنشاء مشروع جديد', 'ops.edit_timeline': 'تعديل الجدول الزمني', 'ops.assign_tasks': 'إسناد المهام', 'ops.approve_milestone': 'اعتماد الإنجاز',
        'hr.view_employees': 'عرض الموظفين', 'hr.add_employee': 'إضافة موظف', 'hr.manage_attendance': 'إدارة الحضور', 'hr.view_payroll': 'عرض مسير الرواتب', 'hr.manage_payroll': 'اعتماد الرواتب',
        'fin.gl': 'دفتر الأستاذ العام', 'fin.invoicing': 'الفوترة الإلكترونية (ZATCA)', 'fin.expenses': 'إدارة المصروفات', 'fin.payroll': 'الرواتب والتعويضات (مالية)', 'fin.budget': 'الميزانيات والتوقعات', 'fin.cost_control': 'التحكم بتكاليف المشاريع', 'fin.treasury': 'النقد والخزينة', 'fin.reports': 'التقارير المالية', 'fin.audit': 'التدقيق والامتثال',
        'track.view_live': 'الخريطة الحية', 'track.view_history': 'سجل التحركات',
        'sys.manage_users': 'إدارة المستخدمين', 'sys.view_logs': 'سجل التدقيق', 'sys.settings': 'الإعدادات العامة'
      }
    },
    en: {
      title: 'Users & Permissions Management',
      desc: 'Manage employee accounts and granular system permissions.',
      search: 'Search name, ID, phone...',
      allRoles: 'All Roles',
      addUser: 'Add New Employee',
      pendingRequests: 'Hire Requests',
      table: { user: 'Employee Data', role: 'System Role', title: 'Job Title', perms: 'Permissions', edit: 'Edit / View', active: 'Active', inactive: 'Inactive', permCount: 'perms' },
      profile: {
        title: 'Profile', info: 'Personal info', credentials: 'Credentials', username: 'User:', password: 'Password:', hiddenPass: 'Hidden & Encrypted for Security', resetPass: 'Reset Password', newPassMsg: 'New Password (Copy it now):', performance: 'Performance', completion: 'Completion', rating: 'Rating', permissions: 'Permissions', selectCategory: 'Select Category', cancel: 'Cancel', save: 'Save', copied: 'Copied!',
        idNumber: 'Emp ID', bankAcc: 'Bank Account', regionBranch: 'Region & Branch', dob: 'Date of Birth', startDate: 'Start Date', viewId: 'View ID Copy'
      },
      pending: {
        modalTitle: 'Pending Hire Requests',
        modalDesc: 'Review technician requests submitted by project managers.',
        empty: 'No pending requests at the moment.',
        reviewBtn: 'Review',
        approve: 'Approve & Create Account',
        reject: 'Reject Request',
        rejectReasonPlaceholder: 'Please state the reason for rejection...',
        noFile: 'Not Attached',
        viewExp: 'Experience Cert',
        viewIqama: 'ID / Iqama'
      },
      roles: { super_admin: 'Super Admin', project_manager: 'PM', engineer: 'Engineer', accountant: 'Accountant', technician: 'Tech' },
      perms: {
        ops: 'Operations', hr: 'HR', fin: 'Finance', track: 'Tracking', sys: 'System',
        'ops.view_projects': 'View Projects', 'ops.create_project': 'Create Project', 'ops.edit_timeline': 'Edit Timeline', 'ops.assign_tasks': 'Assign Tasks', 'ops.approve_milestone': 'Approve',
        'hr.view_employees': 'View Employees', 'hr.add_employee': 'Add Employee', 'hr.manage_attendance': 'Attendance', 'hr.view_payroll': 'View Payroll', 'hr.manage_payroll': 'Manage Payroll',
        'fin.gl': 'GL', 'fin.invoicing': 'ZATCA', 'fin.expenses': 'Expenses', 'fin.payroll': 'Payroll', 'fin.budget': 'Budget', 'fin.cost_control': 'Cost', 'fin.treasury': 'Treasury', 'fin.reports': 'Reports', 'fin.audit': 'Audit',
        'track.view_live': 'Live Map', 'track.view_history': 'History',
        'sys.manage_users': 'Manage Users', 'sys.view_logs': 'Logs', 'sys.settings': 'Settings'
      }
    }
  };

  const t = dictionaries[lang as keyof typeof dictionaries];

  const PERMISSION_SCHEMA = [
    { id: 'operations', label: t.perms.ops, icon: Briefcase, color: 'blue', subPermissions: ['ops.view_projects', 'ops.create_project', 'ops.edit_timeline', 'ops.assign_tasks', 'ops.approve_milestone'] },
    { id: 'hr', label: t.perms.hr, icon: Users, color: 'purple', subPermissions: ['hr.view_employees', 'hr.add_employee', 'hr.manage_attendance', 'hr.view_payroll', 'hr.manage_payroll'] },
    { id: 'finance', label: t.perms.fin, icon: DollarSign, color: 'emerald', subPermissions: ['fin.gl', 'fin.invoicing', 'fin.expenses', 'fin.payroll', 'fin.budget', 'fin.cost_control', 'fin.treasury', 'fin.reports', 'fin.audit'] },
    { id: 'tracking', label: t.perms.track, icon: MapPin, color: 'amber', subPermissions: ['track.view_live', 'track.view_history'] },
    { id: 'system', label: t.perms.sys, icon: Settings, color: 'slate', subPermissions: ['sys.manage_users', 'sys.view_logs', 'sys.settings'] }
  ];

  const [users, setUsers] = useState<UserData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingEmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals States
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activePermTab, setActivePermTab] = useState<string>('operations');
  
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [selectedPendingRequest, setSelectedPendingRequest] = useState<PendingEmployeeData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Password Reset States
  const [isResettingPass, setIsResettingPass] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Active Users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // 🚀 جلب طلبات التوظيف المعلقة ودمجها مع أسماء المدراء بطريقة آمنة تماماً
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_employees')
        .select('*')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });
        
      if (pendingError) throw pendingError;
      
      if (pendingData && pendingData.length > 0) {
          // استخراج معرفات المدراء بأمان وجلب أسمائهم
          const managerIds = [...new Set(pendingData.map(req => req.requested_by).filter(Boolean))];
          const { data: managersData } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', managerIds);

          const formattedPending = pendingData.map(req => {
              const managerInfo = managersData?.find(m => m.id === req.requested_by);
             return {
            ...req,
            manager_name: managerInfo?.full_name || 'مدير غير معروف' 
        };
          });
          setPendingRequests(formattedPending);
      } else {
          setPendingRequests([]);
      }

    } catch (error: any) {
      console.error("Error fetching data:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t.profile.copied);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ permissions: selectedUser.permissions })
            .eq('id', selectedUser.id);
            
        if (error) throw error;
        setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
        setIsEditModalOpen(false);
    } catch (error) {
        console.error("Error updating permissions:", error);
        alert(isRTL ? 'فشل تحديث الصلاحيات' : 'Failed to update permissions');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
      if(!selectedUser) return;
      const confirmMsg = isRTL ? 'هل أنت متأكد من إعادة تعيين كلمة المرور لهذا الموظف؟' : 'Are you sure you want to reset the password?';
      if(!window.confirm(confirmMsg)) return;

      setIsResettingPass(true);
      try {
          const response = await fetch('/api/admin/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: selectedUser.id })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          setNewTempPassword(data.newPassword);
      } catch (error: any) {
          console.error("Reset Password Error:", error);
          alert(isRTL ? 'فشل إعادة التعيين' : 'Reset failed');
      } finally {
          setIsResettingPass(false);
      }
  };

  const toggleSubPermission = (permId: string) => {
    if (!selectedUser) return;
    const hasPerm = selectedUser.permissions.includes(permId);
    const newPerms = hasPerm ? selectedUser.permissions.filter(p => p !== permId) : [...selectedUser.permissions, permId];
    setSelectedUser({ ...selectedUser, permissions: newPerms });
  };

  const toggleFullCategory = (categoryId: string, subPerms: string[]) => {
      if (!selectedUser) return;
      const allIncluded = subPerms.every(p => selectedUser.permissions.includes(p));
      let newPerms = [...selectedUser.permissions];
      if (allIncluded) {
          newPerms = newPerms.filter(p => !subPerms.includes(p));
      } else {
          subPerms.forEach(p => { if (!newPerms.includes(p)) newPerms.push(p); });
      }
      setSelectedUser({ ...selectedUser, permissions: newPerms });
  };

  const handleUserClick = (user: UserData) => {
    setSelectedUser({ ...user });
    setNewTempPassword(null); 
    const firstActiveCat = PERMISSION_SCHEMA.find(cat => cat.subPermissions.some(sub => (user.permissions || []).includes(sub)))?.id || 'operations';
    setActivePermTab(firstActiveCat);
    setIsEditModalOpen(true);
  };

  // --- Pending Requests Workflow ---
  // --- دالة الاعتماد ---
  const handleApproveRequest = async (req: PendingEmployeeData) => {
      setIsSubmitting(true);
      try {
          const response = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...req, id_copy_url: req.iqama_url })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.message || data.error);

          const { error: updateError } = await supabase.from('pending_employees')
              .update({ status: 'Approved' })
              .eq('id', req.id)
              .select().single();
              
          if (updateError) throw updateError;

          await supabase.from('notifications').insert({
              user_id: req.requested_by,
              title_ar: 'تم اعتماد طلب التوظيف',
              title_en: 'Hire Request Approved',
              message_ar: `تم اعتماد وإنشاء حساب للموظف: ${req.full_name}. رقم الموظف: ${data.user.username}`,
              message_en: `Employee account created for: ${req.full_name}. User ID: ${data.user.username}`,
              category: 'HR'
          });

          alert(isRTL ? `تم الاعتماد بنجاح. \nاسم المستخدم: ${data.user.username}\nكلمة المرور: ${data.user.temp_password}` : 'Approved successfully.');
          
          setSelectedPendingRequest(null);
          await fetchData();
          
      } catch (error: any) {
          console.error("Approve Error:", error);
          alert(isRTL ? 'حدث خطأ: ' + error.message : 'Error: ' + error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleRejectRequest = async (req: PendingEmployeeData) => {
      if (!rejectionReason.trim()) {
          alert(isRTL ? 'يجب كتابة سبب الرفض أولاً.' : 'Rejection reason is required.');
          return;
      }
      setIsSubmitting(true);
      try {
          const { error: updateError } = await supabase.from('pending_employees')
              .update({ 
                  status: 'Rejected',
                  rejection_reason: rejectionReason
              })
              .eq('id', req.id)
              .select().single();

          if (updateError) throw updateError;

          await supabase.from('notifications').insert({
              user_id: req.requested_by,
              title_ar: 'تم رفض طلب التوظيف',
              title_en: 'Hire Request Rejected',
              message_ar: `تم رفض طلب إضافة الموظف: ${req.full_name}. السبب: ${rejectionReason}`,
              message_en: `Request to add ${req.full_name} was rejected. Reason: ${rejectionReason}`,
              category: 'HR',
              severity: 'error'
          });

          alert(isRTL ? 'تم رفض الطلب بنجاح.' : 'Request rejected successfully.');
          setSelectedPendingRequest(null);
          setRejectionReason('');
          await fetchData();
      } catch (error: any) {
          console.error("Reject Error:", error);
          alert('Error: ' + error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const filteredUsers = users.filter(u => {
      const matchSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.phone?.includes(searchTerm) || 
                          u.national_id?.includes(searchTerm) ||
                          u.username?.includes(searchTerm);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
  });

  return (
    <div className={`space-y-6 font-sans ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t.desc}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <button onClick={() => setIsPendingModalOpen(true)} className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition active:scale-95">
            <UserCheck size={18} /> {t.pendingRequests}
            {pendingRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                    {pendingRequests.length}
                </span>
            )}
          </button>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

          <div className="relative">
              <Filter className={`absolute top-3 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`}/>
              <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-xl py-2.5 outline-none focus:border-blue-500 transition appearance-none cursor-pointer ${isRTL ? 'pr-9 pl-8' : 'pl-9 pr-8'}`}
              >
                  <option value="all">{t.allRoles}</option>
                  <option value="super_admin">{t.roles.super_admin}</option>
                  <option value="project_manager">{t.roles.project_manager}</option>
                  <option value="engineer">{t.roles.engineer}</option>
                  <option value="accountant">{t.roles.accountant}</option>
                  <option value="technician">{t.roles.technician}</option>
              </select>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className={`absolute top-3 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input type="text" placeholder={t.search} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm transition ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
          </div>
          
          <button onClick={() => router.push('/dashboard/users/create')} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-slate-800 transition active:scale-95 whitespace-nowrap">
            <UserPlus size={18} /> {t.addUser}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} whitespace-nowrap`}>
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                <tr>
                    <th className="p-6">{t.table.user}</th>
                    <th className="p-6">{t.table.role}</th>
                    <th className="p-6">{t.table.title}</th>
                    <th className="p-6">{t.table.perms}</th>
                    <th className={`p-6 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.edit}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? <tr><td colSpan={5} className="p-10 text-center text-slate-400"><Loader2 className="animate-spin mx-auto text-blue-500" size={24}/></td></tr> : 
                filteredUsers.map(user => (
                <tr key={user.id} onClick={() => handleUserClick(user)} className="hover:bg-blue-50/50 cursor-pointer transition group">
                    <td className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200 shrink-0">
                                {user.full_name ? user.full_name.charAt(0) : 'U'}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 group-hover:text-blue-700 transition text-base">{user.full_name}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                  <span dir="ltr">{user.phone}</span> • <span>{user.national_id}</span>
                                  {user.employee_id && <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200">ID: {user.employee_id}</span>}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="p-6">
                        <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-700">
                            {(t.roles as any)[user.role] || user.role}
                        </span>
                    </td>
                    <td className="p-6 text-sm text-slate-600 font-medium">{user.job_title}</td>
                    <td className="p-6">
                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1.5 w-fit">
                            <Shield size={14}/> {(user.permissions || []).length} {t.table.permCount}
                        </span>
                    </td>
                    <td className={`p-6 ${isRTL ? 'text-left' : 'text-right'}`}>
                        <div className="inline-flex p-2 bg-slate-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white text-slate-400 transition">
                            <Edit size={16} />
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            {filteredUsers.length === 0 && !loading && (
                <div className="p-10 text-center text-slate-400 font-medium">لا يوجد مستخدمين مطابقين للبحث.</div>
            )}
        </div>
      </div>

      {/* --- Modal 1: Edit Profile & Permissions --- */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center z-10 shadow-sm shrink-0">
              <div>
                  <h3 className="font-black text-xl text-slate-900">{t.profile.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{t.profile.info}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                   
                   {/* الكارت التعريفي */}
                   <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
                       <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-blue-600 to-indigo-800"></div>
                       <div className="relative mt-12 mb-4 flex flex-col items-center">
                           {selectedUser.avatar ? (
                               <img src={selectedUser.avatar} alt="avatar" className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl relative z-10 bg-white" />
                           ) : (
                               <div className="w-28 h-28 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-blue-600 relative z-10">
                                   {selectedUser.full_name ? selectedUser.full_name.charAt(0) : 'U'}
                               </div>
                           )}
                           <span className={`absolute -bottom-3 z-20 px-3 py-1 rounded-xl text-[11px] font-bold border shadow-sm ${selectedUser.status === 'active' ? 'bg-green-500 text-white border-green-600' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                               {selectedUser.status === 'active' ? t.table.active : t.table.inactive}
                           </span>
                       </div>
                       
                       <div className="text-center mb-6 mt-2">
                           <h2 className="text-2xl font-black text-slate-900">{selectedUser.full_name}</h2>
                           <p className="text-sm font-bold text-blue-600 mt-1">{selectedUser.job_title}</p>
                           {selectedUser.employee_id && (
                               <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-600 border border-slate-200">
                                   <Hash size={12}/> {selectedUser.employee_id}
                               </div>
                           )}
                       </div>

                       <div className="w-full space-y-4 pt-5 border-t border-slate-100 text-sm font-medium text-slate-600">
                           <div className="flex items-center gap-3"><Phone size={18} className="text-slate-400 shrink-0"/> <span dir="ltr">{selectedUser.phone || '-'}</span></div>
                           <div className="flex items-center gap-3"><Mail size={18} className="text-slate-400 shrink-0"/> <span className="truncate">{selectedUser.email || '-'}</span></div>
                           <div className="flex items-center gap-3"><CreditCard size={18} className="text-slate-400 shrink-0"/> <span dir="ltr" className="uppercase text-xs font-mono">{selectedUser.bank_account || '-'}</span></div>
                           <div className="flex items-start gap-3"><MapPin size={18} className="text-slate-400 shrink-0 mt-0.5"/> <span className="leading-snug">{selectedUser.address || '-'}</span></div>
                           
                           {(selectedUser.region || selectedUser.branch) && (
                               <div className="flex items-center gap-3"><Building size={18} className="text-slate-400 shrink-0"/> <span>{selectedUser.region} {selectedUser.branch ? `- ${selectedUser.branch}` : ''}</span></div>
                           )}
                           
                           <div className="grid grid-cols-2 gap-4 pt-2">
                               <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                   <div className="text-[10px] text-slate-400 mb-1">{t.profile.dob}</div>
                                   <div className="text-xs font-bold text-slate-700">{selectedUser.dob || '-'}</div>
                               </div>
                               <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                   <div className="text-[10px] text-slate-400 mb-1">{t.profile.startDate}</div>
                                   <div className="text-xs font-bold text-slate-700">{selectedUser.start_date || '-'}</div>
                               </div>
                           </div>

                           {selectedUser.id_copy_url && (
                               <a href={selectedUser.id_copy_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition border border-blue-200">
                                   <FileText size={16}/> {t.profile.viewId}
                               </a>
                           )}
                       </div>
                   </div>

                   <div className="lg:col-span-8 flex flex-col gap-6">
                       {/* Performance Stats */}
                       <div className="grid grid-cols-2 gap-6">
                           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
                               <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Target size={32}/></div>
                               <div><div className="text-sm text-slate-500 font-bold mb-1">{t.profile.completion}</div><div className="text-4xl font-black text-slate-900">{selectedUser.completion_rate || 0}%</div></div>
                           </div>
                           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
                               <div className="w-16 h-16 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-100"><Star size={32} className="fill-yellow-500"/></div>
                               <div><div className="text-sm text-slate-500 font-bold mb-1">{t.profile.rating}</div><div className="text-4xl font-black text-slate-900">{selectedUser.rating || 0} <span className="text-lg text-slate-400">/ 5</span></div></div>
                           </div>
                       </div>

                       {/* Login Credentials Section */}
                       <div className="bg-slate-900 rounded-3xl p-6 shadow-lg relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                           <div className="flex justify-between items-center mb-6 relative z-10">
                               <h3 className="text-white font-bold flex items-center gap-2"><LockIcon size={18} className="text-blue-400"/> {t.profile.credentials}</h3>
                               <button 
                                 onClick={handleResetPassword} disabled={isResettingPass}
                                 className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-xl transition active:scale-95 disabled:opacity-50"
                               >
                                 {isResettingPass ? <RefreshCw size={14} className="animate-spin"/> : <Key size={14}/>} {t.profile.resetPass}
                               </button>
                           </div>
                           
                           <div className="space-y-4 relative z-10">
                               <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                   <div><div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{t.profile.username}</div><div className="text-xl font-mono font-bold text-white">{selectedUser.username}</div></div>
                                   <button onClick={() => copyToClipboard(selectedUser.username)} className="p-2.5 bg-slate-700 hover:bg-blue-600 text-white rounded-xl transition"><Copy size={18}/></button>
                               </div>
                               <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                                   <div>
                                       <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{newTempPassword ? t.profile.newPassMsg : t.profile.password}</div>
                                       {newTempPassword ? (
                                           <div className="text-2xl font-mono font-black text-emerald-400 mt-1">{newTempPassword}</div>
                                       ) : (
                                           <div className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2"><Shield size={16} /> {t.profile.hiddenPass}</div>
                                       )}
                                   </div>
                                   {newTempPassword && (
                                       <button onClick={() => copyToClipboard(newTempPassword)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center gap-2"><Copy size={16}/> نسخ</button>
                                   )}
                               </div>
                           </div>
                       </div>

                       {/* Permissions Settings */}
                       <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-lg text-slate-900 mb-4">{t.profile.permissions}</h3>
                          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                              {PERMISSION_SCHEMA.map((cat) => {
                                  const isActiveTab = activePermTab === cat.id;
                                  const activePermsCount = cat.subPermissions.filter(p => (selectedUser.permissions || []).includes(p)).length;
                                  const hasAnyPerm = activePermsCount > 0;
                                  return (
                                      <button key={cat.id} onClick={() => setActivePermTab(cat.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[120px] transition-all duration-300 border-2 relative ${isActiveTab ? `bg-slate-50 border-${cat.color}-500 shadow-sm transform -translate-y-1` : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                          {hasAnyPerm && <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} w-2.5 h-2.5 rounded-full bg-${cat.color}-500 shadow-sm ring-2 ring-white`}></div>}
                                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${isActiveTab ? `bg-${cat.color}-100 text-${cat.color}-600` : 'bg-slate-50 text-slate-400'}`}><cat.icon size={24} /></div>
                                          <span className={`text-xs font-bold text-center leading-tight ${isActiveTab ? 'text-slate-900' : 'text-slate-500'}`}>{cat.label}</span>
                                      </button>
                                  )
                              })}
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mt-2 relative overflow-hidden">
                              {PERMISSION_SCHEMA.map(cat => {
                                  if (cat.id !== activePermTab) return null;
                                  const allChecked = cat.subPermissions.every(p => (selectedUser.permissions || []).includes(p));
                                  return (
                                      <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                                          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                                              <div className="flex items-center gap-3"><div className={`p-2 bg-${cat.color}-100 text-${cat.color}-600 rounded-lg`}><cat.icon size={20}/></div><h4 className="font-bold text-slate-800">{cat.label}</h4></div>
                                              <button onClick={() => toggleFullCategory(cat.id, cat.subPermissions)} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${allChecked ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>{allChecked && <Check size={14}/>}{allChecked ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</button>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {cat.subPermissions.map((permId) => (
                                                  <label key={permId} className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 cursor-pointer transition group select-none">
                                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${(selectedUser.permissions || []).includes(permId) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>{(selectedUser.permissions || []).includes(permId) && <Check size={12} className="text-white"/>}</div>
                                                      <input type="checkbox" className="hidden" checked={(selectedUser.permissions || []).includes(permId) || false} onChange={() => toggleSubPermission(permId)}/>
                                                      <span className={`text-sm font-bold transition-colors ${(selectedUser.permissions || []).includes(permId) ? 'text-slate-900' : 'text-slate-500'}`}>{(t.perms as any)[permId] || permId}</span>
                                                  </label>
                                              ))}
                                          </div>
                                      </motion.div>
                                  )
                              })}
                          </div>
                       </div>

                   </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 z-10 shrink-0">
               <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">{t.profile.cancel}</button>
               <button onClick={handleSaveChanges} disabled={isSubmitting} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                   {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>} {t.profile.save}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal 2: Pending Hire Requests List --- */}
      {isPendingModalOpen && !selectedPendingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><UserCheck size={24}/></div>
                          <div>
                              <h3 className="font-black text-xl text-slate-900">{t.pending.modalTitle}</h3>
                              <p className="text-xs text-slate-500 mt-1">{t.pending.modalDesc}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsPendingModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm transition"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                      {pendingRequests.length === 0 ? (
                          <div className="text-center py-20 text-slate-400 font-medium flex flex-col items-center gap-4">
                              <Shield size={48} className="opacity-20"/>
                              <p>{t.pending.empty}</p>
                          </div>
                      ) : (
                          pendingRequests.map(req => (
                              <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition">
                                  <div className="flex items-center gap-5">
                                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-600 border border-slate-200">
                                          {req.full_name.charAt(0)}
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-900 text-lg mb-1">{req.full_name}</h4>
                                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                              <span className="flex items-center gap-1"><Briefcase size={14}/> {req.job_title}</span>
                                              <span className="flex items-center gap-1"><Hash size={14}/> {req.national_id}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <button onClick={() => setSelectedPendingRequest(req)} className="px-6 py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-bold text-sm rounded-xl transition flex items-center gap-2">
                                      {t.pending.reviewBtn} <ArrowLeft size={16} className={isRTL ? '' : 'rotate-180'}/>
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* --- 🚀 Modal 3: Review Single Pending Request (WITH ALL NEW FIELDS) --- */}
      {selectedPendingRequest && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
                  
                  <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center z-10 shadow-sm">
                      <div className="flex items-center gap-3">
                          <button onClick={() => {setSelectedPendingRequest(null); setRejectionReason('');}} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''}/></button>
                          <h3 className="font-black text-xl text-slate-900">{isRTL ? 'مراجعة طلب التوظيف' : 'Review Hire Request'}</h3>
                      </div>
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200 animate-pulse">Pending Approval</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          {/* 🚀 Left Column: Personal Data & Manager Info */}
                          <div className="space-y-4">
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'الاسم الكامل':'Full Name'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.full_name}</div></div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'الهوية / الإقامة':'National ID'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.national_id}</div></div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'رقم الجوال':'Phone'}</label><div className="font-bold text-sm text-slate-800 mt-1" dir="ltr">{selectedPendingRequest.phone}</div></div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'تاريخ الميلاد':'DOB'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.dob || '-'}</div></div>
                                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'المنطقة':'Region'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.region || '-'}</div></div>
                              </div>
                              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm"><label className="text-[10px] font-bold text-blue-400 block uppercase mb-1">{isRTL?'المدير طالب التوظيف':'Requested By'}</label><div className="font-black text-sm text-blue-700 flex items-center gap-2"><UserCheck size={16}/> {selectedPendingRequest.manager_name}</div></div>
                          </div>
                          
                          {/* 🚀 Right Column: Job Data, Attachments & Rejection Form */}
                          <div className="space-y-4">
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'المسمى الوظيفي':'Job Title'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.job_title}</div></div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'البريد الإلكتروني':'Email'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.email || '-'}</div></div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'الحساب البنكي (الآيبان)':'Bank Account'}</label><div className="font-bold text-sm text-slate-800 mt-1 uppercase" dir="ltr">{selectedPendingRequest.bank_account || '-'}</div></div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'تاريخ المباشرة':'Start Date'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.start_date || '-'}</div></div>
                                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><label className="text-[10px] font-bold text-slate-400 block uppercase">{isRTL?'الفرع':'Branch'}</label><div className="font-bold text-sm text-slate-800 mt-1">{selectedPendingRequest.branch || '-'}</div></div>
                              </div>
                              
                              {selectedPendingRequest.iqama_url && <a href={selectedPendingRequest.iqama_url} target="_blank" className="block p-4 mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl border border-blue-200 text-center font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"><FileText size={18}/> {isRTL?'عرض صورة الهوية المرفقة':'View Attached ID'}</a>}

                              {/* Rejection Form */}
                              <div className="bg-rose-50 rounded-3xl p-5 border border-rose-100 shadow-sm mt-6">
                                  <h4 className="font-bold text-sm text-rose-800 mb-3 flex items-center gap-2"><AlertCircle size={16}/> {isRTL?'هل تريد رفض الطلب؟':'Reject Request?'}</h4>
                                  <textarea 
                                      value={rejectionReason} 
                                      onChange={e=>setRejectionReason(e.target.value)}
                                      placeholder={t.pending.rejectReasonPlaceholder}
                                      className="w-full p-4 rounded-2xl bg-white border border-rose-200 outline-none focus:border-rose-400 text-sm resize-none h-24 mb-3 shadow-inner"
                                  />
                                  <button onClick={() => handleRejectRequest(selectedPendingRequest)} disabled={isSubmitting || !rejectionReason.trim()} className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2">
                                      {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <FileX size={16}/>} {t.pending.reject}
                                  </button>
                              </div>
                          </div>

                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 z-10 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                      <button onClick={() => handleApproveRequest(selectedPendingRequest)} disabled={isSubmitting} className="w-full md:w-auto px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-base hover:bg-emerald-500 shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20}/>} {t.pending.approve}
                      </button>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
}
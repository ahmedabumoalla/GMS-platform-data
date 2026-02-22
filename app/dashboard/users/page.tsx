'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, Search, Shield, Mail, Briefcase, Edit, 
  MapPin, DollarSign, Users, Settings, 
  X, Save, Lock as LockIcon, ChevronDown, Check, 
  Phone, Hash, Copy, CheckCircle2, Eye, EyeOff, Star, Target, Filter, Loader2
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
  password?: string; 
  avatar?: string;
  completion_rate: number;
  rating: number;
  status: 'active' | 'inactive' | 'archived'; 
  created_at: string;
  permissions: string[];
};

export default function UsersManagementPage() {
  const { lang } = useDashboard(); 
  const isRTL = lang === 'ar';

  const dictionaries = {
    ar: {
      accessDenied: 'وصول مقيد',
      accessMsg: 'عذراً، هذه الصفحة مخصصة لمدير النظام (Super Admin) فقط.',
      back: 'العودة',
      title: 'إدارة المستخدمين والصلاحيات',
      desc: 'إدارة حسابات الموظفين وتوزيع الصلاحيات الدقيقة للنظام.', // ✅ تم الإصلاح
      search: 'بحث بالاسم، الهوية، الجوال...',
      allRoles: 'جميع المناصب',
      addUser: 'إضافة موظف جديد',
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
      addModal: {
        title: 'تسجيل موظف جديد',
        subtitle: 'أدخل البيانات الأساسية لإنشاء حساب الموظف في النظام',
        name: 'الاسم الكامل',
        nationalId: 'رقم الهوية / الإقامة',
        phone: 'رقم الجوال',
        email: 'البريد الإلكتروني',
        address: 'العنوان الوطني / السكن',
        jobTitle: 'المسمى الوظيفي (مثال: مهندس موقع، محاسب)',
        role: 'منصب النظام (يحدد الصلاحيات الافتراضية)',
        cancel: 'إلغاء',
        save: 'حفظ وإنشاء الحساب',
        successTitle: 'تم إنشاء الحساب بنجاح!',
        successSub: 'يرجى تزويد الموظف ببيانات الدخول التالية:',
        username: 'اسم المستخدم:',
        password: 'كلمة المرور:',
        copyDone: 'تم النسخ!',
        close: 'إغلاق',
        roles: {
            super_admin: 'مدير النظام (كامل الصلاحيات)',
            project_manager: 'مدير مشاريع',
            engineer: 'مهندس',
            accountant: 'محاسب',
            technician: 'فني / عامل'
        }
      },
      profile: {
        title: 'البطاقة التعريفية للموظف',
        info: 'المعلومات الشخصية وبيانات الدخول',
        credentials: 'بيانات الدخول',
        username: 'اسم المستخدم:',
        password: 'كلمة المرور:',
        performance: 'الأداء والإنجاز',
        completion: 'نسبة الإنجاز',
        rating: 'التقييم العام',
        permissions: 'صلاحيات النظام (التصنيفات)',
        selectCategory: 'اختر قسماً لعرض وتعديل صلاحياته الفرعية',
        activeSub: 'مفعل',
        cancel: 'إلغاء',
        save: 'حفظ التحديثات',
        copied: 'تم النسخ!'
      },
      roles: {
        super_admin: 'مدير النظام',
        project_manager: 'مدير مشاريع',
        engineer: 'مهندس',
        accountant: 'محاسب',
        technician: 'فني / عامل'
      },
      perms: {
        ops: 'العمليات والمشاريع',
        hr: 'الموارد البشرية',
        fin: 'الإدارة المالية والمحاسبة',
        track: 'التتبع والمواقع',
        sys: 'إعدادات النظام',
        'ops.view_projects': 'عرض المشاريع',
        'ops.create_project': 'إنشاء مشروع جديد',
        'ops.edit_timeline': 'تعديل الجدول الزمني',
        'ops.assign_tasks': 'إسناد المهام',
        'ops.approve_milestone': 'اعتماد الإنجاز',
        'hr.view_employees': 'عرض الموظفين',
        'hr.add_employee': 'إضافة موظف',
        'hr.manage_attendance': 'إدارة الحضور',
        'hr.view_payroll': 'عرض مسير الرواتب',
        'hr.manage_payroll': 'اعتماد الرواتب',
        'fin.gl': 'دفتر الأستاذ العام',
        'fin.invoicing': 'الفوترة الإلكترونية (ZATCA)',
        'fin.expenses': 'إدارة المصروفات',
        'fin.payroll': 'الرواتب والتعويضات (مالية)',
        'fin.budget': 'الميزانيات والتوقعات',
        'fin.cost_control': 'التحكم بتكاليف المشاريع',
        'fin.treasury': 'النقد والخزينة',
        'fin.reports': 'التقارير المالية',
        'fin.audit': 'التدقيق والامتثال',
        'track.view_live': 'الخريطة الحية',
        'track.view_history': 'سجل التحركات',
        'sys.manage_users': 'إدارة المستخدمين',
        'sys.view_logs': 'سجل التدقيق',
        'sys.settings': 'الإعدادات العامة'
      }
    },
    en: {
      accessDenied: 'Access Denied',
      accessMsg: 'Sorry, this page is restricted to Super Admins only.',
      back: 'Go Back',
      title: 'Users & Permissions Management',
      desc: 'Manage employee accounts and granular system permissions.', // ✅ تم الإصلاح
      search: 'Search name, ID, phone...',
      allRoles: 'All Roles',
      addUser: 'Add New Employee',
      table: {
        user: 'Employee Data',
        role: 'System Role',
        title: 'Job Title',
        perms: 'Permissions',
        edit: 'Edit / View',
        active: 'Active',
        inactive: 'Inactive',
        permCount: 'perms'
      },
      addModal: {
        title: 'Register New Employee',
        subtitle: 'Enter details',
        name: 'Name',
        nationalId: 'ID',
        phone: 'Phone',
        email: 'Email',
        address: 'Address',
        jobTitle: 'Job Title',
        role: 'Role',
        cancel: 'Cancel',
        save: 'Save',
        successTitle: 'Created!',
        successSub: 'Credentials:',
        username: 'User:',
        password: 'Pass:',
        copyDone: 'Copied!',
        close: 'Close',
        roles: {
            super_admin: 'Super Admin',
            project_manager: 'PM',
            engineer: 'Engineer',
            accountant: 'Accountant',
            technician: 'Tech'
        }
      },
      profile: {
        title: 'Profile',
        info: 'Personal info',
        credentials: 'Credentials',
        username: 'User:',
        password: 'Password:',
        performance: 'Performance',
        completion: 'Completion',
        rating: 'Rating',
        permissions: 'Permissions',
        selectCategory: 'Select Category',
        activeSub: 'Active',
        cancel: 'Cancel',
        save: 'Save',
        copied: 'Copied!'
      },
      roles: {
        super_admin: 'Super Admin',
        project_manager: 'PM',
        engineer: 'Engineer',
        accountant: 'Accountant',
        technician: 'Tech'
      },
      perms: {
        ops: 'Operations',
        hr: 'HR',
        fin: 'Finance',
        track: 'Tracking',
        sys: 'System',
        'ops.view_projects': 'View Projects',
        'ops.create_project': 'Create Project',
        'ops.edit_timeline': 'Edit Timeline',
        'ops.assign_tasks': 'Assign Tasks',
        'ops.approve_milestone': 'Approve',
        'hr.view_employees': 'View Employees',
        'hr.add_employee': 'Add Employee',
        'hr.manage_attendance': 'Attendance',
        'hr.view_payroll': 'View Payroll',
        'hr.manage_payroll': 'Manage Payroll',
        'fin.gl': 'GL',
        'fin.invoicing': 'ZATCA',
        'fin.expenses': 'Expenses',
        'fin.payroll': 'Payroll',
        'fin.budget': 'Budget',
        'fin.cost_control': 'Cost',
        'fin.treasury': 'Treasury',
        'fin.reports': 'Reports',
        'fin.audit': 'Audit',
        'track.view_live': 'Live Map',
        'track.view_history': 'History',
        'sys.manage_users': 'Manage Users',
        'sys.view_logs': 'Logs',
        'sys.settings': 'Settings'
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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activePermTab, setActivePermTab] = useState<string>('operations');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
      full_name: '', national_id: '', phone: '', email: '', address: '', job_title: '', role: 'engineer' as UserRole
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{username: string, password: string} | null>(null);
  const [copied, setCopied] = useState(false);

  // 🚀 جلب البيانات الحقيقية
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ✅ الدالة المفقودة للنسخ داخل البطاقة
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(t.profile.copied);
  };

  const copyCredsToClipboard = () => {
    if(generatedCredentials) {
        navigator.clipboard.writeText(`Username: ${generatedCredentials.username}\nPassword: ${generatedCredentials.password}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
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
        alert(lang === 'ar' ? 'فشل تحديث الصلاحيات' : 'Failed to update permissions');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      const baseName = newUser.full_name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '') || 'user';
      const generatedUser = `${baseName}_${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedPass = `gms@${Math.random().toString(36).slice(-6)}`;

      let defaultPerms: string[] = [];
      if (newUser.role === 'engineer') defaultPerms = ['ops.view_projects', 'track.view_live'];
      if (newUser.role === 'accountant') defaultPerms = ['fin.gl', 'fin.invoicing', 'fin.expenses', 'fin.reports'];
      if (newUser.role === 'technician') defaultPerms = ['track.view_live'];
      if (newUser.role === 'project_manager') defaultPerms = ['ops.view_projects', 'ops.assign_tasks', 'ops.approve_milestone'];
      if (newUser.role === 'super_admin') defaultPerms = PERMISSION_SCHEMA.flatMap(cat => cat.subPermissions);

      try {
          const response = await fetch('/api/create-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email: newUser.email,
                  password: generatedPass,
                  full_name: newUser.full_name,
                  national_id: newUser.national_id,
                  phone: newUser.phone,
                  address: newUser.address,
                  job_title: newUser.job_title,
                  role: newUser.role,
                  username: generatedUser,
                  permissions: defaultPerms
              })
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error);

          await fetchUsers();
          setGeneratedCredentials({ username: generatedUser, password: generatedPass });

      } catch (error: any) {
          console.error("Error adding user:", error);
          alert((lang === 'ar' ? 'حدث خطأ: ' : 'Error: ') + error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const closeAddModal = () => {
      setIsAddModalOpen(false);
      setGeneratedCredentials(null);
      setCopied(false);
      setNewUser({ full_name: '', national_id: '', phone: '', email: '', address: '', job_title: '', role: 'engineer' });
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
    setShowPassword(false);
    const firstActiveCat = PERMISSION_SCHEMA.find(cat => cat.subPermissions.some(sub => user.permissions.includes(sub)))?.id || 'operations';
    setActivePermTab(firstActiveCat);
    setIsEditModalOpen(true);
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
          
          <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-slate-800 transition active:scale-95 whitespace-nowrap">
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
                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
                                {user.full_name ? user.full_name.charAt(0) : 'U'}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 group-hover:text-blue-700 transition text-base">{user.full_name}</div>
                                <div className="text-xs text-slate-500 mt-1">{user.phone} • {user.national_id}</div>
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

      {/* --- Add New Employee Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">{!generatedCredentials ? t.addModal.title : t.addModal.successTitle}</h3>
                        <p className="text-xs text-slate-500 mt-1">{!generatedCredentials ? t.addModal.subtitle : t.addModal.successSub}</p>
                    </div>
                    <button onClick={closeAddModal} className="p-2 hover:bg-slate-200 text-slate-400 rounded-full transition"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {!generatedCredentials ? (
                        <form id="add-user-form" onSubmit={handleAddUserSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.addModal.name}</label>
                                    <input required type="text" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.addModal.nationalId}</label>
                                    <div className="relative">
                                        <Hash className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                                        <input required type="text" value={newUser.national_id} onChange={e => setNewUser({...newUser, national_id: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.addModal.phone}</label>
                                    <div className="relative">
                                        <Phone className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                                        <input required type="tel" dir="ltr" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.addModal.email}</label>
                                    <div className="relative">
                                        <Mail className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                                        <input required type="email" dir="ltr" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.addModal.address}</label>
                                <div className="relative">
                                    <MapPin className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                                    <input required type="text" value={newUser.address} onChange={e => setNewUser({...newUser, address: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.addModal.jobTitle}</label>
                                    <div className="relative">
                                        <Briefcase className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                                        <input required type="text" value={newUser.job_title} onChange={e => setNewUser({...newUser, job_title: e.target.value})} className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">{t.addModal.role}</label>
                                    <div className="relative">
                                        <Shield className={`absolute top-3.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-4' : 'left-4'}`} />
                                        <select 
                                            value={newUser.role} 
                                            onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} 
                                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm outline-none focus:border-blue-500 font-bold text-slate-800 appearance-none cursor-pointer ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                        >
                                            <option value="engineer">{t.addModal.roles.engineer}</option>
                                            <option value="accountant">{t.addModal.roles.accountant}</option>
                                            <option value="technician">{t.addModal.roles.technician}</option>
                                            <option value="project_manager">{t.addModal.roles.project_manager}</option>
                                            <option value="super_admin">{t.addModal.roles.super_admin}</option>
                                        </select>
                                        <ChevronDown className={`absolute top-4 text-slate-400 w-4 h-4 pointer-events-none ${isRTL ? 'left-4' : 'right-4'}`} />
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* Success View */
                        <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 border-4 border-white shadow-lg">
                                <CheckCircle2 size={40} />
                            </div>
                            
                            <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4 relative">
                                <button onClick={copyCredsToClipboard} className="absolute top-4 left-4 p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition flex items-center gap-1 text-xs font-bold shadow-sm">
                                    {copied ? <><Check size={14} className="text-green-600"/> {t.addModal.copyDone}</> : <><Copy size={14}/> نسخ</>}
                                </button>
                                
                                <div>
                                    <div className="text-xs font-bold text-slate-400 mb-1">{t.addModal.username}</div>
                                    <div className="text-xl font-mono font-black text-blue-700 bg-white px-4 py-2 rounded-lg border border-slate-200 inline-block">{generatedCredentials.username}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 mb-1">{t.addModal.password}</div>
                                    <div className="text-xl font-mono font-black text-slate-800 bg-white px-4 py-2 rounded-lg border border-slate-200 inline-block">{generatedCredentials.password}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-white flex gap-3">
                    {!generatedCredentials ? (
                        <>
                            <button type="button" onClick={closeAddModal} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">{t.addModal.cancel}</button>
                            <button type="submit" disabled={isSubmitting} form="add-user-form" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18}/>}
                                {t.addModal.save}
                            </button>
                        </>
                    ) : (
                        <button onClick={closeAddModal} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg transition active:scale-95">
                            {t.addModal.close}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- Edit Permissions Modal --- */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* ... Modal Header & Body (same as before) ... */}
            <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center z-10 shadow-sm">
              <div>
                  <h3 className="font-black text-xl text-slate-900">{t.profile.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{t.profile.info}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                       <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-600 to-indigo-600"></div>
                       <div className="relative mt-10 mb-4">
                           {selectedUser.avatar ? (
                               <img src={selectedUser.avatar} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg relative z-10 bg-white" />
                           ) : (
                               <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-blue-600 relative z-10">
                                   {selectedUser.full_name ? selectedUser.full_name.charAt(0) : 'U'}
                               </div>
                           )}
                           <span className={`absolute -bottom-2 ${isRTL ? '-right-2' : '-left-2'} z-20 px-2 py-1 rounded-lg text-[10px] font-bold border ${selectedUser.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500'}`}>
                               {selectedUser.status === 'active' ? t.table.active : t.table.inactive}
                           </span>
                       </div>
                       <h2 className="text-xl font-black text-slate-900">{selectedUser.full_name}</h2>
                       <p className="text-sm font-bold text-blue-600 mt-1 mb-4">{selectedUser.job_title}</p>
                       <div className="w-full space-y-3 pt-4 border-t border-slate-100 text-sm text-slate-600 text-start">
                           <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400"/> {selectedUser.email}</div>
                           <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400"/> <span dir="ltr">{selectedUser.phone}</span></div>
                           <div className="flex items-center gap-3"><Hash size={16} className="text-slate-400"/> {selectedUser.national_id}</div>
                           <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-400"/> {selectedUser.address}</div>
                       </div>
                   </div>

                   <div className="lg:col-span-2 flex flex-col gap-6">
                       <div className="grid grid-cols-2 gap-6">
                           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                               <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Target size={28}/></div>
                               <div><div className="text-sm text-slate-500 font-bold mb-1">{t.profile.completion}</div><div className="text-3xl font-black text-slate-900">{selectedUser.completion_rate}%</div></div>
                           </div>
                           <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                               <div className="w-14 h-14 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-100"><Star size={28} className="fill-yellow-500"/></div>
                               <div><div className="text-sm text-slate-500 font-bold mb-1">{t.profile.rating}</div><div className="text-3xl font-black text-slate-900">{selectedUser.rating} <span className="text-sm text-slate-400">/ 5</span></div></div>
                           </div>
                       </div>

                       <div className="bg-slate-900 rounded-3xl p-6 shadow-lg flex-1 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                           <h3 className="text-white font-bold mb-6 flex items-center gap-2 relative z-10"><LockIcon size={18} className="text-blue-400"/> {t.profile.credentials}</h3>
                           <div className="space-y-4 relative z-10">
                               <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                   <div><div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{t.profile.username}</div><div className="text-lg font-mono font-bold text-white">{selectedUser.username}</div></div>
                                   <button onClick={() => copyToClipboard(selectedUser.username)} className="p-2 bg-slate-700 hover:bg-blue-600 text-white rounded-lg transition"><Copy size={16}/></button>
                               </div>
                               <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                   <div><div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{t.profile.password}</div><div className="text-lg font-mono font-bold text-white tracking-widest">{showPassword ? selectedUser.password : '••••••••'}</div></div>
                                   <div className="flex gap-2">
                                       <button onClick={() => setShowPassword(!showPassword)} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                                       <button onClick={() => copyToClipboard(selectedUser.password || '')} className="p-2 bg-slate-700 hover:bg-blue-600 text-white rounded-lg transition"><Copy size={16}/></button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>

               <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-4">{t.profile.permissions}</h3>
                  <p className="text-xs text-slate-500 mb-6">{t.profile.selectCategory}</p>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {PERMISSION_SCHEMA.map((cat) => {
                          const isActiveTab = activePermTab === cat.id;
                          const activePermsCount = cat.subPermissions.filter(p => selectedUser.permissions?.includes(p)).length; // Safe check
                          const hasAnyPerm = activePermsCount > 0;
                          return (
                              <button key={cat.id} onClick={() => setActivePermTab(cat.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[120px] transition-all duration-300 border-2 relative ${isActiveTab ? `bg-white border-${cat.color}-500 shadow-md transform -translate-y-1` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                  {hasAnyPerm && <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} w-2.5 h-2.5 rounded-full bg-${cat.color}-500 shadow-sm ring-2 ring-white`}></div>}
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${isActiveTab ? `bg-${cat.color}-100 text-${cat.color}-600` : 'bg-slate-50 text-slate-400'}`}><cat.icon size={24} /></div>
                                  <span className={`text-xs font-bold text-center leading-tight ${isActiveTab ? 'text-slate-900' : 'text-slate-500'}`}>{cat.label}</span>
                                  <span className="text-[10px] text-slate-400 mt-2 font-mono bg-slate-50 px-2 py-0.5 rounded-full">{activePermsCount} / {cat.subPermissions.length}</span>
                              </button>
                          )
                      })}
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-2 shadow-sm relative overflow-hidden">
                      {PERMISSION_SCHEMA.map(cat => {
                          if (cat.id !== activePermTab) return null;
                          const allChecked = cat.subPermissions.every(p => selectedUser.permissions?.includes(p));
                          return (
                              <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                      <div className="flex items-center gap-3"><div className={`p-2 bg-${cat.color}-50 text-${cat.color}-600 rounded-lg`}><cat.icon size={20}/></div><h4 className="font-bold text-slate-800">{cat.label}</h4></div>
                                      <button onClick={() => toggleFullCategory(cat.id, cat.subPermissions)} className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${allChecked ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{allChecked && <Check size={14}/>}{allChecked ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {cat.subPermissions.map((permId) => (
                                          <label key={permId} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-blue-200 cursor-pointer transition group select-none">
                                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedUser.permissions?.includes(permId) ? 'bg-blue-600 border-blue-600 scale-110' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>{selectedUser.permissions?.includes(permId) && <Check size={14} className="text-white"/>}</div>
                                              <input type="checkbox" className="hidden" checked={selectedUser.permissions?.includes(permId) || false} onChange={() => toggleSubPermission(permId)}/>
                                              <span className={`text-sm font-bold transition-colors ${selectedUser.permissions?.includes(permId) ? 'text-slate-900' : 'text-slate-500'}`}>{(t.perms as any)[permId] || permId}</span>
                                          </label>
                                      ))}
                                  </div>
                              </motion.div>
                          )
                      })}
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 z-10">
               <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition">{t.profile.cancel}</button>
               <button onClick={handleSaveChanges} disabled={isSubmitting} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                   {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>} 
                   {t.profile.save}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
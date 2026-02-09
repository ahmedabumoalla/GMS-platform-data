'use client';

import { useEffect, useState } from 'react';
import { 
  UserPlus, Search, Shield, Mail, Briefcase, Trash2, Edit, 
  CheckCircle, XCircle, MapPin, FileText, DollarSign, 
  Users, Clock, Settings, BarChart, Archive, X, Save, Lock, 
  ChevronDown, ChevronUp, Check, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddUserModal from '@/components/AddUserModal';
// استدعاء الكونتكست المشترك
import { useDashboard } from '../layout';
// --- Types ---
type UserRole = 'super_admin' | 'project_manager' | 'financial_advisor' | 'technician';

type UserData = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  job_title: string;
  status: 'active' | 'inactive' | 'archived'; 
  created_at: string;
  permissions: string[];
};

const CURRENT_USER_ROLE: UserRole = 'super_admin'; 

export default function UsersManagementPage() {
  const { lang } = useDashboard(); // ✅ جلب اللغة من الكونتكست
  const isRTL = lang === 'ar';

  // --- القاموس (Dictionary) ---
  const t = {
    ar: {
      accessDenied: 'وصول مقيد',
      accessMsg: 'عذراً، هذه الصفحة مخصصة لمدير النظام (Super Admin) فقط.',
      back: 'العودة',
      title: 'مركز التحكم بالصلاحيات',
      desc: 'توزيع دقيق للصلاحيات حسب الأدوار الوظيفية.',
      search: 'بحث...',
      addUser: 'إضافة مستخدم',
      table: {
        user: 'المستخدم',
        role: 'الدور',
        title: 'المسمى',
        perms: 'حجم الصلاحيات',
        edit: 'تعديل',
        active: 'نشط',
        inactive: 'غير نشط',
        permCount: 'صلاحية'
      },
      modal: {
        title: 'تعديل ملف المستخدم',
        subtitle: 'إدارة حالة الحساب والصلاحيات الدقيقة',
        permsTitle: 'الصلاحيات الدقيقة',
        activeCount: 'صلاحيات مفعلة',
        archive: 'أرشفة المستخدم',
        cancel: 'إلغاء',
        save: 'حفظ الصلاحيات',
        hint: '* إلغاء تفعيل القسم الرئيسي يلغي جميع صلاحياته الفرعية.'
      },
      roles: {
        super_admin: 'مدير النظام',
        project_manager: 'مدير مشاريع',
        financial_advisor: 'مستشار مالي',
        technician: 'فني'
      },
      perms: {
        ops: 'إدارة العمليات والمشاريع',
        hr: 'الموارد البشرية والفريق',
        fin: 'الإدارة المالية',
        track: 'التتبع والمواقع',
        sys: 'إعدادات النظام',
        // Sub-permissions
        view_projects: 'عرض المشاريع',
        create_project: 'إنشاء مشروع جديد',
        edit_timeline: 'تعديل الجدول الزمني',
        assign_tasks: 'إسناد المهام',
        approve_milestone: 'اعتماد الإنجاز',
        view_employees: 'عرض الموظفين',
        add_employee: 'إضافة موظف',
        manage_attendance: 'إدارة الحضور',
        view_payroll: 'عرض الرواتب',
        manage_payroll: 'اعتماد الرواتب',
        view_expenses: 'عرض المصروفات',
        approve_expense: 'اعتماد المصروفات',
        view_budget: 'عرض الموازنة',
        export_reports: 'تصدير التقارير',
        view_live: 'الخريطة الحية',
        view_history: 'سجل التحركات',
        manage_users: 'إدارة المستخدمين',
        view_logs: 'سجل التدقيق',
        settings: 'الإعدادات العامة'
      }
    },
    en: {
      accessDenied: 'Access Denied',
      accessMsg: 'Sorry, this page is restricted to Super Admins only.',
      back: 'Go Back',
      title: 'Permissions Control Center',
      desc: 'Fine-grained permission distribution by role.',
      search: 'Search...',
      addUser: 'Add User',
      table: {
        user: 'User',
        role: 'Role',
        title: 'Job Title',
        perms: 'Permissions Scope',
        edit: 'Edit',
        active: 'Active',
        inactive: 'Inactive',
        permCount: 'perms'
      },
      modal: {
        title: 'Edit User Profile',
        subtitle: 'Manage account status and granular permissions',
        permsTitle: 'Fine-Grained Permissions',
        activeCount: 'active permissions',
        archive: 'Archive User',
        cancel: 'Cancel',
        save: 'Save Changes',
        hint: '* Disabling a main category disables all its sub-permissions.'
      },
      roles: {
        super_admin: 'Super Admin',
        project_manager: 'Project Manager',
        financial_advisor: 'Financial Advisor',
        technician: 'Technician'
      },
      perms: {
        ops: 'Operations & Projects',
        hr: 'HR & Teams',
        fin: 'Finance Management',
        track: 'Tracking & Locations',
        sys: 'System Settings',
        // Sub-permissions
        view_projects: 'View Projects',
        create_project: 'Create Project',
        edit_timeline: 'Edit Timeline',
        assign_tasks: 'Assign Tasks',
        approve_milestone: 'Approve Milestone',
        view_employees: 'View Employees',
        add_employee: 'Add Employee',
        manage_attendance: 'Manage Attendance',
        view_payroll: 'View Payroll',
        manage_payroll: 'Manage Payroll',
        view_expenses: 'View Expenses',
        approve_expense: 'Approve Expense',
        view_budget: 'View Budget',
        export_reports: 'Export Reports',
        view_live: 'Live Map',
        view_history: 'Movement History',
        manage_users: 'Manage Users',
        view_logs: 'Audit Logs',
        settings: 'General Settings'
      }
    }
  }[lang];

  // --- تعريف هيكل الصلاحيات (يستخدم القاموس للترجمة) ---
  const PERMISSION_SCHEMA = [
    {
      id: 'operations',
      label: t.perms.ops,
      icon: Briefcase,
      color: 'blue',
      subPermissions: [
        { id: 'ops.view_projects', label: t.perms.view_projects },
        { id: 'ops.create_project', label: t.perms.create_project },
        { id: 'ops.edit_timeline', label: t.perms.edit_timeline },
        { id: 'ops.assign_tasks', label: t.perms.assign_tasks },
        { id: 'ops.approve_milestone', label: t.perms.approve_milestone }
      ]
    },
    {
      id: 'hr',
      label: t.perms.hr,
      icon: Users,
      color: 'purple',
      subPermissions: [
        { id: 'hr.view_employees', label: t.perms.view_employees },
        { id: 'hr.add_employee', label: t.perms.add_employee },
        { id: 'hr.manage_attendance', label: t.perms.manage_attendance },
        { id: 'hr.view_payroll', label: t.perms.view_payroll },
        { id: 'hr.manage_payroll', label: t.perms.manage_payroll }
      ]
    },
    {
      id: 'finance',
      label: t.perms.fin,
      icon: DollarSign,
      color: 'emerald',
      subPermissions: [
        { id: 'fin.view_expenses', label: t.perms.view_expenses },
        { id: 'fin.approve_expense', label: t.perms.approve_expense },
        { id: 'fin.view_budget', label: t.perms.view_budget },
        { id: 'fin.export_reports', label: t.perms.export_reports }
      ]
    },
    {
      id: 'tracking',
      label: t.perms.track,
      icon: MapPin,
      color: 'amber',
      subPermissions: [
        { id: 'track.view_live', label: t.perms.view_live },
        { id: 'track.view_history', label: t.perms.view_history }
      ]
    },
    {
      id: 'system',
      label: t.perms.sys,
      icon: Settings,
      color: 'slate',
      subPermissions: [
        { id: 'sys.manage_users', label: t.perms.manage_users },
        { id: 'sys.view_logs', label: t.perms.view_logs },
        { id: 'sys.settings', label: t.perms.settings }
      ]
    }
  ];

  // الحماية
  if (CURRENT_USER_ROLE !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
        <div className="bg-red-50 p-6 rounded-full mb-4 animate-pulse"><Shield size={64} className="text-red-500" /></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">{t.accessDenied}</h2>
        <p className="text-slate-500 max-w-md mb-6">{t.accessMsg}</p>
        <button onClick={() => window.history.back()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">{t.back}</button>
      </div>
    );
  }

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // حالات التعديل
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // جلب البيانات
  const fetchUsers = async () => {
    setLoading(true);
    setTimeout(() => {
        const mockUsers: UserData[] = [
            { 
              id: 101, full_name: lang === 'ar' ? "م. أحمد الغامدي" : "Eng. Ahmed Al-Ghamdi", email: "ahmed@gms.com", role: "project_manager", job_title: lang === 'ar' ? "مدير مشاريع أول" : "Senior PM", status: 'active', created_at: "2024-01-01",
              permissions: ['ops.view_projects', 'ops.create_project', 'ops.edit_timeline', 'ops.assign_tasks', 'track.view_live']
            },
            { 
              id: 102, full_name: lang === 'ar' ? "أ. سارة العمري" : "Sarah Al-Omari", email: "sarah@gms.com", role: "financial_advisor", job_title: lang === 'ar' ? "مسؤول مالي" : "Financial Officer", status: 'active', created_at: "2024-01-05",
              permissions: ['fin.view_expenses', 'fin.approve_expense', 'fin.view_budget', 'fin.export_reports', 'hr.view_payroll']
            },
        ];
        setUsers(mockUsers);
        setLoading(false);
    }, 800);
  };

  useEffect(() => { fetchUsers(); }, [lang]); // إعادة الجلب عند تغيير اللغة لتحديث الأسماء الوهمية

  // --- Logic ---
  const toggleCategory = (categoryId: string, subPerms: string[]) => {
    if (!selectedUser) return;
    const isCategoryActive = expandedCategories.includes(categoryId);
    let newPermissions = [...selectedUser.permissions];

    if (isCategoryActive) {
        setExpandedCategories(prev => prev.filter(c => c !== categoryId));
        newPermissions = newPermissions.filter(p => !subPerms.includes(p));
    } else {
        setExpandedCategories(prev => [...prev, categoryId]);
        if (!newPermissions.includes(subPerms[0])) {
            newPermissions.push(subPerms[0]);
        }
    }
    setSelectedUser({ ...selectedUser, permissions: newPermissions });
  };

  const toggleSubPermission = (permId: string) => {
    if (!selectedUser) return;
    const hasPerm = selectedUser.permissions.includes(permId);
    const newPerms = hasPerm 
      ? selectedUser.permissions.filter(p => p !== permId)
      : [...selectedUser.permissions, permId];
    
    setSelectedUser({ ...selectedUser, permissions: newPerms });
  };

  const handleUserClick = (user: UserData) => {
    setSelectedUser({ ...user });
    // تحديد الأقسام المفتوحة بناءً على الصلاحيات الحالية ولكن باستخدام IDs ثابتة (لا تعتمد على الترجمة)
    // ملاحظة: IDs في PERMISSION_SCHEMA ثابتة بالإنجليزية، لذا المنطق سليم.
    const activeCats = PERMISSION_SCHEMA.filter(cat => 
        cat.subPermissions.some(sub => user.permissions.includes(sub.id))
    ).map(cat => cat.id);
    
    setExpandedCategories(activeCats);
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;
    setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
    setIsEditModalOpen(false);
    alert(lang === 'ar' ? "تم تحديث الصلاحيات بنجاح." : "Permissions updated successfully.");
  };

  const filteredUsers = users.filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // Role Badge Helper
  const getRoleBadge = (role: string) => {
     // يمكنك تخصيص الألوان
     return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className={`space-y-6 font-sans ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-purple-600" /> {t.title}
          </h2>
          <p className="text-slate-500 text-sm mt-1">{t.desc}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className={`absolute top-3 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input 
              type="text" 
              placeholder={t.search} 
              className={`w-full py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-slate-800 transition active:scale-95">
            <UserPlus size={18} /> {t.addUser}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
            <tr>
              <th className="p-5">{t.table.user}</th>
              <th className="p-5">{t.table.role}</th>
              <th className="p-5">{t.table.title}</th>
              <th className="p-5">{t.table.perms}</th>
              <th className={`p-5 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.edit}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading...</td></tr> : 
            filteredUsers.map(user => (
              <tr key={user.id} onClick={() => handleUserClick(user)} className="hover:bg-blue-50/30 cursor-pointer transition">
                <td className="p-5 font-bold text-slate-700">{user.full_name}</td>
                <td className="p-5">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                        {t.roles[user.role] || user.role}
                    </span>
                </td>
                <td className="p-5 text-sm text-slate-600">{user.job_title}</td>
                <td className="p-5">
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">
                        {user.permissions.length} {t.table.permCount}
                    </span>
                </td>
                <td className={`p-5 ${isRTL ? 'text-left' : 'text-right'}`}>
                    <Edit size={16} className="text-slate-400 hover:text-blue-600 inline-block"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Modal --- */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {selectedUser.full_name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900">{selectedUser.full_name}</h3>
                    <p className="text-xs text-slate-500">{selectedUser.job_title} • {selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition"><X size={20}/></button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
               <div className="grid gap-4">
                  {PERMISSION_SCHEMA.map((category) => {
                      const isActive = expandedCategories.includes(category.id);
                      const activeCount = category.subPermissions.filter(p => selectedUser.permissions.includes(p.id)).length;
                      
                      return (
                          <div key={category.id} className={`bg-white border rounded-2xl transition-all duration-300 overflow-hidden ${isActive ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'}`}>
                              
                              {/* Category Header */}
                              <div 
                                onClick={() => toggleCategory(category.id, category.subPermissions.map(p => p.id))}
                                className="p-4 flex items-center justify-between cursor-pointer select-none"
                              >
                                  <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${isActive ? `bg-${category.color}-100 text-${category.color}-700` : 'bg-slate-100 text-slate-400'}`}>
                                          <category.icon size={20} />
                                      </div>
                                      <div>
                                          <div className={`font-bold text-sm ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{category.label}</div>
                                          {isActive && <div className="text-[10px] text-slate-400 mt-0.5">{activeCount} / {category.subPermissions.length} {t.modal.activeCount}</div>}
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isActive ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${isActive ? (isRTL ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`}></div>
                                      </div>
                                  </div>
                              </div>

                              {/* Sub Permissions */}
                              <AnimatePresence>
                                {isActive && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-100 bg-slate-50/30"
                                    >
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {category.subPermissions.map((sub) => (
                                                <label key={sub.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-blue-300 transition group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedUser.permissions.includes(sub.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                                        {selectedUser.permissions.includes(sub.id) && <Check size={12} className="text-white"/>}
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden" 
                                                        checked={selectedUser.permissions.includes(sub.id)}
                                                        onChange={() => toggleSubPermission(sub.id)}
                                                    />
                                                    <span className={`text-sm font-medium ${selectedUser.permissions.includes(sub.id) ? 'text-slate-800' : 'text-slate-500'}`}>{sub.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                              </AnimatePresence>
                          </div>
                      );
                  })}
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center">
               <div className="text-xs text-slate-400 hidden sm:block">
                   {t.modal.hint}
               </div>
               <div className="flex gap-3 w-full sm:w-auto">
                   <button onClick={() => setIsEditModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">{t.modal.cancel}</button>
                   <button onClick={handleSaveChanges} className="flex-1 sm:flex-none px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 transition active:scale-95">
                       <Save size={16}/> {t.modal.save}
                   </button>
               </div>
            </div>

          </div>
        </div>
      )}

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
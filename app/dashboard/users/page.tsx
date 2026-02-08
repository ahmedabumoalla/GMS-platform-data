'use client';

import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase'; // تم التعطيل مؤقتاً
import { 
  UserPlus, Search, Shield, Mail, Briefcase, Trash2, Edit, 
  CheckCircle, XCircle, MapPin, FileText, DollarSign, 
  Users, Clock, Settings, BarChart, Archive, X, Save, Lock
} from 'lucide-react';
import AddUserModal from '@/components/AddUserModal';

// --- الأنواع ---
type Permission = 
  | 'manage_contracts'    // إدارة العقود
  | 'manage_employees'    // إدارة الموظفين
  | 'assign_tasks'        // توزيع المهام
  | 'view_map_tracking'   // التتبع المباشر
  | 'manage_payroll'      // الرواتب والأجور
  | 'manage_attendance'   // الحضور والانصراف
  | 'view_financials'     // التقارير المالية
  | 'manage_settings'     // إعدادات النظام
  | 'evaluate_performance'; // تقييم الأداء

type UserData = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  job_title: string;
  status: 'active' | 'inactive' | 'archived'; 
  created_at: string;
  permissions: Permission[]; 
};

// --- قائمة الصلاحيات القياسية ---
const ALL_PERMISSIONS: { key: Permission; label: string; category: string; icon: any }[] = [
  { key: 'manage_contracts', label: 'إدارة العقود', category: 'العمليات', icon: FileText },
  { key: 'assign_tasks', label: 'توزيع المهام', category: 'العمليات', icon: Briefcase },
  { key: 'view_map_tracking', label: 'تتبع الخريطة', category: 'العمليات', icon: MapPin },
  
  { key: 'manage_employees', label: 'إدارة الموظفين', category: 'الموارد البشرية', icon: Users },
  { key: 'manage_attendance', label: 'الحضور والانصراف', category: 'الموارد البشرية', icon: Clock },
  { key: 'manage_payroll', label: 'الرواتب والأجور', category: 'الموارد البشرية', icon: DollarSign },
  { key: 'evaluate_performance', label: 'تقييم الأداء', category: 'الموارد البشرية', icon: BarChart },

  { key: 'view_financials', label: 'التقارير المالية', category: 'المالية', icon: DollarSign },
  { key: 'manage_settings', label: 'إعدادات النظام', category: 'النظام', icon: Settings },
];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // حالات التعديل
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // جلب البيانات (محاكاة)
  const fetchUsers = async () => {
    setLoading(true);
    setTimeout(() => {
        const mockUsers: UserData[] = [
            { 
              id: 101, full_name: "م. أحمد الغامدي", email: "ahmed@gms.com", role: "project_manager", job_title: "مدير مشاريع أول", status: 'active', created_at: "2024-01-01",
              permissions: ['manage_contracts', 'assign_tasks', 'view_map_tracking']
            },
            { 
              id: 102, full_name: "أ. سارة العمري", email: "sarah@gms.com", role: "financial_advisor", job_title: "مسؤول مالي", status: 'active', created_at: "2024-01-05",
              permissions: ['view_financials', 'manage_payroll']
            },
            { 
              id: 105, full_name: "فهد الدوسري", email: "fahad@gms.com", role: "super_admin", job_title: "مدير النظام", status: 'active', created_at: "2023-12-01",
              permissions: ['manage_settings', 'manage_employees', 'view_map_tracking', 'view_financials'] 
            },
        ];
        setUsers(mockUsers);
        setLoading(false);
    }, 800);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- الإجراءات ---

  const handleUserClick = (user: UserData) => {
    setSelectedUser({ ...user }); 
    setIsEditModalOpen(true);
  };

  const handlePermissionToggle = (permKey: Permission) => {
    if (!selectedUser) return;
    const hasPerm = selectedUser.permissions.includes(permKey);
    const newPerms = hasPerm 
      ? selectedUser.permissions.filter(p => p !== permKey) // إزالة
      : [...selectedUser.permissions, permKey]; // إضافة
    
    setSelectedUser({ ...selectedUser, permissions: newPerms });
  };

  const handleArchiveUser = () => {
    if (!selectedUser) return;
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? { ...u, status: 'archived' as const } : u
    );
    setUsers(updatedUsers);
    setIsEditModalOpen(false);
    alert(`تم أرشفة المستخدم ${selectedUser.full_name} بنجاح.`);
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;
    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? selectedUser : u
    );
    setUsers(updatedUsers);
    setIsEditModalOpen(false);
    alert("تم تحديث بيانات المستخدم والصلاحيات بنجاح.");
  };

  // ترجمة الأدوار
  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'project_manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'financial_advisor': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getRoleName = (role: string) => {
      switch(role) {
          case 'super_admin': return 'مدير النظام';
          case 'project_manager': return 'مدير مشروع';
          case 'financial_advisor': return 'مستشار مالي';
          case 'technician': return 'فني / موظف';
          default: return role;
      }
  }

  // تصفية النتائج
  const filteredUsers = users.filter(u => 
    u.status !== 'archived' && ( 
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 font-sans" dir="rtl">
      
      {/* الترويسة */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-purple-600" /> مركز التحكم بالصلاحيات
          </h2>
          <p className="text-slate-500 text-sm mt-1">إدارة المستخدمين، الأدوار، وتوزيع الصلاحيات الدقيقة للنظام.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="بحث عن مستخدم..." 
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-200 transition"
          >
            <UserPlus size={18} /> إضافة مستخدم
          </button>
        </div>
      </div>

      {/* جدول المستخدمين */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
            <tr>
              <th className="p-5">الملف الشخصي</th>
              <th className="p-5">الدور</th>
              <th className="p-5">المسمى الوظيفي</th>
              <th className="p-5">الحالة</th>
              <th className="p-5">الصلاحيات</th>
              <th className="p-5 text-left">تعديل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">جاري تحميل المستخدمين...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-slate-400">لا يوجد مستخدمين نشطين.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr 
                  key={user.id} 
                  onClick={() => handleUserClick(user)}
                  className="hover:bg-blue-50/30 transition cursor-pointer group"
                >
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm border border-slate-200">
                        {user.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.full_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRoleBadge(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="text-sm text-slate-600 font-medium">{user.job_title}</div>
                  </td>

                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${user.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      {user.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>

                  <td className="p-5">
                    <div className="flex items-center gap-1">
                      <Lock size={14} className="text-slate-400"/>
                      <span className="text-xs font-bold text-slate-600">{user.permissions.length} صلاحية</span>
                    </div>
                  </td>

                  <td className="p-5 text-left">
                    <Edit size={16} className="text-slate-400 hover:text-blue-600 mr-auto"/>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- نافذة تعديل المستخدم والصلاحيات --- */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* رأس النافذة */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-xl text-slate-800">تعديل ملف المستخدم</h3>
                <p className="text-xs text-slate-500 mt-1">إدارة حالة الحساب والصلاحيات الدقيقة</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full border border-slate-200 transition">
                <X size={20} />
              </button>
            </div>

            {/* محتوى النافذة */}
            <div className="flex-1 overflow-y-auto p-8">
              
              {/* قسم معلومات المستخدم */}
              <div className="flex items-start gap-4 mb-8 pb-8 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800">{selectedUser.full_name}</h4>
                  <p className="text-slate-500 text-sm mb-2">{selectedUser.email}</p>
                  <div className="flex gap-2">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">{selectedUser.job_title}</span>
                    <span className={`text-xs px-2 py-1 rounded border ${getRoleBadge(selectedUser.role)}`}>{getRoleName(selectedUser.role)}</span>
                  </div>
                </div>
              </div>

              {/* قسم الصلاحيات */}
              <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <Settings size={16} className="text-purple-600"/> الصلاحيات الدقيقة
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_PERMISSIONS.map((perm) => (
                  <label 
                    key={perm.key} 
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedUser.permissions.includes(perm.key) 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      checked={selectedUser.permissions.includes(perm.key)}
                      onChange={() => handlePermissionToggle(perm.key)}
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <perm.icon size={14} className="text-slate-400"/> {perm.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{perm.category}</div>
                    </div>
                  </label>
                ))}
              </div>

            </div>

            {/* تذييل النافذة */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              
              <button 
                onClick={handleArchiveUser}
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition"
              >
                <Archive size={16} /> أرشفة المستخدم
              </button>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleSaveChanges}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center gap-2"
                >
                  <Save size={16} /> حفظ التغييرات
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* نافذة إضافة مستخدم (قياسية) */}
      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

    </div>
  );
}
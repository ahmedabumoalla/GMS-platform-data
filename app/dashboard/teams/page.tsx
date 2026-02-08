'use client';

import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase'; // Disabled for UI Mode
import { Users, UserPlus, Shield, Briefcase, CheckCircle, AlertCircle, Search } from 'lucide-react';

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  job_title: string;
  supervisor_id: number | null;
  is_active: boolean;
};

export default function TeamsPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب البيانات (محاكاة)
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // محاكاة الاتصال بالشبكة
    setTimeout(() => {
        const mockUsers: User[] = [
            { id: 101, full_name: "م. أحمد الغامدي", email: "ahmed@gms.com", role: "project_manager", job_title: "مدير مشاريع", supervisor_id: null, is_active: true },
            { id: 102, full_name: "أ. سارة العمري", email: "sarah@gms.com", role: "financial_advisor", job_title: "مسؤول مالي", supervisor_id: null, is_active: true },
            { id: 103, full_name: "سعيد القحطاني", email: "saeed@gms.com", role: "technician", job_title: "فني كهرباء", supervisor_id: 101, is_active: true },
            { id: 104, full_name: "ياسر الحربي", email: "yasser@gms.com", role: "technician", job_title: "سائق معدات", supervisor_id: null, is_active: false },
            { id: 106, full_name: "محمد علي", email: "mohammed@gms.com", role: "technician", job_title: "مساعد فني", supervisor_id: 101, is_active: true },
        ];

        // تصفية المشرفين (المدراء)
        const managersList = mockUsers.filter(u => u.role === 'project_manager');
        setManagers(managersList);

        // تصفية الموظفين والفنيين (كل من ليس مديراً)
        const employeesList = mockUsers.filter(u => u.role === 'technician');
        setEmployees(employeesList);
        
        setLoading(false);
    }, 800);
  };

  // تعيين مشرف جديد
  const assignSupervisor = (employeeId: number, supervisorId: string) => {
    const newSupervisorId = supervisorId === "null" ? null : parseInt(supervisorId);
    
    // تحديث الواجهة محلياً (Optimistic UI)
    setEmployees(employees.map(emp => 
        emp.id === employeeId ? { ...emp, supervisor_id: newSupervisorId } : emp
    ));
    
    // هنا يتم إرسال الطلب للسيرفر في الوضع الحقيقي
    // alert('تم تحديث المشرف بنجاح');
  };

  // دالة مساعدة لجلب اسم المشرف
  const getSupervisorName = (id: number | null) => {
    if (!id) return null;
    return managers.find(m => m.id === id)?.full_name;
  };

  if (loading) return <div className="text-center text-slate-400 mt-20 animate-pulse">جاري تحميل الهيكل التنظيمي...</div>;

  return (
    <div className="space-y-8 font-sans" dir="rtl">
      
      {/* ترويسة الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="text-blue-600" /> إدارة الفرق والمشرفين
            </h2>
            <p className="text-slate-500 mt-1 text-sm">ربط الفنيين والموظفين بالمشرفين الميدانيين لتنظيم دورة الموافقات.</p>
        </div>
        
        {/* إحصائيات سريعة */}
        <div className="flex gap-3 w-full md:w-auto">
            <div className="bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 text-center flex-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">عدد المشرفين</div>
                <div className="font-black text-blue-600 text-lg">{managers.length}</div>
            </div>
            <div className="bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 text-center flex-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">عدد الفنيين</div>
                <div className="font-black text-slate-700 text-lg">{employees.length}</div>
            </div>
        </div>
      </div>

      {/* جدول الربط */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
                    <tr>
                        <th className="p-6">الموظف / الفني</th>
                        <th className="p-6">المسمى الوظيفي</th>
                        <th className="p-6">المشرف الحالي</th>
                        <th className="p-6">تعيين مشرف جديد</th>
                        <th className="p-6 text-left">الحالة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition group">
                            
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">
                                        {emp.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{emp.full_name}</div>
                                        <div className="text-xs text-slate-400 mt-0.5 font-mono">{emp.email}</div>
                                    </div>
                                </div>
                            </td>

                            <td className="p-6">
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-1.5 w-fit">
                                    <Briefcase size={12}/>
                                    {emp.job_title || 'غير محدد'}
                                </span>
                            </td>

                            <td className="p-6">
                                {emp.supervisor_id ? (
                                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl w-fit text-sm font-bold border border-emerald-100">
                                        <CheckCircle size={16} />
                                        {getSupervisorName(emp.supervisor_id)}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl w-fit text-sm font-bold border border-amber-100">
                                        <AlertCircle size={16} />
                                        غير مرتبط
                                    </div>
                                )}
                            </td>

                            <td className="p-6">
                                <div className="relative w-full md:w-48">
                                    <Users className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
                                    <select 
                                        className="w-full pr-9 pl-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition appearance-none cursor-pointer hover:border-slate-300"
                                        value={emp.supervisor_id || "null"}
                                        onChange={(e) => assignSupervisor(emp.id, e.target.value)}
                                    >
                                        <option value="null" className="text-slate-400">-- اختر مشرف --</option>
                                        {managers.map(mgr => (
                                            <option key={mgr.id} value={mgr.id}>
                                                {mgr.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </td>

                            <td className="p-6 text-left">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${emp.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {emp.is_active ? 'نشط' : 'غير نشط'}
                                </span>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
            
            {employees.length === 0 && (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-3"><Users className="text-slate-300" size={32}/></div>
                    لا يوجد موظفين متاحين للربط حالياً.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
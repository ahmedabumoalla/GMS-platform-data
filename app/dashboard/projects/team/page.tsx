'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Phone, Mail, 
  Briefcase, LayoutGrid, List,
  Loader2, X, MapPin, Building, Clock, FileSignature, AlertTriangle, ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout'; 

// --- Types ---
type AvailabilityStatus = 'Available' | 'Assigned' | 'Overloaded';

interface TeamMember {
  id: string;
  name: string;
  national_id: string;
  employee_id: string;
  role: string;
  job_title: string;
  phone: string;
  email: string;
  region: string;
  branch: string;
  start_date: string;
  manager_name: string;
  status: AvailabilityStatus;
  projects: string[];
  workload: number;
  completedTasks: number;
  rejectedTasks: number;
  totalTasks: number;
  // 🚀 حقل جديد: سجل الإجراءات الإدارية للموظف
  actionHistory: any[]; 
}

export default function EnterpriseWorkforcePage() {
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  const router = useRouter();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🚀 حالة لعداد القرارات المعلقة
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // --- دالة حساب العمر داخل الشركة ---
  const getCompanyTenure = (startDate: string) => {
    if (!startDate) return isRTL ? 'غير محدد' : 'N/A';
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) return `${years} ${isRTL ? 'سنة' : 'Y'} ${months > 0 ? `و ${months} ${isRTL ? 'شهر' : 'M'}` : ''}`;
    if (months > 0) return `${months} ${isRTL ? 'شهر' : 'Months'}`;
    return `${diffDays} ${isRTL ? 'يوم' : 'Days'}`;
  };

  // --- جلب البيانات ---
  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      try {
        // 1. جلب الموظفين
        const { data: allProfiles, error: profError } = await supabase.from('profiles').select('*');
        if (profError) throw profError;

        // 2. جلب جميع الإجراءات الإدارية المحفوظة
        const { data: allActions } = await supabase.from('hr_actions').select('*').order('created_at', { ascending: false });
        
        // حساب الإجراءات المعلقة للأدمن
        if (isAdmin && allActions) {
            setPendingActionsCount(allActions.filter(a => a.status === 'Pending Approval').length);
        }

        if (allProfiles) {
            const techs = allProfiles.filter(p => ['technician', 'engineer'].includes(p.role));
            const assignmentsRes = await supabase.from('task_assignments').select('tech_id, status, projects(title)');
            const assignments = assignmentsRes.data || [];

            const formattedMembers: TeamMember[] = techs.map(profile => {
                const empTasks = assignments.filter(a => a.tech_id === profile.id);
                const activeTasks = empTasks.filter(a => ['Pending', 'Accepted', 'In Progress'].includes(a.status));
                const activeProjects = Array.from(new Set(activeTasks.map((t: any) => t.projects?.title).filter(Boolean)));
                
                const totalTasks = empTasks.length;
                const completedTasks = empTasks.filter(a => a.status === 'Completed').length;
                const rejectedTasks = empTasks.filter(a => a.status === 'Rejected').length;

                let workload = Math.min(activeTasks.length * 25, 100);
                let status: AvailabilityStatus = workload >= 80 ? 'Overloaded' : workload > 0 ? 'Assigned' : 'Available';

                const manager = allProfiles.find(p => p.id === profile.manager_id);
                
                // 🚀 استخراج سجل قرارات هذا الموظف فقط
                const empActions = allActions?.filter(action => action.employee_id === profile.id) || [];

                return {
                    id: profile.id,
                    name: profile.full_name || 'Unknown',
                    national_id: profile.national_id || 'غير مسجل',
                    employee_id: profile.employee_id || 'N/A',
                    role: profile.role,
                    job_title: profile.job_title || 'غير محدد',
                    phone: profile.phone || 'غير مسجل',
                    email: profile.email || 'غير مسجل',
                    region: profile.region || 'غير محدد',
                    branch: profile.branch || 'الفرع الرئيسي',
                    start_date: profile.start_date,
                    manager_name: manager ? manager.full_name : 'لا يوجد مدير مباشر',
                    status,
                    projects: activeProjects,
                    workload,
                    completedTasks,
                    rejectedTasks,
                    totalTasks,
                    actionHistory: empActions // 👈 تمرير السجل للبطاقة
                };
            });

            formattedMembers.sort((a, b) => a.workload - b.workload);
            setMembers(formattedMembers);
            setFilteredMembers(formattedMembers);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchTeamData();
  }, [user, isAdmin]);

  // --- البحث ---
  useEffect(() => {
      if (!searchQuery.trim()) { setFilteredMembers(members); } 
      else {
          const q = searchQuery.toLowerCase();
          setFilteredMembers(members.filter(m => 
              m.name.toLowerCase().includes(q) || m.job_title.toLowerCase().includes(q) || m.employee_id?.toLowerCase().includes(q) || m.national_id?.includes(q)
          ));
      }
  }, [searchQuery, members]);

  // --- التوجيه ---
  const handleAdministrativeAction = (empId: string) => {
      router.push(`/dashboard/hr/actions/${empId}`);
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Header --- */}
      <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
              <Users className="text-blue-600" size={28}/> {isRTL ? 'إدارة الموظفين والفرق' : 'Workforce Management'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>{isRTL ? 'نظرة شاملة على السجل الوظيفي' : 'Comprehensive view of employee records'}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             
             {/* 🚀 زر استقبال واعتماد القرارات للأدمن */}
             {isAdmin && (
                 <button onClick={() => router.push('/dashboard/reports/hr-actions')} className="relative bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 px-5 py-3 rounded-[1.2rem] font-bold text-sm transition flex items-center gap-2 shadow-sm">
                     <ShieldCheck size={18}/> {isRTL ? 'مراجعة طلبات الإدارة' : 'Review HR Requests'}
                     {pendingActionsCount > 0 && (
                         <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-black shadow-md border-2 border-white animate-pulse">
                             {pendingActionsCount}
                         </span>
                     )}
                 </button>
             )}

             <div className="relative flex-1 md:w-72">
                <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-4 h-4`} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? 'بحث بالاسم، الهوية...' : 'Search...'} className={`w-full border rounded-[1.2rem] px-4 py-3 text-sm outline-none transition ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 shadow-sm'}`} />
            </div>
             <div className={`hidden md:block h-8 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
             <button className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
             <button className={`p-3 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`} onClick={() => setViewMode('list')}><List size={18} /></button>
          </div>
        </div>
      </div>

      {/* --- Main Content: Employee Cards --- */}
      <div className="p-8">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={50} /></div>
        ) : filteredMembers.length === 0 ? (
            <div className={`text-center py-20 font-bold ${textSub}`}>{isRTL ? 'لا يوجد موظفين.' : 'No employees found.'}</div>
        ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {filteredMembers.map(member => {
                    const actionCount = member.actionHistory.filter(a => a.status === 'Approved').length;
                    return (
                    <motion.div 
                        initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={member.id} 
                        onClick={() => setSelectedMember(member)}
                        className={`group cursor-pointer rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-2xl hover:-translate-y-1 ${cardBg}`}
                    >
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${member.status === 'Available' ? 'bg-emerald-500' : member.status === 'Assigned' ? 'bg-blue-500' : 'bg-red-500'}`}></div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                                    {member.name.charAt(0)}
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-xl border ${member.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : member.status === 'Assigned' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                    {member.status === 'Available' ? (isRTL ? 'متاح' : 'Available') : member.status === 'Assigned' ? (isRTL ? 'مشغول جزئياً' : 'Assigned') : (isRTL ? 'مضغوط' : 'Overloaded')}
                                </span>
                            </div>

                            <div>
                                <h3 className={`text-lg font-black leading-tight group-hover:text-blue-500 transition ${textMain}`}>{member.name}</h3>
                                <p className="text-xs font-bold text-blue-600 mt-1">{member.job_title}</p>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <span className={`text-[10px] font-mono px-2 py-1 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>ID: {member.employee_id}</span>
                                {/* 🚀 مؤشر الإجراءات الإدارية على الكارت */}
                                {actionCount > 0 && (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1" title="إجراءات إدارية مسجلة">
                                        <AlertTriangle size={10}/> {actionCount} إجراء
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={`p-4 border-t flex items-center justify-between text-xs font-bold ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                            <div className="flex items-center gap-1.5"><MapPin size={14}/> {member.branch}</div>
                            <div className="text-blue-500 group-hover:underline">{isRTL ? 'عرض السجل' : 'View Record'} &rarr;</div>
                        </div>
                    </motion.div>
                )})}
            </div>
        )}
      </div>

      {/* --- 🚀 MODAL: السجل الشامل للموظف --- */}
      <AnimatePresence>
        {selectedMember && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto" onClick={() => setSelectedMember(null)}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    className={`w-full max-w-5xl my-auto rounded-[3rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    
                    {/* Header: Cover & Profile Pic */}
                    <div className="relative h-32 bg-gradient-to-r from-blue-800 to-slate-900 shrink-0">
                        <button onClick={() => setSelectedMember(null)} className="absolute top-6 left-6 rtl:left-auto rtl:right-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition"><X size={20}/></button>
                    </div>
                    
                    <div className="px-10 pb-8 relative -mt-16 flex flex-col md:flex-row gap-6 md:items-end border-b border-slate-100 dark:border-slate-800">
                        <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-5xl font-black text-blue-600 relative z-10 shrink-0">
                            {selectedMember.name.charAt(0)}
                        </div>
                        <div className="flex-1 pb-2">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h2 className={`text-3xl font-black ${textMain}`}>{selectedMember.name}</h2>
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-bold border ${selectedMember.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : selectedMember.status === 'Assigned' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                    {selectedMember.status === 'Available' ? (isRTL ? 'متاح' : 'Available') : selectedMember.status === 'Assigned' ? (isRTL ? 'مشغول جزئياً' : 'Assigned') : (isRTL ? 'مضغوط' : 'Overloaded')}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-blue-600">{selectedMember.job_title}</p>
                        </div>

                        {/* 🚀 زر الإجراءات الإدارية الجديد */}
                        <div className="pb-2">
                            <button onClick={() => handleAdministrativeAction(selectedMember.id)} className="w-full md:w-auto px-8 py-3.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-2xl font-black text-sm transition-all shadow-sm hover:shadow-rose-500/30 flex items-center justify-center gap-2 group">
                                <FileSignature size={18} className="group-hover:animate-pulse"/> {isRTL ? 'إصدار قرار إداري' : 'Issue HR Action'}
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        
                        {/* Right Column: Details */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase size={16}/> {isRTL ? 'البيانات الوظيفية والتنظيمية' : 'Job & Organization Info'}</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1">{isRTL ? 'الرقم الوظيفي' : 'Employee ID'}</div>
                                    <div className={`font-mono font-black text-sm ${textMain}`}>{selectedMember.employee_id}</div>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1">{isRTL ? 'رقم الهوية / الإقامة' : 'National ID'}</div>
                                    <div className={`font-mono font-black text-sm ${textMain}`}>{selectedMember.national_id}</div>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Clock size={12}/> {isRTL ? 'العمر داخل الشركة' : 'Company Tenure'}</div>
                                    <div className="font-black text-amber-600 text-sm">{getCompanyTenure(selectedMember.start_date)}</div>
                                    <div className="text-[9px] font-bold text-slate-400 mt-1">تاريخ المباشرة: {selectedMember.start_date || 'N/A'}</div>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Users size={12}/> {isRTL ? 'المدير المباشر' : 'Direct Manager'}</div>
                                    <div className={`font-black text-sm ${textMain}`}>{selectedMember.manager_name}</div>
                                </div>
                                <div className={`col-span-2 p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Building size={12}/> {isRTL ? 'موقع العمل (المنطقة والفرع)' : 'Work Location'}</div>
                                        <div className={`font-black text-sm ${textMain}`}>{selectedMember.region} - {selectedMember.branch}</div>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><MapPin size={20}/></div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Phone size={16}/> {isRTL ? 'طرق التواصل' : 'Contact Methods'}</h4>
                                <div className="flex gap-3">
                                    <a href={`tel:${selectedMember.phone}`} className="flex-1 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition">
                                        <Phone size={16}/> اتصال مباشر
                                    </a>
                                    <a href={`mailto:${selectedMember.email}`} className="flex-1 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition">
                                        <Mail size={16}/> إرسال بريد
                                    </a>
                                </div>
                            </div>

                        </div>

                        {/* Left Column: Projects & 🚀 HR Actions History */}
                        <div className="lg:col-span-5 space-y-6 border-t lg:border-t-0 lg:border-r border-slate-100 dark:border-slate-800 pt-8 lg:pt-0 lg:pr-8 rtl:lg:border-r-0 rtl:lg:border-l rtl:lg:pl-8 rtl:lg:pr-0">
                            
                            {/* 🚀 قسم سجل الإجراءات الإدارية الجديد */}
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileSignature size={16}/> {isRTL ? 'السجل الإداري والتأديبي' : 'HR Actions History'}</h4>
                                
                                {selectedMember.actionHistory.length === 0 ? (
                                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                                        <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2"/>
                                        <p className="text-xs font-bold text-emerald-700">السجل نظيف. لم يتم اتخاذ أي إجراءات سابقة بحق الموظف.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedMember.actionHistory.map((action, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-xs font-bold ${action.action_category === 'disciplinary' ? 'text-rose-600' : 'text-blue-600'}`}>{action.action_title}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${action.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : action.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{action.status}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono mb-2">Ref: {action.reference_number} • {new Date(action.created_at).toLocaleDateString()}</div>
                                                {action.status === 'Approved' && (
                                                    <p className={`text-xs font-medium border-t pt-2 ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>{action.reason}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Briefcase size={16}/> {isRTL ? 'المشاريع والتكليفات الحالية' : 'Current Projects'}</h4>
                                {selectedMember.projects.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-sm font-bold text-slate-400">
                                        لا يوجد مشاريع نشطة حالياً.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedMember.projects.map((proj, idx) => (
                                            <div key={idx} className={`p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Briefcase size={14}/></div>
                                                <div className={`text-sm font-bold ${textMain}`}>{proj}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}
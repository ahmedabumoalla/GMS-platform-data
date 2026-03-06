'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Briefcase, UserPlus, Calendar, 
  LayoutGrid, List, Zap, MapPin, Edit, AlertTriangle, 
  Loader2, X, Users, Plus, Hash, Phone, Mail, Building, Globe, Shield, ArrowRight, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { useDashboard } from '../../layout';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type TaskStatus = 'Pending' | 'Assigned' | 'In Progress';

interface TechAssignment {
    tech_id: string;
    full_name: string;
    status: string;
    team_name?: string; 
    team_zone?: string;
    assigned_by?: string; // ID المدير الذي أسند هذا الفني
    manager_name?: string; // اسم المدير الذي أسند الفني
}

interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  work_zones: any[]; // نطاقات العمل
  assigned_managers: string[]; // مصفوفة أرقام المدراء
  manager_objects?: any[]; // مصفوفة كائنات المدراء (للعرض)
  assignments: TechAssignment[]; 
}

export default function EnterpriseOperationsPage() {
  const router = useRouter();
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [allManagers, setAllManagers] = useState<any[]>([]); // قائمة المدراء المتاحين في الشركة
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isProjectDetailsModalOpen, setProjectDetailsModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNewManager, setSelectedNewManager] = useState(''); // لاختيار مدير جديد للمشروع

  // --- جلب البيانات ---
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. جلب قائمة كل المدراء في الشركة (لكي يختار منهم الأدمن)
      const { data: managersData } = await supabase.from('profiles').select('id, full_name, job_title').in('role', ['super_admin', 'project_manager']);
      if (managersData) setAllManagers(managersData);

      // 2. جلب المشاريع بناءً على الصلاحية (الأدمن يرى الكل، المدير يرى ما تم إسناده له في مصفوفة assigned_managers)
      let query = supabase.from('projects').select('*');
      if (!isAdmin) {
          query = query.contains('assigned_managers', [user.id]);
      }
      const { data: projectsData } = await query.order('created_at', { ascending: false });

      // 3. جلب جميع الإسنادات
      const { data: assignmentsData } = await supabase.from('task_assignments').select('*');
      // 4. جلب أسماء الفنيين
      const { data: techsData } = await supabase.from('profiles').select('id, full_name');
      
      if (projectsData) {
          const mappedTasks = projectsData.map((p: any) => {
              // ربط الإسنادات وتجهيزها
              const projectAssignments = assignmentsData?.filter((a: any) => a.project_id === p.id) || [];
              const assignments = projectAssignments.map((ta: any) => {
                  const techInfo = techsData?.find((t: any) => t.id === ta.tech_id);
                  const managerInfo = managersData?.find((m: any) => m.id === ta.assigned_by);
                  return {
                      tech_id: ta.tech_id,
                      full_name: techInfo?.full_name || 'غير معروف',
                      status: ta.status || 'Pending',
                      team_name: ta.team_name || 'فرقة غير مسماة',
                      team_zone: ta.team_zone || 'نطاق غير محدد',
                      assigned_by: ta.assigned_by,
                      manager_name: managerInfo?.full_name || 'مدير غير معروف'
                  };
              });

              // ربط المدراء المسندين للمشروع ببياناتهم الكاملة
              const managerObjects = (p.assigned_managers || []).map((mId: string) => {
                  return managersData?.find(m => m.id === mId) || { id: mId, full_name: 'Unknown' };
              });

              return { 
                  ...p, 
                  manager_objects: managerObjects,
                  assignments, 
                  status: assignments.length > 0 ? 'In Progress' : 'Pending',
              };
          });
          setTasks(mappedTasks);
          // تحديث النافذة المفتوحة إن وجدت
          if (selectedTask) {
              const updatedTask = mappedTasks.find(t => t.id === selectedTask.id);
              if (updatedTask) setSelectedTask(updatedTask);
          }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user, isAdmin]);

  // --- دالة إضافة مدير جديد للمشروع (خاصة بالأدمن) ---
  const assignManagerToProject = async () => {
      if (!selectedTask || !selectedNewManager) return;
      setIsSubmitting(true);
      try {
          // جلب المصفوفة الحالية وإضافة المدير الجديد (بدون تكرار)
          const currentManagers = selectedTask.assigned_managers || [];
          if (currentManagers.includes(selectedNewManager)) {
              alert('هذا المدير مضاف مسبقاً لهذا المشروع');
              setIsSubmitting(false);
              return;
          }
          const updatedManagers = [...currentManagers, selectedNewManager];

          const { error } = await supabase.from('projects').update({ assigned_managers: updatedManagers }).eq('id', selectedTask.id);
          if (error) throw error;
          
          alert('تم إضافة المدير للمشروع بنجاح!');
          setSelectedNewManager('');
          await fetchData(); // إعادة جلب البيانات لتحديث العرض
      } catch (error: any) {
          alert('حدث خطأ أثناء الإضافة: ' + error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  // --- تجميع الفنيين في شكل شجري (المدير -> الفرقة -> النطاق -> الفنيين) ---
  const getHierarchy = (task: ProjectTask) => {
      const hierarchy: any = {};
      task.assignments.forEach(assign => {
          const mName = assign.manager_name || 'مدير غير معروف';
          const tName = assign.team_name || 'الفرقة الأساسية';
          const tZone = assign.team_zone || 'نطاق غير محدد';

          if (!hierarchy[mName]) hierarchy[mName] = {};
          if (!hierarchy[mName][tName]) hierarchy[mName][tName] = { zone: tZone, members: [] };
          
          hierarchy[mName][tName].members.push(assign);
      });
      return hierarchy;
  };

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return { text: 'غير محدد', color: 'text-slate-500' };
    const diff = new Date(endDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, color: 'text-red-600' };
    if (days === 0) return { text: 'ينتهي اليوم!', color: 'text-amber-600' };
    return { text: `متبقي ${days} يوم`, color: 'text-emerald-600' };
  };

  const filteredTasks = tasks.filter(t => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = t.title.toLowerCase().includes(searchLower) || 
                          t.manager_objects?.some(m => m.full_name.toLowerCase().includes(searchLower)) ||
                          t.assignments.some(a => a.full_name.toLowerCase().includes(searchLower));
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchStatus;
  });

  const textMain = isDark ? "text-white" : "text-slate-900";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${isDark ? "bg-slate-950" : "bg-slate-50"} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className={`text-3xl font-black flex items-center gap-3 ${textMain}`}>
              <Zap className="text-blue-500" fill="currentColor" size={28} />
              {isAdmin ? (isRTL ? 'الرقابة العامة على المهام' : 'Global Task Control') : (isRTL ? 'توزيع وإدارة المهام' : 'Task Dispatch')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setIsNewEmployeeModalOpen(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition flex items-center gap-2">
                <UserPlus size={18}/> {isRTL ? 'طلب توظيف فني' : 'Request Tech'}
             </button>
             <button className={`p-2.5 rounded-xl transition ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18}/></button>
             <button className={`p-2.5 rounded-xl transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`} onClick={() => setViewMode('list')}><List size={18}/></button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute ltr:left-4 rtl:right-4 top-3.5 text-slate-400 w-5 h-5" />
                <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={isRTL ? 'بحث باسم المشروع، المدير، أو الفني...' : 'Search...'} className={`w-full rounded-[1.2rem] py-3.5 px-12 text-sm font-bold outline-none border transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500 shadow-sm'}`} />
            </div>
        </div>
      </div>

      {/* 🚀 Main Content: Project Cards */}
      <div className="p-8">
        {loading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
        ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                {filteredTasks.map(task => (
                    <motion.div 
                        initial={{opacity:0}} animate={{opacity:1}} key={task.id} 
                        className={`rounded-[2.5rem] border p-8 transition-all hover:shadow-xl cursor-pointer ${cardBg}`}
                        onClick={() => { setSelectedTask(task); setProjectDetailsModalOpen(true); }}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">PRJ-{task.id.substring(0,6)}</span>
                                <h3 className={`text-xl font-black mt-2 leading-tight ${textMain}`}>{task.title}</h3>
                            </div>
                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black border ${task.status === 'In Progress' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{task.status}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 uppercase">المشرفين</span>
                                <div className="flex -space-x-2 rtl:space-x-reverse">
                                    {task.manager_objects && task.manager_objects.length > 0 ? task.manager_objects.map((m:any, i:number) => (
                                        <div key={i} className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-slate-900 shadow-sm" title={m.full_name}>{m.full_name.charAt(0)}</div>
                                    )) : <span className="text-slate-400">لا يوجد</span>}
                                </div>
                            </div>
                            <div className="space-y-1"><span className="text-[10px] text-slate-400 uppercase">الفنيين المسندين</span><div className="flex items-center gap-1 text-sm text-slate-800 dark:text-slate-200"><Users size={14}/> {task.assignments.length}</div></div>
                        </div>
                        
                        {/* 🚀 الزر معزول عن النقر لكي يذهب لغرفة العمليات */}
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projects/assign/${task.id}`); }} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs transition active:scale-95 shadow-lg flex items-center justify-center gap-2">
                            <Edit size={16}/> {isRTL ? 'إدارة التكليفات والفرق للمشروع' : 'Manage Teams'}
                        </button>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      {/* --- 🚀 MODAL: PROJECT DETAILS (SMART HIERARCHY) --- */}
      <AnimatePresence>
        {isProjectDetailsModalOpen && selectedTask && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setProjectDetailsModalOpen(false)}>
                <motion.div 
                    initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }} 
                    className={`w-full max-w-5xl my-auto rounded-[3rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
                    onClick={(e) => e.stopPropagation()} 
                >
                    
                    {/* Header */}
                    <div className={`px-10 py-8 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black font-mono">PRJ-{selectedTask.id.substring(0,8)}</span>
                            </div>
                            <h3 className={`font-black text-2xl ${textMain}`}>{selectedTask.title}</h3>
                        </div>
                        <button onClick={() => setProjectDetailsModalOpen(false)} className={`p-3 rounded-full transition ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-red-900/30 hover:text-red-400' : 'bg-white text-slate-500 shadow-sm hover:text-red-500'}`}><X size={24}/></button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar pb-24">
                        
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 flex items-center gap-2"><MapPin size={14}/> النطاقات المعتمدة (المواقع)</div>
                                <div className="space-y-1 mt-3">
                                    {selectedTask.work_zones && selectedTask.work_zones.length > 0 ? (
                                        selectedTask.work_zones.map((w:any, idx:number) => (
                                            <div key={idx} className={`text-sm font-bold flex items-center gap-2 ${textMain}`}><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {w.region}</div>
                                        ))
                                    ) : <span className="text-sm font-bold text-slate-400">لم يتم تحديد نطاقات</span>}
                                </div>
                            </div>
                            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 flex items-center gap-2"><Calendar size={14}/> الوقت المتبقي</div>
                                <div className={`font-black text-xl mt-1 ${getDaysLeft(selectedTask.end_date).color}`}>{getDaysLeft(selectedTask.end_date).text}</div>
                                <div className="text-[11px] text-slate-400 font-bold mt-2 bg-slate-200/50 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit">الموعد: {selectedTask.start_date} ➝ {selectedTask.end_date}</div>
                            </div>
                        </div>

                        {/* 🚀 قسم إضافة مدراء للمشروع (خاص للأدمن) */}
                        {isAdmin && (
                            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-blue-950/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
                                <h4 className="text-sm font-black flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-4"><Shield size={18}/> إدارة مشرفي المشروع (صلاحية الإدارة)</h4>
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="flex-1 flex flex-wrap gap-2 w-full">
                                        {selectedTask.manager_objects && selectedTask.manager_objects.length > 0 ? (
                                            selectedTask.manager_objects.map((m:any, i:number) => (
                                                <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                                                    <Briefcase size={14} className="text-blue-500"/> {m.full_name}
                                                </div>
                                            ))
                                        ) : <span className="text-sm text-slate-500">لا يوجد مشرفين حتى الآن</span>}
                                    </div>
                                    <div className="flex w-full md:w-auto gap-2">
                                        <select value={selectedNewManager} onChange={e=>setSelectedNewManager(e.target.value)} className={`text-sm font-bold px-4 py-3 rounded-xl outline-none cursor-pointer border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                                            <option value="">-- تعيين مدير إضافي --</option>
                                            {allManagers.filter(m => !(selectedTask.assigned_managers || []).includes(m.id)).map(m => (
                                                <option key={m.id} value={m.id}>{m.full_name} ({m.job_title})</option>
                                            ))}
                                        </select>
                                        <button onClick={assignManagerToProject} disabled={!selectedNewManager || isSubmitting} className="px-5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition disabled:opacity-50">إضافة</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 🚀 الهيكل الشجري للفرق والتكليفات */}
                        <div>
                            <h4 className={`text-sm font-black flex items-center gap-2 pb-4 border-b uppercase tracking-widest ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                                <Users size={18}/> الهيكل التنظيمي للعمل ({selectedTask.assignments.length} فني مسند)
                            </h4>
                            
                            {selectedTask.assignments.length === 0 ? (
                                <div className={`text-center py-12 rounded-3xl border-2 border-dashed mt-6 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                                    <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3"/>
                                    <p className="text-sm font-bold text-slate-500">المشروع قيد الانتظار. لم يقم المدراء بتشكيل فرق أو إسناد فنيين حتى الآن.</p>
                                </div>
                            ) : (
                                <div className="space-y-8 mt-6">
                                    {/* تفكيك الهيكل: عرض كل مدير -> فرقه -> فنييه */}
                                    {Object.keys(getHierarchy(selectedTask)).map((managerName, mIdx) => {
                                        const managerTeams = getHierarchy(selectedTask)[managerName];
                                        return (
                                            <div key={mIdx} className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg border border-blue-200">{managerName.charAt(0)}</div>
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase">إشراف وإدارة</div>
                                                        <div className={`font-black text-lg ${textMain}`}>{managerName}</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pl-4 rtl:pr-4 rtl:pl-0 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-200 dark:border-slate-700 ml-4 rtl:mr-4">
                                                    {Object.keys(managerTeams).map((teamName, tIdx) => {
                                                        const teamInfo = managerTeams[teamName];
                                                        return (
                                                            <div key={tIdx} className={`p-5 rounded-2xl border relative ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                                <div className="absolute top-1/2 -left-[18px] rtl:-left-auto rtl:-right-[18px] w-4 h-0.5 bg-slate-200 dark:bg-slate-700"></div>
                                                                
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                                    <div>
                                                                        <h5 className={`font-black text-base ${textMain}`}>{teamName}</h5>
                                                                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md mt-1 inline-block border border-amber-100 dark:border-amber-900/30">
                                                                            <MapPin size={10} className="inline mr-1 rtl:ml-1"/>نطاق العمل: {teamInfo.zone}
                                                                        </span>
                                                                    </div>
                                                                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                        {teamInfo.members.length} أفراد
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                                    {teamInfo.members.map((member: any, i:number) => (
                                                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs border dark:border-slate-700">{member.full_name.charAt(0)}</div>
                                                                            <div className="flex-1">
                                                                                <div className={`font-bold text-xs truncate ${textMain}`}>{member.full_name}</div>
                                                                                <div className={`text-[9px] font-bold mt-0.5 ${member.status === 'Pending' ? 'text-amber-500' : 'text-emerald-500'}`}>حالة التطبيق: {member.status}</div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                    
                    {/* Fixed Bottom Action Bar */}
                    <div className={`p-6 border-t flex justify-end shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                        <button onClick={() => { setProjectDetailsModalOpen(false); router.push(`/dashboard/projects/assign/${selectedTask.id}`); }} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl flex items-center gap-3 transition active:scale-95">
                            <Edit size={18}/> الانتقال لغرفة العمليات لتعديل الفرق
                        </button>
                    </div>

                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}
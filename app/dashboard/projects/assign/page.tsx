'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { 
  Search, Briefcase, UserPlus, Calendar, 
  AlertTriangle, CheckCircle2, ChevronDown, LayoutGrid, 
  List, Zap, BarChart3, Clock, BrainCircuit, 
  ArrowRight, ArrowLeft, MoreHorizontal, MapPin, ShieldAlert,
  Loader2, Sparkles, UserCheck, X, AlignLeft, FileText, Info, UploadCloud, Edit, Users
} from 'lucide-react';
import { useDashboard } from '../../layout';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type Priority = 'Critical' | 'High' | 'Medium' | 'Normal';
type TaskStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Review' | 'Completed'; // 👈 تم تحديث الحالات

interface TechAssignment {
    tech_id: string;
    full_name: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed';
    clarification_note?: string;
}

interface ProjectTask {
  id: string;
  title: string;
  category: string;
  status: TaskStatus;
  start_date: string;
  location_name: string;
  assignments: TechAssignment[]; // 👈 تفاصيل الفنيين وحالاتهم
  task_description?: string; 
  task_requirements?: string; 
  work_shift?: string;        
}

interface Employee {
  id: string;
  full_name: string;
  role: string;
  job_title: string;
  status: 'Available' | 'Busy';
  skill_match: number;
}

export default function EnterpriseOperationsPage() {
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  
  // Loaders
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // New Employee Form & Files
  const [newEmp, setNewEmp] = useState({ full_name: '', national_id: '', phone: '', email: '', address: '', job_title: '', role: 'technician' });
  const [iqamaFile, setIqamaFile] = useState<File | null>(null);
  const [expFile, setExpFile] = useState<File | null>(null);
  const iqamaRef = useRef<HTMLInputElement>(null);
  const expRef = useRef<HTMLInputElement>(null);

  // Assign Task Form
  const [assignData, setAssignData] = useState({ description: '', requirements: '', shift: '' });
  const [techSearch, setTechSearch] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<Employee[]>([]);

  // AI States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // --- 1. Fetch Real Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 🔥 جلب المشاريع بدون العلاقات المتداخلة أولاً
        const { data: projectsData, error: projError } = await supabase
          .from('projects')
          .select('*')
          .ilike('manager_name', `%${user?.full_name || ''}%`)
          .order('created_at', { ascending: false });

        if (projError) throw projError; 

        // جلب جميع الإسنادات للمشاريع
        const { data: assignmentsData, error: assignError } = await supabase
          .from('task_assignments')
          .select('*');

        if (assignError) throw assignError;

        // جلب بيانات الفنيين
        const { data: techsData, error: techError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('role', ['technician', 'engineer']);

        if (techError) throw techError;

        if (projectsData) {
            const mappedTasks: ProjectTask[] = projectsData.map((p: any) => {
                
                // البحث عن الإسنادات الخاصة بهذا المشروع
                const projectAssignments = assignmentsData?.filter((a: any) => a.project_id === p.id) || [];
                
                const assignments: TechAssignment[] = projectAssignments.map((ta: any) => {
                    // البحث عن بيانات الفني من قائمة الفنيين
                    const techData = techsData?.find((t: any) => t.id === ta.tech_id);
                    return {
                        tech_id: ta.tech_id,
                        full_name: techData?.full_name || 'Unknown',
                        status: ta.status || 'Pending',
                        clarification_note: ta.clarification_note
                    };
                });

                // 🚀 تحديد حالة المشروع بناءً على موافقات الفنيين
                let calcStatus: TaskStatus = 'Pending';
                if (assignments.length > 0) {
                    const allAccepted = assignments.every(a => a.status === 'Accepted' || a.status === 'Completed');
                    const someAccepted = assignments.some(a => a.status === 'Accepted');
                    
                    if (allAccepted) calcStatus = 'In Progress';
                    else if (someAccepted) calcStatus = 'In Progress'; // ولو واحد وافق يعتبر بدأ
                    else calcStatus = 'Assigned'; // تم الإرسال وبانتظار الرد
                }

                return {
                    id: p.id, 
                    title: p.title, 
                    category: p.category, 
                    status: calcStatus, 
                    start_date: p.start_date, 
                    location_name: p.location_name, 
                    assignments: assignments,
                    task_description: p.task_description || '',
                    task_requirements: p.task_requirements || '',
                    work_shift: p.work_shift || ''
                };
            });
            setTasks(mappedTasks);
        }

        // جلب الفنيين للمدير ليختار منهم
        const { data: empsData, error: empsError } = await supabase
            .from('profiles')
            .select('id, full_name, role, job_title')
            .in('role', ['technician', 'engineer']);
        
        if (empsError) throw empsError;

        if (empsData) {
            const mappedEmps = empsData.map(e => ({
                ...e, status: Math.random() > 0.3 ? 'Available' : 'Busy', skill_match: Math.floor(Math.random() * 20) + 80
            })) as Employee[];
            setEmployees(mappedEmps.sort((a,b) => b.skill_match - a.skill_match));
        }
      } catch (error: any) { 
          console.error("Error fetching data:", error.message || error.hint || error); 
      } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  // --- 2. Multiple Assignment Logic ---
  
  const openAssignModal = (task: ProjectTask) => {
      setSelectedTask(task);
      setAssignData({
          description: task.task_description || '',
          requirements: task.task_requirements || '',
          shift: task.work_shift || ''
      });
      
      // تحديد الفنيين الذين تم اختيارهم مسبقاً لكي يظهروا في القائمة (سواء وافقوا أو لا)
      const assignedTechIds = task.assignments.map(a => a.tech_id);
      const preSelected = employees.filter(emp => assignedTechIds.includes(emp.id));
      setSelectedTechs(preSelected);
      
      setTechSearch('');
      setAssignModalOpen(true);
  };

  const toggleTechSelection = (emp: Employee) => {
      if (emp.status !== 'Available') return; 
      setSelectedTechs(prev => {
          const exists = prev.find(t => t.id === emp.id);
          if (exists) return prev.filter(t => t.id !== emp.id);
          return [...prev, emp];
      });
  };

  const handleConfirmAssignment = async () => {
    if (!selectedTask || !user) return;
    setIsAssigning(true);
    
    try {
        const techIds = selectedTechs.map(t => t.id);

        // 1. تحديث جدول المشاريع (بالوصف والمتطلبات) فقط
        const { error: projError } = await supabase.from('projects').update({ 
            status: 'Active', 
            task_description: assignData.description,
            task_requirements: assignData.requirements,
            work_shift: assignData.shift
        }).eq('id', selectedTask.id);

        if (projError) throw projError;

        // 2. تحديث جدول task_assignments
        // بدلاً من حذف الكل (مما يضيع حالة الفنيين اللي وافقوا)، سنحذف فقط من تم إزالته من القائمة
        
        // أ. جلب الإسنادات الحالية للمشروع
        const { data: currentAssignments } = await supabase.from('task_assignments').select('tech_id').eq('project_id', selectedTask.id);
        const currentTechIds = currentAssignments?.map(a => a.tech_id) || [];

        // ب. الفنيين المطلوب حذفهم (كانوا موجودين وتم إزالتهم من التحديد)
        const techIdsToRemove = currentTechIds.filter(id => !techIds.includes(id));
        if (techIdsToRemove.length > 0) {
            await supabase.from('task_assignments').delete().eq('project_id', selectedTask.id).in('tech_id', techIdsToRemove);
        }

        // ج. الفنيين الجدد (لم يكونوا موجودين وتم إضافتهم)
        const techIdsToAdd = techIds.filter(id => !currentTechIds.includes(id));
        if (techIdsToAdd.length > 0) {
            const assignmentsData = techIdsToAdd.map(techId => ({
                project_id: selectedTask.id,
                tech_id: techId,
                assigned_by: user.id,
                status: 'Pending'
            }));
            const { error: assignError } = await supabase.from('task_assignments').insert(assignmentsData);
            if (assignError) throw assignError;
        }

        // 3. تحديث الواجهة فوراً بريفرش سريع للبيانات (لضمان دقة الحالات)
        alert(isRTL ? `تم اعتماد وتحديث الإسناد بنجاح!` : `Assignment updated successfully!`);
        window.location.reload(); // أسهل طريقة لضمان تطابق البيانات هي إعادة تحميل خفيفة
        
    } catch (e:any) { 
        alert('Error: ' + e.message); 
        console.error(e);
    }
    finally { setIsAssigning(false); }
  };

  // --- 3. Smart Employee Request Logic ---
  const handleCompressFile = async (file: File) => {
      if (file.type.startsWith('image/')) {
          try {
              const compressedBlob = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
              return new File([compressedBlob], file.name, { type: file.type });
          } catch (e) { console.error("Compression failed", e); return file; }
      }
      return file;
  };

  const submitNewEmployeeRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmittingEmp(true);
      try {
          const { data: exist } = await supabase.from('profiles').select('id').or(`national_id.eq.${newEmp.national_id},phone.eq.${newEmp.phone}`);
          const { data: existPend } = await supabase.from('pending_employees').select('id').or(`national_id.eq.${newEmp.national_id},phone.eq.${newEmp.phone}`);

          if ((exist && exist.length > 0) || (existPend && existPend.length > 0)) {
              alert(isRTL ? 'خطأ: رقم الهوية أو الجوال مسجل مسبقاً.' : 'Error: ID or Phone exists.');
              setIsSubmittingEmp(false); return;
          }

          let iqamaUrl = null, expUrl = null;
          if (iqamaFile) {
              const cFile = await handleCompressFile(iqamaFile);
              const fileName = `iqamas/${Date.now()}_${cFile.name}`;
              await supabase.storage.from('tech-media').upload(fileName, cFile);
              iqamaUrl = supabase.storage.from('tech-media').getPublicUrl(fileName).data.publicUrl;
          }
          if (expFile) {
              const cFile = await handleCompressFile(expFile);
              const fileName = `experience/${Date.now()}_${cFile.name}`;
              await supabase.storage.from('tech-media').upload(fileName, cFile);
              expUrl = supabase.storage.from('tech-media').getPublicUrl(fileName).data.publicUrl;
          }

          const { error } = await supabase.from('pending_employees').insert({
              requested_by: user?.id, ...newEmp, iqama_url: iqamaUrl, experience_url: expUrl
          });

          if (error) throw error;
          alert(isRTL ? 'تم الإرسال للإدارة بنجاح' : 'Request sent to Admin');
          setIsNewEmployeeModalOpen(false);
          setNewEmp({ full_name: '', national_id: '', phone: '', email: '', address: '', job_title: '', role: 'technician' });
          setIqamaFile(null); setExpFile(null);
      } catch (error: any) { alert('Error: ' + error.message); } 
      finally { setIsSubmittingEmp(false); }
  };

  const runTaskAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
        const top3 = employees.filter(e => e.status === 'Available').slice(0, 3);
        setSelectedTechs(top3);
        setAiRecommendation(isRTL ? `تم تحديد أفضل ${top3.length} فنيين متاحين بناءً على التقييم.` : `Auto-selected top ${top3.length} matching techs.`);
        setIsAiAnalyzing(false);
    }, 1500);
  };

  const filteredTasks = tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.location_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchSearch && matchStatus;
  });

  const filteredTechs = employees.filter(e => 
    e.full_name.toLowerCase().includes(techSearch.toLowerCase()) || e.job_title.toLowerCase().includes(techSearch.toLowerCase())
  );

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Header Area */}
      <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className={`text-3xl font-black flex items-center gap-3 ${textMain}`}>
              <Zap className="text-blue-500" fill="currentColor" size={28} />
              {isRTL ? 'مشاريعي ومهامي' : 'My Projects & Tasks'}
            </h1>
            <p className={`text-sm font-medium mt-2 ${textSub}`}>
              {isRTL ? 'توزيع المهام على الفريق الفني بدقة ومتابعة حالة القبول.' : 'Dispatch tasks and monitor acceptance status.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setIsNewEmployeeModalOpen(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition flex items-center gap-2">
                <UserPlus size={18}/> {isRTL ? 'طلب إضافة فني' : 'Request Technician'}
             </button>
             <div className={`h-8 w-px mx-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
             <button className={`p-2.5 rounded-xl transition ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18}/></button>
             <button className={`p-2.5 rounded-xl transition ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`} onClick={() => setViewMode('list')}><List size={18}/></button>
          </div>
        </div>

        {/* Smart Filters */}
        <div className="mt-8 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute ltr:left-4 rtl:right-4 top-3.5 text-slate-400 w-5 h-5" />
                <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder={isRTL ? 'بحث في مشاريعي...' : 'Search my projects...'} className={`w-full rounded-2xl py-3.5 px-12 text-sm font-bold outline-none transition-all ${isDark ? 'bg-slate-900 border border-slate-800 text-white focus:border-blue-500' : 'bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 focus:shadow-sm text-slate-800'}`} />
            </div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className={`rounded-2xl px-5 py-3.5 text-sm font-bold outline-none cursor-pointer appearance-none ${isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-slate-100 border border-transparent text-slate-800'}`}>
                <option value="All">{isRTL ? 'كل الحالات' : 'All Status'}</option>
                <option value="Pending">{isRTL ? 'بانتظار الإسناد' : 'Pending'}</option>
                <option value="Assigned">{isRTL ? 'تم الإرسال للفنيين' : 'Assigned'}</option>
                <option value="In Progress">{isRTL ? 'قيد التنفيذ (مقبولة)' : 'In Progress'}</option>
            </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {loading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-blue-600" size={40}/></div>
        ) : filteredTasks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium">
                {isRTL ? 'لم يتم إسناد أي مشاريع لإدارتك بعد.' : 'No projects assigned to your management yet.'}
            </div>
        ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                {filteredTasks.map(task => {
                    // 🚀 حساب الإحصائيات لعرضها للمدير
                    const totalAssigned = task.assignments.length;
                    const acceptedCount = task.assignments.filter(a => a.status === 'Accepted').length;
                    const pendingCount = task.assignments.filter(a => a.status === 'Pending').length;
                    const rejectedCount = task.assignments.filter(a => a.status === 'Rejected').length;

                    return (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={task.id} className={`rounded-[2rem] border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group flex flex-col justify-between ${cardBg} ${viewMode === 'list' ? 'flex-row items-center p-4' : ''}`}>
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${task.status === 'Pending' ? 'bg-slate-300 dark:bg-slate-700' : task.status === 'Assigned' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                        <div className={`p-6 ${viewMode === 'list' ? 'flex items-center justify-between w-full' : ''}`}>
                            <div className={viewMode === 'list' ? 'flex items-center gap-6' : ''}>
                                <div className="mb-4">
                                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">PRJ-{task.id.substring(0,6)}</span>
                                    <h3 className={`text-lg font-black mt-2 leading-tight ${textMain}`}>{task.title}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <Badge text={task.category} type="priority" />
                                    {/* 🚀 حالة المهمة الديناميكية */}
                                    <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                                        task.status === 'Pending' ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' :
                                        task.status === 'Assigned' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30' :
                                        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30'
                                    }`}>
                                        {task.status === 'Pending' && (isRTL ? 'لم يتم الإسناد' : 'Not Assigned')}
                                        {task.status === 'Assigned' && (isRTL ? 'بانتظار موافقة الفنيين' : 'Awaiting Accept')}
                                        {task.status === 'In Progress' && (isRTL ? 'قيد التنفيذ' : 'In Progress')}
                                    </span>
                                </div>
                            </div>

                            <div className={`space-y-3 text-sm font-medium ${textSub} ${viewMode === 'list' ? 'hidden' : ''}`}>
                                <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-400" /> <span className="truncate">{task.location_name || 'N/A'}</span></div>
                                <div className="flex items-center gap-3"><Calendar size={16} className="text-slate-400" /> <span>{task.start_date || 'No Date'}</span></div>
                            </div>
                        </div>

                        <div className={`p-5 bg-slate-50 dark:bg-slate-900/50 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} ${viewMode === 'list' ? 'border-t-0 border-l ml-4 pl-6 w-96 shrink-0' : ''}`}>
                            {totalAssigned > 0 ? (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`text-[10px] uppercase font-bold ${textSub} flex items-center gap-1`}><Users size={12}/> {isRTL ? 'حالة فريق التنفيذ' : 'Team Status'}</div>
                                        <button 
                                            onClick={() => openAssignModal(task)} 
                                            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 rounded-lg hover:shadow-md transition-all"
                                            title={isRTL ? 'تعديل الإسناد' : 'Edit Assignment'}
                                        >
                                            <Edit size={14} />
                                        </button>
                                    </div>
                                    
                                    {/* 🚀 إحصائيات موافقة الفنيين */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 rounded-xl text-center">
                                            <div className="text-lg font-black text-slate-800 dark:text-white leading-none">{totalAssigned}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Total</div>
                                        </div>
                                        <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-2 rounded-xl text-center">
                                            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{acceptedCount}</div>
                                            <div className="text-[9px] font-bold text-emerald-500 uppercase mt-1">Accepted</div>
                                        </div>
                                        <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-2 rounded-xl text-center">
                                            <div className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">{pendingCount}</div>
                                            <div className="text-[9px] font-bold text-amber-500 uppercase mt-1">Pending</div>
                                        </div>
                                    </div>
                                    {rejectedCount > 0 && <div className="text-xs text-rose-500 font-bold mt-2 text-center flex items-center justify-center gap-1"><AlertTriangle size={12}/> {rejectedCount} {isRTL ? 'رفضوا المهمة!' : 'Rejected!'}</div>}
                                </div>
                            ) : (
                                <button onClick={() => openAssignModal(task)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95">
                                    <UserPlus size={18} /> {isRTL ? 'تكوين وإسناد فريق' : 'Assign Tech Team'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )})}
            </div>
        )}
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        
        {/* 🚀 Modal 1: REDESIGNED Assignment Modal */}
        {isAssignModalOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }} className={`w-full max-w-6xl my-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-[#f4f6f8] border border-white'}`}>
                
                <div className={`px-8 py-6 border-b flex justify-between items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <button onClick={() => setAssignModalOpen(false)} className={`p-2.5 rounded-full transition-colors ${isDark ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400' : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500'}`}>
                        <X size={20} strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <h3 className={`font-black text-2xl tracking-tight ${textMain}`}>
                            {selectedTask.assignments.length > 0 ? (isRTL ? 'تعديل الفريق والتفاصيل' : 'Edit Assignment') : (isRTL ? 'تكوين وإسناد المهمة' : 'Dispatch Field Task')}
                        </h3>
                        <p className={`text-sm mt-1 font-medium ${textSub}`}>{selectedTask.title}</p>
                    </div>
                    <div className="w-10"></div> 
                </div>

                <div className={`p-8 grid grid-cols-1 lg:grid-cols-12 gap-8`}>
                    
                    {/* Left/Right Column: Instructions */}
                    <div className={`lg:col-span-7 space-y-4 ${isRTL ? 'lg:order-2' : 'lg:order-1'}`}>
                        <div className="flex items-center justify-end gap-2 mb-2 pr-2">
                            <h4 className={`font-bold text-sm ${textMain}`}>{isRTL ? 'توجيهات مدير المشروع (تظهر للفريق)' : 'Manager Instructions'}</h4>
                            <Info size={18} className="text-blue-500"/>
                        </div>
                        
                        <div className="space-y-4">
                            <div className={`p-1.5 rounded-[1.5rem] shadow-sm transition-all ${isDark ? 'bg-slate-800' : 'bg-white hover:shadow-md'}`}>
                                <div className="flex items-start gap-4 p-3">
                                    <textarea placeholder={isRTL ? 'وصف تفصيلي للمهمة...' : 'Task description...'} value={assignData.description} onChange={e=>setAssignData({...assignData, description: e.target.value})} rows={3} className="w-full bg-transparent outline-none resize-none text-sm font-medium placeholder:text-slate-400"/>
                                    <AlignLeft className="text-slate-300 mt-1 shrink-0" />
                                </div>
                            </div>
                            <div className={`p-1.5 rounded-[1.5rem] shadow-sm transition-all ${isDark ? 'bg-slate-800' : 'bg-white hover:shadow-md'}`}>
                                <div className="flex items-start gap-4 p-3">
                                    <textarea placeholder={isRTL ? 'المتطلبات والمعدات اللازمة...' : 'Requirements...'} value={assignData.requirements} onChange={e=>setAssignData({...assignData, requirements: e.target.value})} rows={2} className="w-full bg-transparent outline-none resize-none text-sm font-medium placeholder:text-slate-400"/>
                                    <FileText className="text-slate-300 mt-1 shrink-0" />
                                </div>
                            </div>
                            <div className={`p-1.5 rounded-[1.5rem] shadow-sm transition-all ${isDark ? 'bg-slate-800' : 'bg-white hover:shadow-md'}`}>
                                <div className="flex items-center gap-4 p-3">
                                    <input type="text" placeholder={isRTL ? 'فترة العمل (اختياري، مثال: مسائي 4-10)...' : 'Work shift...'} value={assignData.shift} onChange={e=>setAssignData({...assignData, shift: e.target.value})} className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-slate-400"/>
                                    <Clock className="text-slate-300 shrink-0" />
                                </div>
                            </div>
                            <div className={`p-5 rounded-[1.5rem] shadow-sm flex items-center justify-between ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                                <div className="text-right">
                                    <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${textSub}`}>{isRTL ? 'موقع التنفيذ المرفق:' : 'Execution Location:'}</div>
                                    <div className={`text-sm font-black ${textMain}`}>{selectedTask.location_name}</div>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><MapPin size={24} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Right/Left Column: Select Technicians */}
                    <div className={`lg:col-span-5 flex flex-col h-[550px] relative ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <button onClick={runTaskAiAnalysis} className="text-xs font-bold text-purple-600 bg-purple-100/50 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-100 transition-colors">
                                {isAiAnalyzing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} AI
                            </button>
                            <label className={`text-sm font-bold flex gap-2 ${textMain}`}>
                                {isRTL ? 'تكوين الفريق الفني' : 'Build Tech Team'}
                                {selectedTechs.length > 0 && <span className="bg-blue-600 text-white px-2 rounded-full text-xs flex items-center">{selectedTechs.length}</span>}
                            </label>
                        </div>

                        {aiRecommendation && (
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-lg mb-4 animate-in slide-in-from-top-2">
                                {aiRecommendation}
                            </div>
                        )}

                        <div className={`flex items-center gap-3 p-2 rounded-[1.2rem] shadow-sm mb-4 shrink-0 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                            <input type="text" placeholder={isRTL ? 'اكتب اسم الفني...' : 'Search name...'} value={techSearch} onChange={e=>setTechSearch(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm px-4 font-medium placeholder:text-slate-400" />
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-400"><Search size={18} /></div>
                        </div>

                        {/* Tech List (Scrollable) */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-24">
                            {filteredTechs.map(emp => {
                                const isSelected = selectedTechs.some(t => t.id === emp.id);
                                // 🚀 إظهار حالة الفني إذا كان مسنداً مسبقاً
                                const previousAssignment = selectedTask.assignments.find(a => a.tech_id === emp.id);
                                
                                return (
                                <div key={emp.id} onClick={() => toggleTechSelection(emp)}
                                    className={`p-2 rounded-[1.5rem] transition-all flex items-center justify-between group border shadow-sm ${emp.status !== 'Available' ? 'opacity-50 border-transparent bg-slate-200/50 dark:bg-slate-800/50 cursor-not-allowed' : isDark ? 'border-slate-700 bg-slate-800 hover:border-blue-500 cursor-pointer' : 'border-white bg-white hover:border-blue-200 cursor-pointer'}`}
                                >
                                    <div className="flex items-center gap-4 pl-4 rtl:pr-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                            {isSelected ? <CheckCircle2 size={20}/> : emp.full_name.charAt(0)}
                                        </div>
                                        <div className="py-2 text-left rtl:text-right">
                                            <div className={`font-bold text-sm ${isSelected ? 'text-blue-600 dark:text-blue-400' : textMain}`}>{emp.full_name}</div>
                                            <div className={`text-[11px] mt-0.5 font-medium flex gap-2 ${textSub}`}>
                                                {emp.job_title}
                                                {previousAssignment && (
                                                    <span className={`px-1.5 rounded ${
                                                        previousAssignment.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' :
                                                        previousAssignment.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                                        'bg-amber-100 text-amber-600'
                                                    }`}>{previousAssignment.status}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 flex flex-col items-end">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                            {isSelected && <CheckCircle2 size={14} className="text-white"/>}
                                        </div>
                                        <span className="text-[10px] text-blue-500 font-bold mt-2">Match: {emp.skill_match}%</span>
                                    </div>
                                </div>
                            )})}
                        </div>

                        {/* Floating Confirm Button */}
                        <AnimatePresence>
                            {(selectedTechs.length > 0 || selectedTask.assignments.length > 0) && (
                                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900 to-transparent pt-10">
                                    <button 
                                        disabled={isAssigning}
                                        onClick={handleConfirmAssignment} 
                                        className={`w-full py-4 text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 ${selectedTechs.length === 0 ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}
                                    >
                                        {isAssigning ? <Loader2 size={20} className="animate-spin"/> : (selectedTechs.length === 0 ? <X size={20}/> : <UserPlus size={20}/>)} 
                                        {selectedTechs.length === 0 ? (isRTL ? 'إلغاء جميع التعيينات' : 'Clear Assignments') : (isRTL ? `حفظ الإسناد (${selectedTechs.length})` : `Save Assignment (${selectedTechs.length})`)}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
          </div>
        )}

        {/* Modal 2: Request New Employee (Unchanged) */}
        {isNewEmployeeModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className={`w-full max-w-xl my-auto rounded-[2.5rem] shadow-2xl p-8 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className={`font-black text-2xl mb-1 ${textMain}`}>{isRTL ? 'طلب موظف جديد' : 'Request New Employee'}</h3>
                            <p className={`text-xs font-bold text-amber-500`}>{isRTL ? 'الطلب سيخضع لموافقة الإدارة' : 'Requires Admin Approval'}</p>
                        </div>
                        <button onClick={() => setIsNewEmployeeModalOpen(false)} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><X size={20}/></button>
                    </div>

                    <form onSubmit={submitNewEmployeeRequest} className="space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                            <input required type="text" placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'} value={newEmp.full_name} onChange={e=>setNewEmp({...newEmp, full_name: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                            <input required type="text" placeholder={isRTL ? 'رقم الهوية / الإقامة' : 'National ID'} value={newEmp.national_id} onChange={e=>setNewEmp({...newEmp, national_id: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <input required type="tel" placeholder={isRTL ? 'رقم الجوال' : 'Phone'} value={newEmp.phone} onChange={e=>setNewEmp({...newEmp, phone: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                            <input required type="email" placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'} value={newEmp.email} onChange={e=>setNewEmp({...newEmp, email: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <input required type="text" placeholder={isRTL ? 'المسمى الوظيفي (مثال: פني تمديدات)' : 'Job Title'} value={newEmp.job_title} onChange={e=>setNewEmp({...newEmp, job_title: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        
                        <div className="grid grid-cols-2 gap-5 pt-2">
                            <div onClick={() => iqamaRef.current?.click()} className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${iqamaFile ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-300 hover:border-blue-400'}`}>
                                <input type="file" accept="image/*,.pdf" ref={iqamaRef} className="hidden" onChange={(e) => e.target.files && setIqamaFile(e.target.files[0])} />
                                <UploadCloud size={24} className={iqamaFile ? 'text-blue-500' : 'text-slate-400'} />
                                <span className={`text-[10px] font-bold mt-2 ${iqamaFile ? 'text-blue-600' : textSub}`}>{iqamaFile ? 'تم إرفاق الإقامة' : (isRTL ? 'صورة الإقامة (اختياري)' : 'Upload ID')}</span>
                            </div>
                            <div onClick={() => expRef.current?.click()} className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${expFile ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-300 hover:border-blue-400'}`}>
                                <input type="file" accept="image/*,.pdf" ref={expRef} className="hidden" onChange={(e) => e.target.files && setExpFile(e.target.files[0])} />
                                <UploadCloud size={24} className={expFile ? 'text-blue-500' : 'text-slate-400'} />
                                <span className={`text-[10px] font-bold mt-2 ${expFile ? 'text-blue-600' : textSub}`}>{expFile ? 'تم إرفاق الخبرة' : (isRTL ? 'شهادة الخبرة (اختياري)' : 'Upload Cert')}</span>
                            </div>
                        </div>

                        <button disabled={isSubmittingEmp} type="submit" className="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            {isSubmittingEmp ? <Loader2 className="animate-spin" size={20}/> : <UserPlus size={20}/>} {isRTL ? 'إرسال طلب التوظيف' : 'Submit Request'}
                        </button>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Helper Components ---
function Badge({ text, type, isPending }: any) {
    let classes = "px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ";
    if (type === 'priority') classes += "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400";
    else if (type === 'status') {
        if (isPending) classes += "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400";
        else classes += "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400";
    }
    return <span className={classes}>{text}</span>;
}

function StatusBadge({ status }: { status: string }) {
    const styles = status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    return <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${styles}`}>{status}</span>;
}
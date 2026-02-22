'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { 
  CheckCircle2, Clock, AlertTriangle, Camera, 
  Send, MapPin, FileText, ChevronDown, ChevronUp, 
  Briefcase, Save, ShieldAlert, Sparkles, Loader2, X, 
  UploadCloud, Lock, Check, Calendar, Activity, Users, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout'; 

// --- Types & Interfaces ---
type StatusType = 'Not Started' | 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Blocked' | 'Delayed';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

interface Task {
  assignment_id: string;
  project_id: string;
  title: string;
  project_name: string;
  location: string;
  dueDate: string;
  currentSystemProgress: number; 
  assigned_tech_name: string; 
  manager_name: string;
  task_status: StatusType;
}

export default function EnterpriseFieldUpdatePage() {
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI & Processing States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<{type: 'warning' | 'success', msg: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Reporting Form State
  const [status, setStatus] = useState<StatusType>('In Progress');
  const [delayReason, setDelayReason] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [attendanceLocation, setAttendanceLocation] = useState<string | null>(null);

  // --- 1. Fetch Real Data (🛠️ FIXED: Decoupled Queries for 100% Reliability) ---
  useEffect(() => {
    const fetchFieldData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 1. جلب آخر تسجيل حضور لمعرفة الموقع (للفني فقط)
        if (user.role === 'technician' || user.role === 'engineer') {
            const { data: attendance } = await supabase
                .from('attendance')
                .select('location_name')
                .eq('user_id', user.id)
                .is('check_out_time', null)
                .single();
            if (attendance) setAttendanceLocation(attendance.location_name);
        }

        // 2. جلب الإسنادات بناءً على دور المستخدم
        let assignQuery = supabase.from('task_assignments').select('*');
        if (user.role === 'technician' || user.role === 'engineer') {
            assignQuery = assignQuery.eq('tech_id', user.id).in('status', ['Accepted', 'In Progress', 'Pending']);
        } else {
            assignQuery = assignQuery.in('status', ['Accepted', 'In Progress', 'Pending', 'Delayed', 'Blocked']);
        }

        const { data: assignments, error: assignError } = await assignQuery;
        if (assignError) throw assignError;

        if (assignments && assignments.length > 0) {
            
            // 3. جلب المشاريع المرتبطة
            const projectIds = [...new Set(assignments.map(a => a.project_id))];
            const { data: projectsData, error: projError } = await supabase
                .from('projects')
                .select('*')
                .in('id', projectIds);
            if (projError) throw projError;

            // 4. جلب أسماء الفنيين المرتبطين
            const techIds = [...new Set(assignments.map(a => a.tech_id))];
            const { data: profilesData, error: profError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', techIds);
            if (profError) throw profError;

            // 5. جلب إحصائيات الإنجاز لجميع المشاريع المحددة
            const { data: allAssignmentsData } = await supabase
                .from('task_assignments')
                .select('project_id, status')
                .in('project_id', projectIds);

            // 6. فلترة لمدير المشاريع (يجب أن يرى مشاريعه فقط)
            let finalAssignments = assignments;
            if (user.role === 'project_manager') {
                const pmProjectIds = projectsData
                    ?.filter(p => p.manager_name && p.manager_name.toLowerCase().includes(user.full_name.toLowerCase()))
                    .map(p => p.id) || [];
                finalAssignments = assignments.filter(a => pmProjectIds.includes(a.project_id));
            }

            // 7. دمج البيانات برمجياً
            const formattedTasks: Task[] = finalAssignments.map(a => {
                const proj = projectsData?.find(p => p.id === a.project_id);
                const tech = profilesData?.find(pr => pr.id === a.tech_id);
                
                // حساب نسبة إنجاز المشروع
                const projAssignments = allAssignmentsData?.filter(ta => ta.project_id === a.project_id) || [];
                const total = projAssignments.length;
                const completed = projAssignments.filter(ta => ta.status === 'Completed').length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                return {
                    assignment_id: a.id,
                    project_id: proj?.id || '',
                    title: isRTL ? `مهمة: ${proj?.title || 'بدون عنوان'}` : `Task: ${proj?.title || 'Untitled'}`,
                    project_name: proj?.title || 'Unknown',
                    location: proj?.location_name || 'N/A',
                    dueDate: proj?.end_date || 'N/A',
                    currentSystemProgress: progress,
                    assigned_tech_name: tech?.full_name || 'Unknown Tech',
                    manager_name: proj?.manager_name || 'N/A',
                    task_status: a.status as StatusType
                };
            });

            setTasks(formattedTasks);
            setFilteredTasks(formattedTasks);
        } else {
            setTasks([]);
            setFilteredTasks([]);
        }
      } catch (error: any) {
        console.error("Error fetching field data:", error.message || error);
      } finally {
        setLoading(false);
      }
    };
    fetchFieldData();
  }, [user, isRTL]);

  // Search Logic
  useEffect(() => {
      if (!searchQuery) {
          setFilteredTasks(tasks);
      } else {
          const lower = searchQuery.toLowerCase();
          setFilteredTasks(tasks.filter(t => 
              t.project_name.toLowerCase().includes(lower) || 
              t.assigned_tech_name.toLowerCase().includes(lower) ||
              t.location.toLowerCase().includes(lower)
          ));
      }
  }, [searchQuery, tasks]);

  // --- Handlers ---
  const handleAiValidation = () => {
    setIsAiAnalyzing(true);
    setAiInsight(null);
    
    setTimeout(() => {
      setIsAiAnalyzing(false);
      if ((status === 'Delayed' || status === 'Blocked') && !delayReason) {
        setAiInsight({
            type: 'warning',
            msg: isRTL ? 'تنبيه: يجب تحديد سبب التأخير/التوقف لإكمال التقرير.' : 'Alert: Delay/Block reason is mandatory.'
        });
      } else if (notes.length < 20 && status !== 'Completed') {
        setAiInsight({
            type: 'warning',
            msg: isRTL ? 'الملاحظات قصيرة جداً. يرجى إضافة تفاصيل فنية لضمان الامتثال.' : 'Notes are too brief. Please add technical details.'
        });
      } else if (status === 'Completed' && attachments.length === 0) {
        setAiInsight({
            type: 'warning',
            msg: isRTL ? 'تنبيه: إغلاق المهمة يتطلب إرفاق صورة واحدة على الأقل كدليل.' : 'Alert: Completing a task requires at least one photo evidence.'
        });
      } else {
        setAiInsight({
            type: 'success',
            msg: isRTL ? 'التقرير مكتمل ومتوافق مع المعايير. جاهز للإرسال.' : 'Report is complete and compliant. Ready to submit.'
        });
      }
    }, 1500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const processedFiles: File[] = [];
    for (const file of Array.from(e.target.files)) {
        if (file.type.startsWith('image/')) {
            try {
                const compressedBlob = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true });
                processedFiles.push(new File([compressedBlob], file.name, { type: file.type }));
            } catch { processedFiles.push(file); }
        } else processedFiles.push(file);
    }
    setAttachments(prev => [...prev, ...processedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const handleSubmitReport = async () => {
      if (!user || !activeTask) return;
      const currentTask = tasks.find(t => t.assignment_id === activeTask);
      if (!currentTask) return;

      if ((status === 'Delayed' || status === 'Blocked') && !delayReason) {
          alert(isRTL ? 'يرجى تحديد سبب التأخير' : 'Please select a delay reason');
          return;
      }

      setIsSubmitting(true);
      try {
          // 1. رفع المرفقات إذا وجدت
          const attachmentUrls: string[] = [];
          for (const file of attachments) {
              const fileName = `updates/${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
              const { error: uploadError } = await supabase.storage.from('tech-media').upload(fileName, file);
              if (uploadError) throw uploadError;
              const { data } = supabase.storage.from('tech-media').getPublicUrl(fileName);
              if (data.publicUrl) attachmentUrls.push(data.publicUrl);
          }

          // 2. إدخال التحديث في جدول task_updates
          const { error: updateError } = await supabase.from('task_updates').insert({
              user_id: user.id,
              project_id: currentTask.project_id,
              task_status: status,
              notes: notes,
              rejection_reason: delayReason || null, 
              photos_after: attachmentUrls 
          });
          if (updateError) throw updateError;

          // 3. تحديث حالة الفني في جدول task_assignments
          let assignStatus = status;
          if(status === 'Blocked') assignStatus = 'Delayed'; 
          
          await supabase.from('task_assignments')
              .update({ status: assignStatus, responded_at: new Date().toISOString() })
              .eq('id', activeTask);

          alert(isRTL ? 'تم رفع التحديث الميداني بنجاح!' : 'Field update submitted successfully!');
          
          // Reset
          setTasks(tasks.filter(t => t.assignment_id !== activeTask || (status !== 'Completed' && status !== 'Blocked')));
          setActiveTask(null);
          setStatus('In Progress');
          setNotes('');
          setDelayReason('');
          setAttachments([]);
          setAiInsight(null);

      } catch (error: any) {
          console.error(error);
          alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving report');
      } finally {
          setIsSubmitting(false);
      }
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'project_manager';

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${bgMain}`}><Loader2 className="animate-spin text-blue-500 w-12 h-12"/></div>;

  return (
    <div className={`min-h-screen font-sans pb-20 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Reporting Context Header --- */}
      <header className={`border-b px-6 py-5 sticky top-0 z-30 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
              <Activity className="text-blue-600" />
              {isAdmin 
                ? (isRTL ? 'سير العمل الميداني الحي' : 'Live Field Workflow')
                : (isRTL ? 'تحديث التنفيذ الميداني' : 'Field Execution Update')}
            </h1>
            <p className={`text-xs font-medium flex items-center gap-2 mt-2 ${textSub}`}>
              <span>{user?.full_name} ({user?.job_title || 'Supervisor'})</span>
              {!isAdmin && (
                  <>
                    <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${attendanceLocation ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50' : 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                        <MapPin size={10} /> {attendanceLocation ? (isRTL ? 'الموقع تم التحقق منه' : 'GPS Verified') : (isRTL ? 'غير مسجل حضور' : 'Not Checked In')}
                    </span>
                  </>
              )}
            </p>
          </div>
          
          {/* Admin Search */}
          {isAdmin && (
              <div className="relative w-full md:w-72">
                  <Search className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-slate-400 w-4 h-4`} />
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isRTL ? 'بحث بالاسم، المشروع، الموقع...' : 'Search name, project...'} 
                      className={`w-full rounded-xl px-4 py-2 text-sm outline-none transition border ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`} 
                  />
              </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        
        {filteredTasks.length === 0 ? (
            <div className={`text-center py-20 font-medium border-2 border-dashed rounded-[2rem] ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                <div className="flex justify-center mb-4"><CheckCircle2 size={48} className="text-emerald-500 opacity-50"/></div>
                {isAdmin 
                    ? (isRTL ? 'لا توجد عمليات تنفيذ نشطة في الميدان حالياً.' : 'No active field operations currently.')
                    : (isRTL ? 'لا توجد مهام نشطة حالياً تحتاج لتحديث. عمل رائع!' : 'All caught up! No active tasks require updating.')}
            </div>
        ) : (
        <div className="space-y-4">
          <h2 className={`text-xs font-bold uppercase tracking-wider px-1 flex items-center justify-between ${textSub}`}>
            {isAdmin ? (isRTL ? 'الفرق والمهام النشطة' : 'Active Teams & Tasks') : (isRTL ? 'المهام المسندة لك' : 'Your Assigned Tasks')}
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full">{filteredTasks.length}</span>
          </h2>
          
          {filteredTasks.map(task => (
            <div key={task.assignment_id} className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${cardBg} ${activeTask === task.assignment_id ? 'border-blue-400 ring-2 ring-blue-500/20' : ''}`}>
              
              {/* Task Summary Card (Clickable) */}
              <div 
                onClick={() => {
                    if(activeTask === task.assignment_id) setActiveTask(null);
                    else {
                        setActiveTask(task.assignment_id);
                        setStatus(task.task_status === 'Pending' ? 'In Progress' : task.task_status);
                        setAiInsight(null);
                        setNotes('');
                        setAttachments([]);
                    }
                }}
                className={`p-5 flex justify-between items-center cursor-pointer transition ${activeTask === task.assignment_id ? (isDark ? 'bg-slate-800/50 border-b border-slate-700' : 'bg-slate-50 border-b border-slate-100') : (isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50')}`}
              >
                <div className="flex items-center gap-4 w-full">
                    {/* 🚀 عرض أول حرف من اسم الفني للأدمن */}
                    {isAdmin ? (
                        <div className={`w-12 h-12 shrink-0 rounded-xl flex flex-col items-center justify-center font-black text-lg border-2 shadow-inner ${activeTask === task.assignment_id ? 'bg-blue-600 border-blue-500 text-white' : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-white text-slate-600'}`}>
                            {task.assigned_tech_name.charAt(0)}
                        </div>
                    ) : (
                        <div className={`p-3 shrink-0 rounded-xl flex flex-col items-center justify-center w-12 h-12 border ${activeTask === task.assignment_id ? 'bg-blue-600 border-blue-500 text-white shadow-md' : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-white text-slate-500'}`}>
                            <Briefcase size={20} />
                        </div>
                    )}
                    
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            {isAdmin && <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}><Users size={10}/> {task.assigned_tech_name}</span>}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{task.project_name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                task.task_status === 'Pending' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                task.task_status === 'Accepted' || task.task_status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' :
                                'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800'
                            }`}>{task.task_status}</span>
                        </div>
                        <h3 className={`font-bold text-lg leading-tight line-clamp-1 ${activeTask === task.assignment_id ? 'text-blue-500' : textMain}`}>{task.title}</h3>
                        <div className={`flex flex-wrap items-center gap-3 text-xs mt-1.5 ${textSub}`}>
                            <span className="flex items-center gap-1"><MapPin size={12}/> {task.location}</span>
                            <span className="flex items-center gap-1"><Calendar size={12}/> {task.dueDate}</span>
                        </div>
                    </div>
                </div>
                <div className="shrink-0 pl-2">
                    {activeTask === task.assignment_id ? <ChevronUp className="text-blue-500" /> : <ChevronDown className={textSub} />}
                </div>
              </div>

              {/* Extended Reporting Form */}
              <AnimatePresence>
              {activeTask === task.assignment_id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-6 space-y-8">
                  
                  {/* Section 1: System Calculated Progress (Read-Only) */}
                  <div className={`rounded-xl p-5 text-white flex items-center justify-between shadow-lg relative overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-slate-900'}`}>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Lock size={12} /> {isRTL ? 'إنجاز المشروع (نظامياً)' : 'Project Progress'}
                        </div>
                        <div className="text-3xl font-black">{task.currentSystemProgress}%</div>
                    </div>
                    <div className="h-16 w-16 relative z-10">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-700" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                strokeDasharray={175} strokeDashoffset={175 - (175 * task.currentSystemProgress) / 100}
                                className="text-emerald-400 transition-all duration-1000 ease-out" 
                            />
                        </svg>
                    </div>
                  </div>

                  {/* Section 2: Task Status Update */}
                  <div className="space-y-4">
                    <SectionLabel title={isAdmin ? (isRTL ? 'تحديث الإدارة أو تجاوز الحالة' : 'Admin Status Override') : (isRTL ? 'تحديث حالة المهمة' : 'Task Status Update')} isDark={isDark} />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <StatusButton label={isRTL ? 'قيد التنفيذ' : 'In Progress'} active={status === 'In Progress' || status === 'Pending' || status === 'Accepted'} onClick={() => setStatus('In Progress')} icon={Clock} color="blue" isDark={isDark} />
                        <StatusButton label={isRTL ? 'مكتمل' : 'Completed'} active={status === 'Completed'} onClick={() => setStatus('Completed')} icon={CheckCircle2} color="green" isDark={isDark} />
                        <StatusButton label={isRTL ? 'توقف' : 'Blocked'} active={status === 'Blocked'} onClick={() => setStatus('Blocked')} icon={X} color="red" isDark={isDark} />
                        <StatusButton label={isRTL ? 'تأخير' : 'Delayed'} active={status === 'Delayed'} onClick={() => setStatus('Delayed')} icon={AlertTriangle} color="amber" isDark={isDark} />
                    </div>

                    {/* Conditional Delay Reason */}
                    <AnimatePresence>
                    {(status === 'Delayed' || status === 'Blocked') && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-2">
                            <label className="text-xs font-bold text-red-500 mb-2 block">
                                {isRTL ? 'سبب التأخير / التوقف (إلزامي)*' : 'Reason for Delay/Blockage (Mandatory)*'}
                            </label>
                            <select 
                                className={`w-full rounded-xl px-4 py-3 outline-none transition font-medium ${isDark ? 'bg-red-900/20 border border-red-800/50 text-red-200 focus:border-red-500' : 'bg-red-50 border border-red-200 text-slate-700 focus:border-red-500'}`}
                                value={delayReason}
                                onChange={(e) => setDelayReason(e.target.value)}
                            >
                                <option value="">{isRTL ? '-- اختر السبب --' : '-- Select Reason --'}</option>
                                <option value="material">{isRTL ? 'نقص المواد أو المعدات' : 'Material Shortage'}</option>
                                <option value="access">{isRTL ? 'تعذر الوصول للموقع' : 'Site Access Issue'}</option>
                                <option value="weather">{isRTL ? 'أحوال جوية سيئة' : 'Weather Conditions'}</option>
                                <option value="approval">{isRTL ? 'بانتظار تصريح/موافقة' : 'Pending Approval'}</option>
                                <option value="manpower">{isRTL ? 'نقص العمالة' : 'Manpower Shortage'}</option>
                            </select>
                        </motion.div>
                    )}
                    </AnimatePresence>
                  </div>

                  {/* Section 3: Execution Notes */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <SectionLabel title={isRTL ? 'سجل التنفيذ والملاحظات' : 'Execution Log'} isDark={isDark} />
                        <button onClick={handleAiValidation} className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${isDark ? 'text-purple-400 bg-purple-900/20 hover:bg-purple-900/40' : 'text-purple-600 bg-purple-50 hover:bg-purple-100'}`}>
                            <Sparkles size={12}/> {isRTL ? 'تدقيق ذكي' : 'AI Audit'}
                        </button>
                    </div>
                    
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={`w-full p-4 rounded-xl text-sm outline-none focus:ring-2 transition h-32 resize-none leading-relaxed ${isDark ? 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20' : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/10'}`}
                        placeholder={isAdmin ? (isRTL ? '• ملاحظات الإدارة وتوجيهات التنفيذ:\n' : '• Admin notes and directives:\n') : (isRTL ? '• الأعمال المنجزة اليوم:\n• المشاكل التي واجهتها:\n• تفاصيل إضافية:' : '• Work performed:\n• Issues:\n• Details:')}
                    ></textarea>

                    {/* AI Feedback Area */}
                    <AnimatePresence>
                        {isAiAnalyzing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs text-purple-500 animate-pulse font-medium">
                                <Loader2 size={14} className="animate-spin"/> {isRTL ? 'جاري تحليل التقرير...' : 'Analyzing report...'}
                            </motion.div>
                        )}
                        {aiInsight && !isAiAnalyzing && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-3 rounded-xl flex items-start gap-3 border ${aiInsight.type === 'warning' ? (isDark ? 'bg-amber-900/20 border-amber-800 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-800') : (isDark ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-green-50 border-green-200 text-green-800')}`}>
                                {aiInsight.type === 'warning' ? <AlertTriangle size={18} className="shrink-0 mt-0.5"/> : <Check size={18} className="shrink-0 mt-0.5"/>}
                                <p className="text-xs font-bold leading-relaxed">{aiInsight.msg}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  {/* Section 4: Evidence & Attachments */}
                  <div className="space-y-4">
                    <SectionLabel title={isRTL ? 'الأدلة والمرفقات' : 'Evidence & Attachments'} isDark={isDark} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition group ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-400' : 'bg-slate-50 border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-600'}`}>
                            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,.pdf" onChange={handleFileChange} />
                            <Camera size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold">{isRTL ? 'إرفاق ملف/صورة' : 'Attach File'}</span>
                        </button>
                        
                        {/* Attachments List */}
                        {attachments.map((file, idx) => (
                            <div key={idx} className={`aspect-square relative rounded-xl flex flex-col items-center justify-center animate-in zoom-in border ${isDark ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                <FileText size={24} />
                                <span className="text-[9px] mt-2 px-2 truncate w-full text-center font-bold" dir="ltr">{file.name}</span>
                                <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className={`absolute top-1 right-1 p-1 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 shadow-sm'}`}><X size={12}/></button>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className={`flex gap-3 pt-6 border-t mt-8 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button onClick={() => setActiveTask(null)} disabled={isSubmitting} className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button onClick={handleSubmitReport} disabled={isSubmitting || isAiAnalyzing} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />} 
                        {isSubmitting ? (isRTL ? 'جاري الإرسال...' : 'Submitting...') : (isAdmin ? (isRTL ? 'تحديث بالنيابة' : 'Update on behalf') : (isRTL ? 'إرسال التحديث' : 'Submit Update'))}
                    </button>
                  </div>

                </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        )}

      </main>
    </div>
  );
}

// --- Sub Components ---

function SectionLabel({ title, isDark }: { title: string, isDark: boolean }) {
    return (
        <h4 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {title} <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
        </h4>
    );
}

interface StatusBtnProps { label: string; active: boolean; onClick: () => void; icon: any; color: 'blue' | 'green' | 'red' | 'amber'; isDark: boolean }
function StatusButton({ label, active, onClick, icon: Icon, color, isDark }: StatusBtnProps) {
    const colors = {
        blue: isDark ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-blue-50 border-blue-500 text-blue-700',
        green: isDark ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700',
        red: isDark ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-red-50 border-red-500 text-red-700',
        amber: isDark ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-amber-50 border-amber-500 text-amber-700',
    };
    return (
        <button 
            onClick={onClick}
            className={`py-3 px-2 rounded-2xl text-[11px] font-bold border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                active ? colors[color] : (isDark ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50')
            }`}
        >
            <Icon size={20} className={active ? '' : 'opacity-50'}/>
            {label}
        </button>
    );
}
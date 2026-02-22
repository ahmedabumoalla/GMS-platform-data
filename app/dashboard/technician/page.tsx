'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Camera, CheckCircle2, X, Fingerprint, Receipt, Box, Briefcase, Send,
  Moon, Sun, Loader2, Wallet, Globe,
  ChevronDown, AlertTriangle, LogOut, Bell, FileText, MapPin, Clock, AlignLeft, ArrowLeft, ArrowRight, UserCheck, Activity, MessageCircleQuestion, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';

type Project = { id: string; name: string };
// 🚀 إضافة 'manpower' لطلبات الفنيين
type RequestType = 'work_update' | 'material' | 'custody' | 'expense' | 'other' | 'task_history' | 'manpower';
type Language = 'ar' | 'en' | 'ur' | 'hi' | 'bn' | 'ne';

interface AssignedTask {
  assignment_id: string; 
  project_id: string;
  title: string;
  category: string;
  start_date: string;
  location_name: string;
  manager_name: string;
  task_description: string;
  task_requirements: string;
  work_shift: string;
  tech_status: 'Pending' | 'Accepted' | 'Rejected' | 'Clarification' | 'Completed';
  clarification_note?: string;
}

export default function TechnicianDashboard() {
  const router = useRouter();

  const t = {
    ar: { 
        welcome: 'مرحباً', role: 'فني', checkIn: 'تسجيل دخول', checkOut: 'تسجيل خروج', statusOn: 'متواجد', statusOff: 'غير مسجل', wallet: 'رصيد العهدة', services: 'الخدمات السريعة', send: 'إرسال الطلب', selectProject: 'اختر المشروع', 
        menu: { work: 'صور العمل', mat: 'طلب مواد', cus: 'عهدة', exp: 'مصروفات', manpower: 'طلب فنيين', other: 'طلبات أخرى' }, 
        otherOpts: { title: 'نوع الطلب', select: '-- اختر --', sick: 'إجازة مرضية', annual: 'إجازة سنوية', trip: 'رحلة عمل', end: 'إنهاء عقد' }, 
        tasks: { title: 'المهام المسندة', empty: 'لا توجد مهام جديدة.', accept: 'قبول', reject: 'رفض', clarify: 'طلب توضيح', desc: 'الوصف', req: 'المتطلبات', shift: 'فترة العمل', manager: 'المشرف', sendNote: 'إرسال للمشرف', notePlaceholder: 'اكتب سبب الرفض أو الاستفسار هنا...', relatedRequests: 'طلبات مرتبطة بهذه المهمة' }, 
        history: { title: 'سجل المهمات', total: 'الكل', active: 'نشطة', completed: 'مكتملة', rejected: 'مرفوضة', details: 'التفاصيل', noHistory: 'لا يوجد سجل مهام.', back: 'عودة للقائمة' } 
    },
    en: { 
        welcome: 'Hello', role: 'Technician', checkIn: 'Check In', checkOut: 'Check Out', statusOn: 'Online', statusOff: 'Offline', wallet: 'Wallet Balance', services: 'Quick Services', send: 'Submit', selectProject: 'Select Project', 
        menu: { work: 'Work Update', mat: 'Materials', cus: 'Custody', exp: 'Expenses', manpower: 'Manpower', other: 'Other Requests' }, 
        otherOpts: { title: 'Request Type', select: '-- Select --', sick: 'Sick Leave', annual: 'Annual Leave', trip: 'Business Trip', end: 'Termination' }, 
        tasks: { title: 'Assigned Tasks', empty: 'No new tasks.', accept: 'Accept', reject: 'Reject', clarify: 'Clarify', desc: 'Description', req: 'Requirements', shift: 'Shift', manager: 'Manager', sendNote: 'Send to Manager', notePlaceholder: 'Type reason or question here...', relatedRequests: 'Requests related to this task' }, 
        history: { title: 'Task History', total: 'Total', active: 'Active', completed: 'Completed', rejected: 'Rejected', details: 'Details', noHistory: 'No task history.', back: 'Back to List' } 
    }
  };

  const [lang, setLang] = useState<Language>('ar');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [userName, setUserName] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentAttendanceId, setCurrentAttendanceId] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0.00);
  
  const [myTasks, setMyTasks] = useState<AssignedTask[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [processingTask, setProcessingTask] = useState<string | null>(null);
  
  // 🚀 Task Details States
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<AssignedTask | null>(null);
  const [clarificationText, setClarificationText] = useState('');
  const [showClarifyInput, setShowClarifyInput] = useState<'Rejected' | 'Clarification' | null>(null);

  const [activeModal, setActiveModal] = useState<RequestType | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [taskStatus, setTaskStatus] = useState<'completed' | 'in_progress' | 'rejected'>('in_progress');
  const [photosBefore, setPhotosBefore] = useState<File[]>([]);
  const [photosAfter, setPhotosAfter] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({ notes: '', amount: '', reason: '', urgency: 'medium', subType: '', startDate: '', endDate: '', materialQty: '', manpowerRole: '', manpowerCount: '' });
  const [fileAttachment, setFileAttachment] = useState<File | null>(null);
  
  const [isDark, setIsDark] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const isRTL = lang === 'ar' || lang === 'ur';
  const c = t[lang as 'ar'|'en'] || t.en;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const hour = new Date().getHours();
    setIsDark(hour >= 18 || hour < 6);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profileData && profileData.full_name) setUserName(profileData.full_name);

      const { data: projData } = await supabase.from('projects').select('id, title').eq('status', 'Active');
      if (projData) setProjects(projData.map(p => ({ id: p.id, name: p.title })));

      const { data: walletData } = await supabase.from('user_wallets').select('balance').eq('user_id', user.id).single();
      if (walletData) setWalletBalance(walletData.balance);

      const { data: attendData } = await supabase.from('attendance').select('id, check_in_time').eq('user_id', user.id).is('check_out_time', null).single();
      if (attendData) {
        setCheckedIn(true);
        setCurrentAttendanceId(attendData.id);
        setCheckInTime(new Date(attendData.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      }

      const { data: assignments, error } = await supabase
        .from('task_assignments')
        .select(`id, status, clarification_note, projects (id, title, category, start_date, location_name, manager_name, task_description, task_requirements, work_shift)`)
        .eq('tech_id', user.id)
        .order('assigned_at', { ascending: false });

      if (assignments) {
          const formattedTasks: AssignedTask[] = assignments.map((a: any) => ({
              assignment_id: a.id,
              project_id: a.projects.id,
              title: a.projects.title,
              category: a.projects.category,
              start_date: a.projects.start_date,
              location_name: a.projects.location_name,
              manager_name: a.projects.manager_name,
              task_description: a.projects.task_description,
              task_requirements: a.projects.task_requirements,
              work_shift: a.projects.work_shift,
              tech_status: a.status,
              clarification_note: a.clarification_note
          }));
          setMyTasks(formattedTasks);
      }
    };
    fetchData();
  }, []);

  // 🚀 تحديث حالة المهمة (مع ملاحظة التوضيح/الرفض)
  const handleTaskAction = async (assignmentId: string, action: 'Accepted' | 'Rejected' | 'Clarification') => {
      if ((action === 'Rejected' || action === 'Clarification') && !clarificationText.trim()) {
          alert(isRTL ? 'يرجى كتابة سبب الرفض أو الاستفسار أولاً' : 'Please provide a reason or question.');
          return;
      }

      setProcessingTask(assignmentId);
      try {
          const { error } = await supabase
            .from('task_assignments')
            .update({ 
                status: action,
                clarification_note: clarificationText || null,
                responded_at: new Date().toISOString()
            })
            .eq('id', assignmentId);

          if (error) throw error;

          setMyTasks(prev => prev.map(t => t.assignment_id === assignmentId ? { ...t, tech_status: action, clarification_note: clarificationText } : t));
          
          if(selectedHistoryTask && selectedHistoryTask.assignment_id === assignmentId) {
             setSelectedHistoryTask({...selectedHistoryTask, tech_status: action, clarification_note: clarificationText});
          }

          setShowClarifyInput(null);
          setClarificationText('');
          alert(isRTL ? `تم الإرسال للمشرف بنجاح` : `Sent to manager successfully`);
      } catch (error: any) {
          console.error(error);
          alert(error.message);
      } finally {
          setProcessingTask(null);
      }
  };

  // 🚀 دالة فتح طلب مرتبط بمهمة محددة
  const handleOpenRequestForTask = (type: RequestType, projectId: string) => {
      setSelectedProject(projectId); // تحديد المشروع تلقائياً
      setActiveModal(type); // فتح النافذة
  };

  const handleLogout = async () => {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push('/login');
  };

  const handleImageCompression = async (file: File) => {
    const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
    try { return await imageCompression(file, options); } catch (error) { return file; }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after' | 'single') => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = await handleImageCompression(e.target.files[0]);
      if (target === 'before') setPhotosBefore([...photosBefore, file]);
      else if (target === 'after') setPhotosAfter([...photosAfter, file]);
      else setFileAttachment(file);
      setUploading(false);
    }
  };

  const handleAttendance = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth Error');

      navigator.geolocation.getCurrentPosition(async (pos) => {
        if (!checkedIn) {
          const { data, error } = await supabase.from('attendance').insert({
            user_id: user.id, location_lat: pos.coords.latitude, location_long: pos.coords.longitude, status: 'on_site'
          }).select().single();
          if (error) throw error;
          setCurrentAttendanceId(data.id);
          setCheckedIn(true);
          setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        } else {
          if (!currentAttendanceId) return;
          const { error } = await supabase.from('attendance').update({
            check_out_time: new Date().toISOString(), status: 'completed'
          }).eq('id', currentAttendanceId);
          if (error) throw error;
          setCheckedIn(false);
          setCurrentAttendanceId(null);
          setCheckInTime(null);
        }
        setLoading(false);
      }, () => { alert('GPS Required'); setLoading(false); });
    } catch (error: any) { alert(error.message); setLoading(false); }
  };

  const handleUploadToStorage = async (file: File, folder: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('tech-media').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('tech-media').getPublicUrl(fileName);
    return data.publicUrl;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No User');

      if (activeModal === 'work_update') {
        const beforeUrls = await Promise.all(photosBefore.map(f => handleUploadToStorage(f, 'tasks/before')));
        const afterUrls = await Promise.all(photosAfter.map(f => handleUploadToStorage(f, 'tasks/after')));
        await supabase.from('task_updates').insert({
          user_id: user.id, project_id: selectedProject || null, task_status: taskStatus, rejection_reason: taskStatus === 'rejected' ? formData.reason : null, notes: formData.notes, photos_before: beforeUrls, photos_after: afterUrls
        });
      } else {
        let attachmentUrl = null;
        if (fileAttachment) attachmentUrl = await handleUploadToStorage(fileAttachment, 'requests');
        await supabase.from('technician_requests').insert({
          user_id: user.id, project_id: selectedProject || null, request_type: activeModal === 'other' ? formData.subType : activeModal, status: 'pending', amount: formData.amount ? parseFloat(formData.amount) : null, description: formData.notes || formData.reason, urgency: formData.urgency, start_date: formData.startDate || null, end_date: formData.endDate || null, attachment_url: attachmentUrl,
        });
      }
      alert('تم بنجاح / Success');
      closeModal();
    } catch (error: any) { alert(error.message); } 
    finally { setLoading(false); }
  };

  const closeModal = () => {
    setActiveModal(null);
    setPhotosBefore([]); setPhotosAfter([]); setFileAttachment(null);
    setSelectedProject('');
    setFormData({ notes: '', amount: '', reason: '', urgency: 'medium', subType: '', startDate: '', endDate: '', materialQty: '', manpowerRole: '', manpowerCount: '' });
  };

  const glassCard = isDark ? "bg-slate-900/40 backdrop-blur-md border border-white/10 text-white" : "bg-white/60 backdrop-blur-md border border-white/40 text-slate-900 shadow-sm";
  const glassInput = isDark ? "bg-slate-800/60 border-slate-600 text-white placeholder-slate-400 focus:bg-slate-800" : "bg-white/80 border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white";
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';

  const menuItems = [
    { id: 'work_update', title: c.menu.work, icon: Camera, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'material', title: c.menu.mat, icon: Box, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'custody', title: c.menu.cus, icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'expense', title: c.menu.exp, icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'manpower', title: c.menu.manpower, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'other', title: c.menu.other, icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  ];

  const unreadTasks = myTasks.filter(t => t.tech_status === 'Pending').length;
  const completedTasks = myTasks.filter(t => t.tech_status === 'Completed').length;
  const activeTasks = myTasks.filter(t => t.tech_status === 'Accepted').length;
  const rejectedTasks = myTasks.filter(t => t.tech_status === 'Rejected' || t.tech_status === 'Clarification').length;

  return (
    <div className={`min-h-screen font-sans pb-10 relative overflow-x-hidden transition-colors duration-500 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`fixed inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none z-0 ${isDark ? 'invert-0' : 'invert'}`}>
         <img src="/logo.png" alt="Watermark" className="w-[80%] max-w-[500px] object-contain" />
      </div>

      <header className="relative z-20 p-6 pb-28">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">{c.welcome}، {userName}</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.role}</p>
          </div>
          <div className="flex gap-2 relative">
            <div className="relative">
                <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`p-3 rounded-full backdrop-blur-md border transition relative ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white/60 border-slate-200 text-slate-700'}`}>
                    <Bell size={20} />
                    {unreadTasks > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white text-[8px] font-bold text-white items-center justify-center">{unreadTasks}</span>
                        </span>
                    )}
                </button>

                <AnimatePresence>
                    {isNotificationsOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full mt-3 w-[320px] rounded-3xl overflow-hidden shadow-2xl border z-50 ${isRTL ? 'left-0' : 'right-0'} ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className={`p-4 border-b font-bold text-sm flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                <span>{c.tasks.title}</span>
                                {unreadTasks > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{unreadTasks}</span>}
                            </div>
                            
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                                {myTasks.filter(t => t.tech_status === 'Pending').length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs">{c.tasks.empty}</div>
                                ) : (
                                    myTasks.filter(t => t.tech_status === 'Pending').map(task => (
                                        <div key={task.assignment_id} onClick={() => {setSelectedHistoryTask(task); setActiveModal('task_history'); setIsNotificationsOpen(false);}} className={`p-4 border-b transition-all cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 bg-blue-50/30 dark:bg-blue-900/10 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">{task.manager_name?.charAt(0) || 'M'}</div>
                                                <div className="text-[10px] font-bold text-slate-500">{c.tasks.manager}: <span className="text-slate-800 dark:text-slate-200">{task.manager_name || 'N/A'}</span></div>
                                            </div>
                                            <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 leading-tight mb-1">{task.title}</h4>
                                            <div className="flex items-center gap-2 text-xs mt-2 text-slate-500">
                                                <MapPin size={12}/> {task.location_name || 'N/A'}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button onClick={handleLogout} disabled={isLoggingOut} className={`p-3 rounded-full backdrop-blur-md border transition hover:bg-red-500 hover:text-white hover:border-red-500 ${isDark ? 'bg-white/10 border-white/10 text-red-400' : 'bg-white/60 border-slate-200 text-red-500'}`}>
                {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
            </button>
            <div className="relative">
                <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className={`p-3 rounded-full backdrop-blur-md border ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/60 border-slate-200'}`}><Globe size={20} /></button>
                {isLangMenuOpen && (
                    <div className={`absolute top-full mt-2 w-40 rounded-xl overflow-hidden shadow-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} z-50 ltr:right-0 rtl:left-0`}>
                        {[{code: 'ar', label: 'العربية'}, {code: 'en', label: 'English'}, {code: 'ur', label: 'اردو'}, {code: 'hi', label: 'हिंदी'}, {code: 'bn', label: 'বাংলা'}, {code: 'ne', label: 'नेपाली'}].map(l => (
                            <button key={l.code} onClick={() => { setLang(l.code as Language); setIsLangMenuOpen(false); }} className={`w-full p-3 text-start hover:bg-opacity-10 hover:bg-slate-500 ${lang===l.code ? 'font-bold text-blue-500' : ''}`}>{l.label}</button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => setIsDark(!isDark)} className={`p-3 rounded-full backdrop-blur-md border ${isDark ? 'bg-white/10 border-white/10' : 'bg-white/60 border-slate-200'}`}>
                {isDark ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
            </button>
          </div>
        </div>

        <div className={`relative overflow-hidden p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white shadow-lg'} backdrop-blur-xl`}>
            {checkedIn && <div className="absolute top-0 right-0 p-3"><span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span></div>}
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <div className={`text-xs font-bold mb-1 ${checkedIn ? 'text-emerald-500' : 'text-slate-400'}`}>{checkedIn ? c.statusOn : c.statusOff}</div>
                    <div className="text-3xl font-black font-mono tracking-tight flex items-center gap-2">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    {checkedIn && checkInTime && <div className="text-[10px] text-slate-400 mt-1">{checkInTime}</div>}
                </div>
                <button onClick={handleAttendance} disabled={loading} className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${checkedIn ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                    {loading ? <Loader2 className="animate-spin"/> : <Fingerprint size={32}/>}
                </button>
            </div>
        </div>
      </header>

      <main className="px-6 relative z-10 -mt-16 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-5 rounded-3xl flex items-center justify-between ${glassCard}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Wallet size={24}/></div>
                    <div>
                        <div className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.wallet}</div>
                        <div className="text-xl font-black font-mono">{walletBalance.toFixed(2)} <span className="text-xs">SAR</span></div>
                    </div>
                </div>
            </div>
            <div onClick={() => {setSelectedHistoryTask(null); setActiveModal('task_history');}} className={`p-5 rounded-3xl flex flex-col justify-center cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${glassCard}`}>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><Activity size={18}/></div>
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{c.history.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{c.history.details} {isRTL ? <ArrowLeft size={10} className="inline"/> : <ArrowRight size={10} className="inline"/>}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <div className="text-center"><div className="text-lg font-black">{myTasks.length}</div><div className="text-[9px] text-slate-500 font-bold uppercase">{c.history.total}</div></div>
                    <div className="text-center"><div className="text-lg font-black text-blue-500">{activeTasks}</div><div className="text-[9px] text-slate-500 font-bold uppercase">{c.history.active}</div></div>
                    <div className="text-center"><div className="text-lg font-black text-emerald-500">{completedTasks}</div><div className="text-[9px] text-slate-500 font-bold uppercase">{c.history.completed}</div></div>
                    <div className="text-center"><div className="text-lg font-black text-red-500">{rejectedTasks}</div><div className="text-[9px] text-slate-500 font-bold uppercase">{c.history.rejected}</div></div>
                </div>
            </div>
        </div>

        <div>
            <h3 className={`font-bold mb-4 px-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{c.services}</h3>
            <div className="grid grid-cols-2 gap-4">
                {menuItems.map((item) => (
                    <button key={item.id} onClick={() => {setSelectedProject(''); setActiveModal(item.id as RequestType)}} className={`p-5 rounded-[2rem] flex flex-col items-start gap-4 transition-all active:scale-95 text-start group ${glassCard} hover:shadow-md`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-sm ${item.bg} ${item.color}`}><item.icon size={22}/></div>
                        <div className="font-bold text-sm mb-1">{item.title}</div>
                    </button>
                ))}
            </div>
        </div>
      </main>

      <AnimatePresence>
        {activeModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`w-full max-w-lg rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                    
                    <div className="flex justify-between items-center mb-6 sticky top-0 z-10">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {activeModal === 'task_history' && !selectedHistoryTask ? c.history.title : 
                             activeModal === 'task_history' && selectedHistoryTask ? selectedHistoryTask.title :
                             menuItems.find(m => m.id === activeModal)?.title}
                        </h3>
                        <button onClick={closeModal} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><X size={20}/></button>
                    </div>

                    {/* 🚀 نافذة السجل وتفاصيل المهمة الذكية */}
                    {activeModal === 'task_history' ? (
                        <>
                            {!selectedHistoryTask ? (
                                <div className="space-y-3">
                                    {myTasks.length === 0 ? (
                                        <div className="text-center p-10 text-slate-400 text-sm font-medium">{c.history.noHistory}</div>
                                    ) : (
                                        myTasks.map(task => (
                                            <div key={task.assignment_id} onClick={() => setSelectedHistoryTask(task)} className={`p-4 rounded-2xl border cursor-pointer transition hover:shadow-md hover:-translate-y-1 ${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50' : 'bg-slate-50 border-slate-200 hover:border-blue-400'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{task.title}</h4>
                                                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                                                        task.tech_status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        task.tech_status === 'Accepted' ? 'bg-blue-100 text-blue-700' :
                                                        task.tech_status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {task.tech_status === 'Clarification' ? 'Clarification' : task.tech_status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 space-y-1 mt-3">
                                                    <div className="flex items-center gap-2"><UserCheck size={12}/> {c.tasks.manager}: {task.manager_name || 'N/A'}</div>
                                                    <div className="flex items-center gap-2"><MapPin size={12}/> {task.location_name || 'N/A'}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                /* تفاصيل المهمة الواحدة */
                                <div className="space-y-6 animate-in slide-in-from-right">
                                    <button onClick={() => {setSelectedHistoryTask(null); setShowClarifyInput(null)}} className={`text-xs font-bold flex items-center gap-1 mb-4 hover:underline ${textSub}`}>
                                        {isRTL ? <ArrowRight size={14}/> : <ArrowLeft size={14}/>} {c.history.back}
                                    </button>

                                    {/* معلومات المدير */}
                                    <div className={`p-4 rounded-2xl flex items-center gap-3 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{selectedHistoryTask.manager_name?.charAt(0) || 'M'}</div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500">{c.tasks.manager}</div>
                                            <div className={`font-bold text-sm ${textMain}`}>{selectedHistoryTask.manager_name || 'N/A'}</div>
                                        </div>
                                    </div>

                                    {/* التوجيهات */}
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 text-sm">
                                            <AlignLeft className="text-blue-500 shrink-0 mt-0.5" size={18}/>
                                            <div><strong className={`block text-xs mb-1 ${textSub}`}>{c.tasks.desc}</strong><p className={`${textMain} leading-relaxed`}>{selectedHistoryTask.task_description || 'لا يوجد وصف'}</p></div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <FileText className="text-purple-500 shrink-0 mt-0.5" size={18}/>
                                            <div><strong className={`block text-xs mb-1 ${textSub}`}>{c.tasks.req}</strong><p className={`${textMain} leading-relaxed`}>{selectedHistoryTask.task_requirements || 'لا توجد متطلبات'}</p></div>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm">
                                            <Clock className="text-amber-500 shrink-0 mt-0.5" size={18}/>
                                            <div><strong className={`block text-xs mb-1 ${textSub}`}>{c.tasks.shift}</strong><p className={`${textMain} leading-relaxed`}>{selectedHistoryTask.work_shift || 'غير محدد'}</p></div>
                                        </div>
                                    </div>

                                    {/* أزرار الإجراء للمهمة المعلقة */}
                                    {selectedHistoryTask.tech_status === 'Pending' && (
                                        <div className={`p-4 rounded-2xl border mt-6 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                            {!showClarifyInput ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleTaskAction(selectedHistoryTask.assignment_id, 'Accepted')} disabled={processingTask === selectedHistoryTask.assignment_id} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2">
                                                        {processingTask === selectedHistoryTask.assignment_id ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} {c.tasks.accept}
                                                    </button>
                                                    <button onClick={() => setShowClarifyInput('Rejected')} className="px-4 py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-sm font-bold transition">
                                                        {c.tasks.reject}
                                                    </button>
                                                    <button onClick={() => setShowClarifyInput('Clarification')} className="px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl text-sm font-bold transition">
                                                        <MessageCircleQuestion size={20}/>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 animate-in fade-in">
                                                    <label className="text-xs font-bold text-slate-500">{showClarifyInput === 'Rejected' ? 'سبب الرفض' : 'الاستفسار'}</label>
                                                    <textarea autoFocus value={clarificationText} onChange={e => setClarificationText(e.target.value)} rows={3} className={`w-full p-4 rounded-xl outline-none border resize-none ${glassInput}`} placeholder={c.tasks.notePlaceholder} />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleTaskAction(selectedHistoryTask.assignment_id, showClarifyInput)} disabled={processingTask === selectedHistoryTask.assignment_id} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition flex justify-center items-center gap-2">
                                                            {processingTask === selectedHistoryTask.assignment_id ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>} {c.tasks.sendNote}
                                                        </button>
                                                        <button onClick={() => setShowClarifyInput(null)} className={`px-6 py-3 rounded-xl text-sm font-bold transition border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600'}`}>إلغاء</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* أزرار الطلبات للمهمة المقبولة */}
                                    {selectedHistoryTask.tech_status === 'Accepted' && (
                                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                                            <h4 className={`text-sm font-bold mb-4 ${textMain}`}>{c.tasks.relatedRequests}</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => handleOpenRequestForTask('material', selectedHistoryTask.project_id)} className={`p-4 rounded-xl flex items-center gap-3 font-bold text-xs transition border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                                                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600"><Box size={16}/></div> {c.menu.mat}
                                                </button>
                                                <button onClick={() => handleOpenRequestForTask('custody', selectedHistoryTask.project_id)} className={`p-4 rounded-xl flex items-center gap-3 font-bold text-xs transition border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                                                    <div className="p-2 rounded-lg bg-amber-100 text-amber-600"><Briefcase size={16}/></div> {c.menu.cus}
                                                </button>
                                                <button onClick={() => handleOpenRequestForTask('manpower', selectedHistoryTask.project_id)} className={`col-span-2 p-4 rounded-xl flex items-center gap-3 font-bold text-xs transition border ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                                                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600"><Users size={16}/></div> {c.menu.manpower} (طلب دعم فنيين/عمال)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                    /* 🚀 نافذة الطلبات الاعتيادية */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {activeModal !== 'other' && (
                            <div className="space-y-2">
                                <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.selectProject}</label>
                                <div className="relative">
                                    <select required className={`w-full p-4 rounded-2xl outline-none border appearance-none ${glassInput}`} value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                                        <option value="">--</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-4 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} size={18}/>
                                </div>
                            </div>
                        )}

                        {activeModal === 'other' && (
                            <>
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.otherOpts.title}</label>
                                    <select required className={`w-full p-4 rounded-2xl outline-none border ${glassInput}`} onChange={e => setFormData({...formData, subType: e.target.value})}>
                                        <option value="">{c.otherOpts.select}</option>
                                        <option value="sick_leave">{c.otherOpts.sick}</option>
                                        <option value="annual_leave">{c.otherOpts.annual}</option>
                                        <option value="business_trip">{c.otherOpts.trip}</option>
                                        <option value="termination">{c.otherOpts.end}</option>
                                    </select>
                                </div>
                                {(formData.subType === 'sick_leave' || formData.subType === 'annual_leave') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-xs">من</label><input required type="date" className={`w-full p-4 rounded-2xl border ${glassInput}`} onChange={e => setFormData({...formData, startDate: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-xs">إلى</label><input required type="date" className={`w-full p-4 rounded-2xl border ${glassInput}`} onChange={e => setFormData({...formData, endDate: e.target.value})} /></div>
                                    </div>
                                )}
                                <textarea required rows={3} onChange={e => setFormData({...formData, reason: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border resize-none ${glassInput}`} placeholder="التفاصيل / السبب..." />
                            </>
                        )}

                        {activeModal === 'work_update' && (
                            <>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{id: 'in_progress', l: 'جاري'}, {id: 'completed', l: 'تم'}, {id: 'rejected', l: 'رفض'}].map(s => (
                                        <button key={s.id} type="button" onClick={() => setTaskStatus(s.id as any)} className={`py-3 text-xs font-bold rounded-xl border ${taskStatus === s.id ? 'bg-blue-500 text-white' : glassInput}`}>{s.l}</button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {['before', 'after'].map((t) => (
                                        <label key={t} className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer ${glassInput}`}>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, t as any)} />
                                            <Camera size={24}/>
                                            <span className="text-[10px] mt-2 font-bold">{t==='before' ? 'قبل' : 'بعد'}</span>
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}

                        {(activeModal === 'material' || activeModal === 'custody' || activeModal === 'expense') && (
                            <>
                                <input required type="text" onChange={e => setFormData({...formData, notes: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border ${glassInput}`} placeholder={activeModal === 'material' ? "اسم المادة المطلوبة..." : "الوصف..."} />
                                {activeModal === 'material' && <input required type="number" placeholder="الكمية المطلوبة..." className={`w-full p-4 rounded-2xl outline-none border ${glassInput}`} onChange={e => setFormData({...formData, materialQty: e.target.value})}/>}
                                {(activeModal === 'expense' || activeModal === 'custody') && <input required type="number" placeholder="المبلغ (إن وجد)" className={`w-full p-4 rounded-2xl outline-none border ${glassInput}`} onChange={e => setFormData({...formData, amount: e.target.value})}/>}
                                <label className={`w-full h-20 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer ${glassInput}`}>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileChange(e, 'single')} />
                                    <span className="text-xs font-bold flex gap-2"><Camera size={16}/> إرفاق صورة/تسعيرة (اختياري)</span>
                                </label>
                            </>
                        )}

                        {activeModal === 'manpower' && (
                            <>
                                <input required type="text" onChange={e => setFormData({...formData, manpowerRole: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border ${glassInput}`} placeholder="التخصص المطلوب (مثال: كهربائي مساعد)..." />
                                <input required type="number" placeholder="العدد المطلوب..." className={`w-full p-4 rounded-2xl outline-none border ${glassInput}`} onChange={e => setFormData({...formData, manpowerCount: e.target.value})}/>
                                <textarea required rows={3} onChange={e => setFormData({...formData, notes: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border resize-none ${glassInput}`} placeholder="سبب الاحتياج والمبررات..." />
                            </>
                        )}

                        <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin"/> : <Send size={20}/>} 
                            {c.send}
                        </button>
                    </form>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
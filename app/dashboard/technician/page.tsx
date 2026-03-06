'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Camera, CheckCircle2, X, Fingerprint, Receipt, Box, Briefcase, Send,
  Moon, Sun, Loader2, Wallet, Globe, MapPin, Clock, ArrowRight, ArrowLeft, 
  Users, AlertTriangle, LogOut, ChevronRight, FileText, CheckSquare, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { useDashboard } from '../layout'; 

type RequestType = 'work_update' | 'material' | 'custody' | 'expense' | 'manpower' | 'hr_request';
type Language = 'ar' | 'en';

interface AssignedTask {
  assignment_id: string; 
  project_id: string;
  title: string;
  category: string;
  location_name: string;
  manager_name: string;
  task_description: string;
  tech_status: 'Pending' | 'Accepted' | 'Rejected' | 'Clarification' | 'Completed' | 'In Progress';
}

export default function TechnicianDashboard() {
  const router = useRouter();
  const { lang, user, isDark, toggleTheme, toggleLang } = useDashboard();
  const isRTL = lang === 'ar';

  const t = {
    ar: { 
        welcome: 'مرحباً بك', role: 'فني ميداني', checkIn: 'تسجيل الدخول', checkOut: 'تسجيل الخروج', statusOn: 'متواجد في الموقع', statusOff: 'غير مسجل الدخول', wallet: 'رصيد العهدة',
        tasks: { active: 'مهام العمل الحالية', pending: 'مهام بانتظار القبول', empty: 'لا توجد مهام مسندة إليك حالياً.', accept: 'قبول ومباشرة', reject: 'رفض المهمة', complete: 'إنهاء المهمة' }, 
        actions: { title: 'إجراءات المهمة', work: 'تحديث حالة العمل (صور)', mat: 'طلب صرف مواد', cus: 'طلب عهدة مالية', exp: 'رفع مطالبة مصروفات', manpower: 'طلب دعم فنيين' }, 
        forms: { send: 'إرسال الطلب للمدير', cancel: 'إلغاء', notes: 'ملاحظات وتفاصيل...', amount: 'المبلغ المطلوب', qty: 'الكمية المطلوبة', before: 'صورة قبل العمل', after: 'صورة بعد العمل' },
        hr: 'طلبات شؤون الموظفين (إجازات، خطابات)'
    },
    en: { 
        welcome: 'Welcome', role: 'Field Technician', checkIn: 'Check In', checkOut: 'Check Out', statusOn: 'On Site', statusOff: 'Checked Out', wallet: 'Wallet Balance',
        tasks: { active: 'Active Tasks', pending: 'Pending Tasks', empty: 'No assigned tasks currently.', accept: 'Accept Task', reject: 'Reject Task', complete: 'Complete Task' }, 
        actions: { title: 'Task Actions', work: 'Work Update (Photos)', mat: 'Request Materials', cus: 'Request Custody', exp: 'Expense Claim', manpower: 'Request Manpower' }, 
        forms: { send: 'Submit to Manager', cancel: 'Cancel', notes: 'Notes & details...', amount: 'Amount', qty: 'Quantity', before: 'Before Photo', after: 'After Photo' },
        hr: 'HR Requests (Leaves, Letters)'
    }
  };
  const c = t[lang as Language] || t.en;

  // --- States ---
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [userName, setUserName] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0.00);
  const [attendance, setAttendance] = useState<{ id: string | null, isCheckedIn: boolean, time: string | null }>({ id: null, isCheckedIn: false, time: null });
  
  const [myTasks, setMyTasks] = useState<AssignedTask[]>([]);
  
  // 🚀 حالة النافذة الذكية
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null);
  const [actionStep, setActionStep] = useState<'menu' | RequestType>('menu');
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  
  // 🚀 حالات النماذج
  const [formData, setFormData] = useState({ notes: '', amount: '', qty: '', role: '' });
  const [photosBefore, setPhotosBefore] = useState<File[]>([]);
  const [photosAfter, setPhotosAfter] = useState<File[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTechData = async () => {
      if (!user) return;
      setUserName(user.full_name || '');

      // Wallet
      const { data: walletData } = await supabase.from('user_wallets').select('balance').eq('user_id', user.id).single();
      if (walletData) setWalletBalance(walletData.balance);

      // Attendance
      const { data: attendData } = await supabase.from('attendance').select('id, check_in_time').eq('user_id', user.id).is('check_out_time', null).single();
      if (attendData) {
        setAttendance({ id: attendData.id, isCheckedIn: true, time: new Date(attendData.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
      }

      // Tasks
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select(`id, status, projects (id, title, category, location_name, manager_name, task_description)`)
        .eq('tech_id', user.id)
        .order('assigned_at', { ascending: false });

      if (assignments) {
          const tasks: AssignedTask[] = assignments.map((a: any) => ({
              assignment_id: a.id, project_id: a.projects.id, title: a.projects.title, category: a.projects.category,
              location_name: a.projects.location_name, manager_name: a.projects.manager_name, task_description: a.projects.task_description, tech_status: a.status
          }));
          setMyTasks(tasks);
      }
    };
    fetchTechData();
  }, [user]);

  // --- Actions ---
  const handleAttendance = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error('User not found');
      navigator.geolocation.getCurrentPosition(async (pos) => {
        if (!attendance.isCheckedIn) {
          const { data, error } = await supabase.from('attendance').insert({
            user_id: user.id, location_lat: pos.coords.latitude, location_long: pos.coords.longitude, status: 'on_site'
          }).select().single();
          if (error) throw error;
          setAttendance({ id: data.id, isCheckedIn: true, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
        } else {
          if (!attendance.id) return;
          const { error } = await supabase.from('attendance').update({ check_out_time: new Date().toISOString(), status: 'completed' }).eq('id', attendance.id);
          if (error) throw error;
          setAttendance({ id: null, isCheckedIn: false, time: null });
        }
        setLoading(false);
      }, () => { alert('يرجى تفعيل الموقع (GPS) لتسجيل الحضور.'); setLoading(false); }, { enableHighAccuracy: true });
    } catch (error: any) { alert(error.message); setLoading(false); }
  };

  const handleTaskStatusUpdate = async (assignmentId: string, newStatus: 'Accepted' | 'Rejected' | 'Completed') => {
      setLoading(true);
      try {
          const { error } = await supabase.from('task_assignments').update({ status: newStatus }).eq('id', assignmentId);
          if (error) throw error;
          setMyTasks(prev => prev.map(t => t.assignment_id === assignmentId ? { ...t, tech_status: newStatus } : t));
          alert('تم التحديث بنجاح');
      } catch (error: any) { alert(error.message); } finally { setLoading(false); }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after' | 'single') => {
      if (e.target.files && e.target.files[0]) {
        const file = await imageCompression(e.target.files[0], { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true });
        if (target === 'before') setPhotosBefore([...photosBefore, file]);
        else if (target === 'after') setPhotosAfter([...photosAfter, file]);
        else setAttachment(file);
      }
  };

  const uploadToSupabase = async (file: File, folder: string) => {
      if(!user) return null;
      const fileName = `${user.id}/${folder}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('tech-media').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('tech-media').getPublicUrl(fileName);
      return data.publicUrl;
  };

  const submitActionRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !selectedTask) return;
      setSubmitting(true);

      try {
          // 1. إذا كان التحديث "تحديث عمل (صور)"
          if (actionStep === 'work_update') {
              if (photosBefore.length === 0 && photosAfter.length === 0) throw new Error('يجب إرفاق صورة واحدة على الأقل.');
              const beforeUrls = await Promise.all(photosBefore.map(f => uploadToSupabase(f, 'tasks/before')));
              const afterUrls = await Promise.all(photosAfter.map(f => uploadToSupabase(f, 'tasks/after')));
              
              await supabase.from('task_updates').insert({
                  user_id: user.id, project_id: selectedTask.project_id, update_type: 'work_update', task_status: 'in_progress', notes: formData.notes, photos_before: beforeUrls, photos_after: afterUrls
              });
          } 
          // 2. باقي الطلبات (مواد، عهدة، الخ)
          else {
              let attUrl = attachment ? await uploadToSupabase(attachment, 'requests') : null;
              await supabase.from('technician_requests').insert({
                  user_id: user.id, project_id: selectedTask.project_id, request_type: actionStep, description: formData.notes, amount: formData.amount ? parseFloat(formData.amount) : null, attachment_url: attUrl
              });

              // دمجها في جدول task_updates ليراها المدير في نفس الشاشة
              await supabase.from('task_updates').insert({
                  user_id: user.id, project_id: selectedTask.project_id, update_type: actionStep, notes: formData.notes, amount: formData.amount ? parseFloat(formData.amount) : null, material_qty: formData.qty || null
              });
          }

          alert('تم إرسال التحديث للمدير بنجاح.');
          closeActionModal();
      } catch (error: any) { alert(error.message); } finally { setSubmitting(false); }
  };

  const closeActionModal = () => {
      setSelectedTask(null); setActionStep('menu');
      setFormData({ notes: '', amount: '', qty: '', role: '' });
      setPhotosBefore([]); setPhotosAfter([]); setAttachment(null);
  };

  const activeTasks = myTasks.filter(t => t.tech_status === 'Accepted' || t.tech_status === 'In Progress');
  const pendingTasks = myTasks.filter(t => t.tech_status === 'Pending');

  // --- UI Elements ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-100";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textMain = isDark ? "text-white" : "text-slate-900";

  return (
    <div className={`min-h-screen font-sans pb-10 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* 🚀 Header & User Info */}
      <header className="px-6 pt-10 pb-6 rounded-b-[2.5rem] bg-gradient-to-br from-blue-700 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Briefcase size={200}/></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-3xl font-black mb-1">{c.welcome}، {userName.split(' ')[0]}</h1>
            <p className="text-sm font-bold text-blue-200 flex items-center gap-1"><MapPin size={14}/> {c.role}</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="p-3 bg-white/10 hover:bg-red-500 rounded-2xl backdrop-blur-md transition"><LogOut size={20}/></button>
        </div>

        {/* Attendance Card */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[2rem] flex items-center justify-between">
            <div>
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{attendance.isCheckedIn ? c.statusOn : c.statusOff}</div>
                <div className="text-3xl font-black font-mono mt-1">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                {attendance.isCheckedIn && <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={14}/> مسجل من: {attendance.time}</div>}
            </div>
            <button onClick={handleAttendance} disabled={loading} className={`w-20 h-20 rounded-[1.5rem] flex flex-col items-center justify-center font-bold text-xs shadow-2xl transition active:scale-95 ${attendance.isCheckedIn ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {loading ? <Loader2 className="animate-spin mb-1"/> : <Fingerprint size={28} className="mb-1"/>}
                {attendance.isCheckedIn ? c.checkOut : c.checkIn}
            </button>
        </div>
      </header>

      <main className="px-6 mt-6 space-y-8">
        
        {/* 🚀 Pending Tasks (مهام تتطلب الموافقة) */}
        {pendingTasks.length > 0 && (
            <section>
                <h3 className={`text-sm font-black mb-4 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><AlertTriangle size={18} className="text-amber-500"/> {c.tasks.pending}</h3>
                <div className="space-y-4">
                    {pendingTasks.map(task => (
                        <div key={task.assignment_id} className={`p-5 rounded-[2rem] border shadow-sm ${cardBg}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className={`font-black text-lg ${textMain}`}>{task.title}</h4>
                                    <p className="text-xs font-bold text-blue-500 mt-1"><Users size={12} className="inline mr-1"/> مشرف: {task.manager_name}</p>
                                </div>
                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-xl text-[10px] font-bold animate-pulse">جديدة</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.task_description}</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleTaskStatusUpdate(task.assignment_id, 'Accepted')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"><CheckSquare size={16}/> {c.tasks.accept}</button>
                                <button onClick={() => handleTaskStatusUpdate(task.assignment_id, 'Rejected')} className="flex-1 py-3 bg-rose-100 text-rose-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95"><XCircle size={16}/> {c.tasks.reject}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* 🚀 Active Tasks (مشاريعي الحالية - جوهر العمل) */}
        <section>
            <h3 className={`text-sm font-black mb-4 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Briefcase size={18} className="text-blue-500"/> {c.tasks.active}</h3>
            {activeTasks.length === 0 ? (
                <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>{c.tasks.empty}</div>
            ) : (
                <div className="space-y-4">
                    {activeTasks.map(task => (
                        <div key={task.assignment_id} onClick={() => setSelectedTask(task)} className={`p-5 rounded-[2rem] border shadow-md cursor-pointer transition active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg flex items-center gap-1"><MapPin size={10}/> {task.location_name}</div>
                                <ArrowLeft size={16} className={`text-blue-500 ${isRTL ? '' : 'rotate-180'}`}/>
                            </div>
                            <h4 className={`font-black text-xl mb-1 ${textMain}`}>{task.title}</h4>
                            <div className="text-xs font-bold text-slate-500 line-clamp-1">{task.task_description}</div>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* 🚀 General HR Requests Button */}
        <section>
            <button onClick={() => setIsHrModalOpen(true)} className={`w-full p-5 rounded-[2rem] border flex items-center justify-between shadow-sm transition active:scale-95 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-purple-500' : 'bg-white border-slate-200 hover:border-purple-400'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center"><FileText size={24}/></div>
                    <div className="text-start">
                        <div className={`font-black text-sm ${textMain}`}>{c.hr}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1">رفع إجازة، طلب تعريف، إلخ.</div>
                    </div>
                </div>
                <ChevronRight size={20} className={`text-slate-400 ${isRTL ? 'rotate-180' : ''}`}/>
            </button>
        </section>

      </main>

      {/* --- 🚀 TASK ACTION MODAL (Bottom Sheet Style) --- */}
      <AnimatePresence>
        {selectedTask && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4">
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={`w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
                >
                    {/* المقبض (للموبايل) */}
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="text-[10px] font-bold text-blue-600 mb-1">{selectedTask.title}</div>
                            <h3 className={`text-xl font-black ${textMain}`}>
                                {actionStep === 'menu' ? c.actions.title : 
                                 actionStep === 'work_update' ? c.actions.work :
                                 actionStep === 'material' ? c.actions.mat :
                                 actionStep === 'custody' ? c.actions.cus :
                                 actionStep === 'manpower' ? c.actions.manpower : c.actions.exp}
                            </h3>
                        </div>
                        <button onClick={closeActionModal} className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500`}><X size={20}/></button>
                    </div>

                    {/* 1. قائمة الخيارات (تظهر أولاً) */}
                    {actionStep === 'menu' ? (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={()=>setActionStep('work_update')} className={`p-4 rounded-2xl border text-start transition active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <Camera size={24} className="text-blue-500 mb-3"/> <div className={`font-bold text-sm ${textMain}`}>{c.actions.work}</div>
                            </button>
                            <button onClick={()=>setActionStep('material')} className={`p-4 rounded-2xl border text-start transition active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <Box size={24} className="text-purple-500 mb-3"/> <div className={`font-bold text-sm ${textMain}`}>{c.actions.mat}</div>
                            </button>
                            <button onClick={()=>setActionStep('expense')} className={`p-4 rounded-2xl border text-start transition active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <Receipt size={24} className="text-emerald-500 mb-3"/> <div className={`font-bold text-sm ${textMain}`}>{c.actions.exp}</div>
                            </button>
                            <button onClick={()=>setActionStep('manpower')} className={`p-4 rounded-2xl border text-start transition active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <Users size={24} className="text-indigo-500 mb-3"/> <div className={`font-bold text-sm ${textMain}`}>{c.actions.manpower}</div>
                            </button>
                        </div>
                    ) : (
                    /* 2. النماذج الفرعية بناءً على الاختيار */
                    <form onSubmit={submitActionRequest} className="space-y-5">
                        
                        {/* نموذج تحديث العمل (صور) */}
                        {actionStep === 'work_update' && (
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${photosBefore.length > 0 ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUploadImage(e, 'before')} />
                                    {photosBefore.length > 0 ? <CheckCircle2 size={32}/> : <Camera size={32}/>}
                                    <span className="text-xs font-bold mt-2">{photosBefore.length > 0 ? 'تم الإرفاق' : c.forms.before}</span>
                                </label>
                                <label className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${photosAfter.length > 0 ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUploadImage(e, 'after')} />
                                    {photosAfter.length > 0 ? <CheckCircle2 size={32}/> : <Camera size={32}/>}
                                    <span className="text-xs font-bold mt-2">{photosAfter.length > 0 ? 'تم الإرفاق' : c.forms.after}</span>
                                </label>
                            </div>
                        )}

                        {/* حقول مشتركة للطلبات المالية أو المواد */}
                        {(actionStep === 'material' || actionStep === 'expense' || actionStep === 'custody') && (
                            <div className="space-y-4">
                                {actionStep === 'material' && <input required type="text" placeholder="اسم المادة والكمية بدقة..." className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} onChange={e => setFormData({...formData, qty: e.target.value})}/>}
                                {(actionStep === 'expense' || actionStep === 'custody') && <input required type="number" placeholder="المبلغ المطلوب (ريال)" className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} onChange={e => setFormData({...formData, amount: e.target.value})}/>}
                                
                                <label className={`w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition ${attachment ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleUploadImage(e, 'single')} />
                                    <span className="text-xs font-bold flex gap-2 items-center">{attachment ? <CheckCircle2 size={16}/> : <Camera size={16}/>} {attachment ? 'تم إرفاق التسعيرة/الفاتورة' : 'إرفاق صورة تسعيرة أو فاتورة (اختياري)'}</span>
                                </label>
                            </div>
                        )}

                        {/* طلب عمالة */}
                        {actionStep === 'manpower' && (
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="text" placeholder="التخصص (مثال: سباك)" className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} onChange={e => setFormData({...formData, role: e.target.value})}/>
                                <input required type="number" placeholder="العدد" className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} onChange={e => setFormData({...formData, qty: e.target.value})}/>
                            </div>
                        )}

                        {/* حقل الملاحظات المشترك */}
                        <textarea required rows={3} onChange={e => setFormData({...formData, notes: e.target.value})} className={`w-full p-4 rounded-xl outline-none border resize-none font-bold text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder={c.forms.notes} />

                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button type="button" onClick={()=>setActionStep('menu')} className={`flex-1 py-4 rounded-xl font-bold text-sm transition ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{c.forms.cancel}</button>
                            <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
                                {submitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} {c.forms.send}
                            </button>
                        </div>
                    </form>
                    )}

                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}
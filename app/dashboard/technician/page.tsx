'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Camera, CheckCircle2, X, Fingerprint, Receipt, Box, Briefcase, Send,
  Moon, Sun, Loader2, Wallet, Globe, MapPin, Clock, ArrowRight, ArrowLeft, 
  Users, AlertTriangle, LogOut, ChevronRight, FileText, CheckSquare, XCircle, CalendarDays, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { useDashboard } from '../layout'; 

type RequestType = 'work_update' | 'material' | 'custody' | 'expense' | 'manpower' | 'hr_request';
type Language = 'ar' | 'en' | 'ur' | 'hi' | 'bn' | 'ne';

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
  
  // 🚀 استدعاء كامل الدوال من الـ Layout
  const { lang, user, isDark, toggleTheme, toggleLang } = useDashboard();
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [localLang, setLocalLang] = useState<Language>(lang as Language);

  // تحديث اللغة محلياً إذا تغيرت من القائمة العائمة
  useEffect(() => {
    setLocalLang(lang as Language);
  }, [lang]);

  const isRTL = localLang === 'ar' || localLang === 'ur';

  // --- 🚀 القاموس الشامل (6 لغات) ---
  const t = {
    ar: { 
        welcome: 'مرحباً بك', role: 'فني ميداني', checkIn: 'تسجيل دخول (بدء الدوام)', checkOut: 'تسجيل خروج (إنهاء الدوام)', statusOn: 'نشط (يتم تتبع الموقع)', statusOff: 'غير مسجل الدخول', wallet: 'رصيد العهدة',
        tasks: { active: 'مهام العمل الحالية', pending: 'مهام بانتظار القبول', empty: 'لا توجد مهام مسندة إليك حالياً.', accept: 'قبول ومباشرة', reject: 'رفض المهمة', complete: 'إنهاء المهمة' }, 
        actions: { title: 'إجراءات المهمة', work: 'تحديث حالة العمل (صور)', mat: 'طلب صرف مواد', cus: 'طلب عهدة مالية', exp: 'رفع مطالبة مصروفات', manpower: 'طلب دعم فنيين', hr: 'شؤون الموظفين' }, 
        forms: { send: 'إرسال الطلب للمدير', cancel: 'إلغاء', notes: 'ملاحظات وتفاصيل...', amount: 'المبلغ المطلوب', qty: 'الكمية المطلوبة', role: 'التخصص المطلوب', before: 'صورة قبل العمل', after: 'صورة بعد العمل' },
        hr: { title: 'طلبات شؤون الموظفين', type: 'نوع الطلب', leave: 'طلب إجازة', letter: 'طلب خطاب/تعريف', from: 'من تاريخ', to: 'إلى تاريخ' }
    },
    en: { 
        welcome: 'Welcome', role: 'Field Technician', checkIn: 'Check In', checkOut: 'Check Out', statusOn: 'Active (GPS Tracking)', statusOff: 'Checked Out', wallet: 'Wallet Balance',
        tasks: { active: 'Active Tasks', pending: 'Pending Tasks', empty: 'No assigned tasks currently.', accept: 'Accept Task', reject: 'Reject Task', complete: 'Complete Task' }, 
        actions: { title: 'Task Actions', work: 'Work Update (Photos)', mat: 'Request Materials', cus: 'Request Custody', exp: 'Expense Claim', manpower: 'Request Manpower', hr: 'HR Requests' }, 
        forms: { send: 'Submit to Manager', cancel: 'Cancel', notes: 'Notes & details...', amount: 'Amount', qty: 'Quantity', role: 'Required Role', before: 'Before Photo', after: 'After Photo' },
        hr: { title: 'HR Requests', type: 'Request Type', leave: 'Leave Request', letter: 'Official Letter', from: 'From', to: 'To' }
    },
    ur: { 
        welcome: 'خوش آمدید', role: 'فیلڈ ٹیکنیشن', checkIn: 'چیک ان کریں', checkOut: 'چیک آؤٹ کریں', statusOn: 'سائٹ پر (GPS Active)', statusOff: 'آف لائن', wallet: 'والیٹ بیلنس',
        tasks: { active: 'فعال کام', pending: 'زیر التوا کام', empty: 'اس وقت کوئی کام تفویض نہیں کیا گیا۔', accept: 'قبول کریں', reject: 'مسترد کریں', complete: 'مکمل کریں' }, 
        actions: { title: 'ٹاسک ایکشنز', work: 'کام کی تازہ کاری (تصاویر)', mat: 'مواد کی درخواست کریں', cus: 'حراست کی درخواست کریں', exp: 'اخراجات کا دعویٰ', manpower: 'افرادی قوت کی درخواست کریں', hr: 'ایچ آر کی درخواستیں' }, 
        forms: { send: 'مینیجر کو بھیجیں', cancel: 'منسوخ کریں', notes: 'تفصیلات لکھیں...', amount: 'رقم', qty: 'مقدار', role: 'مطلوبہ کردار', before: 'کام سے پہلے کی تصویر', after: 'کام کے بعد کی تصویر' },
        hr: { title: 'ایچ آر کی درخواستیں', type: 'درخواست کی قسم', leave: 'چھٹی کی درخواست', letter: 'سرکاری خط', from: 'سے', to: 'تک' }
    },
    hi: { 
        welcome: 'स्वागत है', role: 'फील्ड तकनीशियन', checkIn: 'चेक इन करें', checkOut: 'चेक आउट करें', statusOn: 'सक्रिय (GPS Tracking)', statusOff: 'ऑफ़लाइन', wallet: 'बटुआ शेष',
        tasks: { active: 'सक्रिय कार्य', pending: 'लंबित कार्य', empty: 'वर्तमान में कोई कार्य नहीं है।', accept: 'स्वीकार करें', reject: 'अस्वीकार करें', complete: 'पूर्ण करें' }, 
        actions: { title: 'कार्य क्रियाएं', work: 'कार्य अद्यतन (तस्वीरें)', mat: 'सामग्री का अनुरोध करें', cus: 'हिरासत का अनुरोध करें', exp: 'व्यय का दावा', manpower: 'जनशक्ति का अनुरोध करें', hr: 'मानव संसाधन अनुरोध' }, 
        forms: { send: 'प्रबंधक को भेजें', cancel: 'रद्द करें', notes: 'विवरण...', amount: 'राशि', qty: 'मात्रा', role: 'आवश्यक भूमिका', before: 'कार्य से पहले की तस्वीर', after: 'कार्य के बाद की तस्वीर' },
        hr: { title: 'मानव संसाधन अनुरोध', type: 'अनुरोध का प्रकार', leave: 'छुट्टी का अनुरोध', letter: 'आधिकारिक पत्र', from: 'से', to: 'तक' }
    },
    bn: { 
        welcome: 'স্বাগতম', role: 'মাঠ পর্যায়ের প্রযুক্তিবিদ', checkIn: 'চেক ইন করুন', checkOut: 'চেক আউট করুন', statusOn: 'সক্রিয় (GPS Tracking)', statusOff: 'অফলাইন', wallet: 'মানিব্যাগ ব্যালেন্স',
        tasks: { active: 'সক্রিয় কাজ', pending: 'অপেক্ষমান কাজ', empty: 'বর্তমানে কোন কাজ নেই।', accept: 'গ্রহণ করুন', reject: 'প্রত্যাখ্যান করুন', complete: 'সম্পূর্ণ করুন' }, 
        actions: { title: 'কাজ কর্ম', work: 'কাজের আপডেট (ছবি)', mat: 'উপাদান অনুরোধ করুন', cus: 'হেফাজতের অনুরোধ করুন', exp: 'ব্যয় দাবি', manpower: 'জনশক্তি অনুরোধ করুন', hr: 'এইচআর অনুরোধ' }, 
        forms: { send: 'ম্যানেজারের কাছে পাঠান', cancel: 'বাতিল করুন', notes: 'বিস্তারিত...', amount: 'পরিমাণ', qty: 'পরিমাণ', role: 'প্রয়োজনীয় ভূমিকা', before: 'কাজের আগের ছবি', after: 'কাজের পরের ছবি' },
        hr: { title: 'এইচআর অনুরোধ', type: 'অনুরোধের ধরন', leave: 'ছুটির আবেদন', letter: 'অফিসিয়াল চিঠি', from: 'থেকে', to: 'পর্যন্ত' }
    },
    ne: { 
        welcome: 'स्वागत छ', role: 'फिल्ड टेक्निसियन', checkIn: 'चेक इन गर्नुहोस्', checkOut: 'चेक आउट गर्नुहोस्', statusOn: 'सक्रिय (GPS Tracking)', statusOff: 'अफलाइन', wallet: 'वालेट ब्यालेन्स',
        tasks: { active: 'सक्रिय कार्यहरू', pending: 'बाँकी कार्यहरू', empty: 'हाल कुनै कार्य तोकिएको छैन।', accept: 'स्वीकार गर्नुहोस्', reject: 'अस्वीकार गर्नुहोस्', complete: 'पूरा गर्नुहोस्' }, 
        actions: { title: 'कार्य कार्यहरू', work: 'कार्य अपडेट (फोटोहरू)', mat: 'सामाग्री अनुरोध गर्नुहोस्', cus: 'हिरासत अनुरोध गर्नुहोस्', exp: 'खर्च दावी', manpower: 'जनशक्ति अनुरोध गर्नुहोस्', hr: 'HR अनुरोधहरू' }, 
        forms: { send: 'प्रबन्धकलाई पठाउनुहोस्', cancel: 'रद्द गर्नुहोस्', notes: 'विवरणहरू...', amount: 'रकम', qty: 'मात्रा', role: 'आवश्यक भूमिका', before: 'काम अघिको फोटो', after: 'काम पछिको फोटो' },
        hr: { title: 'HR अनुरोधहरू', type: 'अनुरोध प्रकार', leave: 'बिदा अनुरोध', letter: 'आधिकारिक पत्र', from: 'देखि', to: 'सम्म' }
    }
  };
  const c = t[localLang];

  // --- States ---
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0.00);
  const [attendance, setAttendance] = useState<{ id: string | null, isCheckedIn: boolean, time: string | null }>({ id: null, isCheckedIn: false, time: null });
  
  const [myTasks, setMyTasks] = useState<AssignedTask[]>([]);
  
  // Action Modal States
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null);
  const [actionStep, setActionStep] = useState<'menu' | RequestType | null>(null);
  
  // Forms States
  const [formData, setFormData] = useState({ notes: '', amount: '', qty: '', role: '', hrType: 'leave', startDate: '', endDate: '' });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserProfile(user);

      const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (profileData && profileData.full_name) setUserName(profileData.full_name);

      const { data: walletData } = await supabase.from('user_wallets').select('balance').eq('user_id', user.id).single();
      if (walletData) setWalletBalance(walletData.balance);

      const { data: attendData } = await supabase.from('attendance').select('id, check_in_time').eq('user_id', user.id).is('check_out_time', null).single();
      if (attendData) {
        setAttendance({ id: attendData.id, isCheckedIn: true, time: new Date(attendData.check_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
      }

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
  }, []);

  // --- 🌍 LIVE GPS TRACKING ENGINE 🌍 ---
  useEffect(() => {
      let watchId: number;

      if (attendance.isCheckedIn && userProfile) {
          watchId = navigator.geolocation.watchPosition(
              async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  
                  await supabase.from('technician_locations').upsert({
                      user_id: userProfile.id,
                      lat: latitude,
                      lng: longitude,
                      last_update: new Date().toISOString(),
                      is_active: true,
                      current_task: selectedTask?.title || 'متاح في الميدان',
                      current_project_id: selectedTask?.project_id || null
                  }, { onConflict: 'user_id' });
              },
              (err) => console.error('GPS Error:', err),
              { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
          );
      }

      return () => {
          if (watchId) navigator.geolocation.clearWatch(watchId);
      };
  }, [attendance.isCheckedIn, userProfile, selectedTask]);


  // --- Actions ---
  const handleAttendance = async () => {
    setLoading(true);
    try {
      if (!userProfile) throw new Error('User not found');
      navigator.geolocation.getCurrentPosition(async (pos) => {
        if (!attendance.isCheckedIn) {
          const { data, error } = await supabase.from('attendance').insert({
            user_id: userProfile.id, location_lat: pos.coords.latitude, location_long: pos.coords.longitude, status: 'on_site'
          }).select().single();
          if (error) throw error;
          setAttendance({ id: data.id, isCheckedIn: true, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
        } else {
          if (!attendance.id) return;
          const { error } = await supabase.from('attendance').update({ check_out_time: new Date().toISOString(), status: 'completed' }).eq('id', attendance.id);
          if (error) throw error;
          
          await supabase.from('technician_locations').update({ is_active: false }).eq('user_id', userProfile.id);
          
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
          alert('Successfully Updated');
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
      if(!userProfile) return null;
      const fileName = `${userProfile.id}/${folder}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('tech-media').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('tech-media').getPublicUrl(fileName);
      return data.publicUrl;
  };

  const submitActionRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userProfile) return;
      setSubmitting(true);

      try {
          if (actionStep === 'work_update' && selectedTask) {
              if (photosBefore.length === 0 && photosAfter.length === 0) throw new Error('يجب إرفاق صورة واحدة على الأقل.');
              const beforeUrls = await Promise.all(photosBefore.map(f => uploadToSupabase(f, 'tasks/before')));
              const afterUrls = await Promise.all(photosAfter.map(f => uploadToSupabase(f, 'tasks/after')));
              
              await supabase.from('task_updates').insert({
                  user_id: userProfile.id, project_id: selectedTask.project_id, update_type: 'work_update', task_status: 'in_progress', notes: formData.notes, photos_before: beforeUrls, photos_after: afterUrls
              });
          } 
          else if (actionStep === 'hr_request') {
              let attUrl = attachment ? await uploadToSupabase(attachment, 'hr_docs') : null;
              await supabase.from('technician_requests').insert({
                  user_id: userProfile.id, project_id: null, request_type: formData.hrType === 'leave' ? 'hr_leave' : 'hr_letter',
                  description: formData.notes, start_date: formData.startDate || null, end_date: formData.endDate || null, attachment_url: attUrl
              });
          }
          else if (selectedTask) {
              let attUrl = attachment ? await uploadToSupabase(attachment, 'requests') : null;
              await supabase.from('technician_requests').insert({
                  user_id: userProfile.id, project_id: selectedTask.project_id, request_type: actionStep, description: formData.notes, amount: formData.amount ? parseFloat(formData.amount) : null, quantity: formData.qty || null, role_requested: formData.role || null, attachment_url: attUrl
              });
          }

          alert('تم الإرسال بنجاح!');
          closeActionModal();
      } catch (error: any) { alert(error.message); } finally { setSubmitting(false); }
  };

  const closeActionModal = () => {
      setSelectedTask(null); setActionStep(null);
      setFormData({ notes: '', amount: '', qty: '', role: '', hrType: 'leave', startDate: '', endDate: '' });
      setPhotosBefore([]); setPhotosAfter([]); setAttachment(null);
  };

  const activeTasks = myTasks.filter(t => t.tech_status === 'Accepted' || t.tech_status === 'In Progress');
  const pendingTasks = myTasks.filter(t => t.tech_status === 'Pending');

  // --- UI Elements ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-100";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const glassInput = isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900";

  const languages = [
      { code: 'ar', label: 'العربية' },
      { code: 'en', label: 'English' },
      { code: 'ur', label: 'اردو' },
      { code: 'hi', label: 'हिंदी' },
      { code: 'bn', label: 'বাংলা' },
      { code: 'ne', label: 'नेपाली' }
  ];

  return (
    <div className={`min-h-screen font-sans pb-10 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* 🚀 Floating Language Switcher */}
      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50`}>
          <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95">
              <Globe size={24}/>
          </button>
          <AnimatePresence>
              {isLangMenuOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`absolute bottom-16 ${isRTL ? 'left-0' : 'right-0'} mb-2 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border dark:border-slate-700 overflow-hidden`}>
                      {languages.map(l => (
                          <button key={l.code} onClick={() => { setLocalLang(l.code as Language); setIsLangMenuOpen(false); }} className={`w-full text-center px-4 py-3 text-sm font-bold transition-colors ${localLang === l.code ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                              {l.label}
                          </button>
                      ))}
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      {/* 🚀 Header & User Info */}
      <header className="px-6 pt-10 pb-6 rounded-b-[2.5rem] bg-gradient-to-br from-blue-700 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Briefcase size={200}/></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-3xl font-black mb-1">{c.welcome}، {userName.split(' ')[0]}</h1>
            <p className="text-sm font-bold text-blue-200 flex items-center gap-1"><MapPin size={14}/> {userProfile?.job_title || c.role}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md transition">
              {isDark ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="p-3 bg-white/10 hover:bg-red-500 rounded-2xl backdrop-blur-md transition"><LogOut size={20}/></button>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-[2rem] flex items-center justify-between">
            <div>
                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{attendance.isCheckedIn ? c.statusOn : c.statusOff}</div>
                <div className="text-3xl font-black font-mono mt-1">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                {attendance.isCheckedIn && <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle2 size={14}/> {attendance.time}</div>}
            </div>
            <button onClick={handleAttendance} disabled={loading} className={`w-20 h-20 rounded-[1.5rem] flex flex-col items-center justify-center font-bold text-xs shadow-2xl transition active:scale-95 ${attendance.isCheckedIn ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {loading ? <Loader2 className="animate-spin mb-1"/> : <Fingerprint size={28} className="mb-1"/>}
                <span className="text-center leading-tight mt-1">{attendance.isCheckedIn ? c.checkOut : c.checkIn}</span>
            </button>
        </div>
      </header>

      <main className="px-6 mt-6 space-y-8">
        
        {/* 🚀 Pending Tasks */}
        {pendingTasks.length > 0 && (
            <section>
                <h3 className={`text-sm font-black mb-4 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><AlertTriangle size={18} className="text-amber-500"/> {c.tasks.pending}</h3>
                <div className="space-y-4">
                    {pendingTasks.map(task => (
                        <div key={task.assignment_id} className={`p-5 rounded-[2rem] border shadow-sm ${cardBg}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className={`font-black text-lg ${textMain}`}>{task.title}</h4>
                                    <p className="text-xs font-bold text-blue-500 mt-1"><Users size={12} className="inline mr-1"/> {task.manager_name}</p>
                                </div>
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

        {/* 🚀 Active Tasks */}
        <section>
            <h3 className={`text-sm font-black mb-4 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Briefcase size={18} className="text-blue-500"/> {c.tasks.active}</h3>
            {activeTasks.length === 0 ? (
                <div className={`p-8 text-center rounded-[2rem] border border-dashed ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>{c.tasks.empty}</div>
            ) : (
                <div className="space-y-4">
                    {activeTasks.map(task => (
                        <div key={task.assignment_id} onClick={() => { setSelectedTask(task); setActionStep('menu'); }} className={`p-5 rounded-[2rem] border shadow-md cursor-pointer transition active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg flex items-center gap-1"><MapPin size={10}/> {task.location_name}</div>
                                <ArrowLeft size={16} className={`text-blue-500 ${isRTL ? '' : 'rotate-180'}`}/>
                            </div>
                            <h4 className={`font-black text-xl mb-1 ${textMain}`}>{task.title}</h4>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* 🚀 General HR Requests Button */}
        <section>
            <button onClick={() => setActionStep('hr_request')} className={`w-full p-5 rounded-[2rem] border flex items-center justify-between shadow-sm transition active:scale-95 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-purple-500' : 'bg-white border-slate-200 hover:border-purple-400'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center"><FileText size={24}/></div>
                    <div className="text-start">
                        <div className={`font-black text-sm ${textMain}`}>{c.actions.hr}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1">رفع إجازة، طلب تعريف، خطابات...</div>
                    </div>
                </div>
                <ChevronRight size={20} className={`text-slate-400 ${isRTL ? 'rotate-180' : ''}`}/>
            </button>
        </section>

      </main>

      {/* --- 🚀 SMART ACTION MODAL (Bottom Sheet) --- */}
      <AnimatePresence>
        {(actionStep !== null) && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4">
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={`w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
                >
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>

                    <div className="flex justify-between items-start mb-6 border-b pb-4 dark:border-slate-800">
                        <div>
                            {selectedTask && <div className="text-[10px] font-bold text-blue-600 mb-1">{selectedTask.title}</div>}
                            <h3 className={`text-xl font-black ${textMain}`}>
                                {actionStep === 'menu' ? c.actions.title : 
                                 actionStep === 'hr_request' ? c.hr.title :
                                 actionStep === 'work_update' ? c.actions.work :
                                 actionStep === 'material' ? c.actions.mat :
                                 actionStep === 'custody' ? c.actions.cus :
                                 actionStep === 'manpower' ? c.actions.manpower : c.actions.exp}
                            </h3>
                        </div>
                        <button onClick={closeActionModal} className={`p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500`}><X size={20}/></button>
                    </div>

                    {/* 1. Menu (Only if a task is selected) */}
                    {actionStep === 'menu' && selectedTask ? (
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
                    /* 2. Forms */
                    <form onSubmit={submitActionRequest} className="space-y-5">
                        
                        {/* Work Update (Photos) */}
                        {actionStep === 'work_update' && (
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${photosBefore.length > 0 ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {if(e.target.files && e.target.files[0]) setPhotosBefore([e.target.files[0]])}} />
                                    {photosBefore.length > 0 ? <CheckCircle2 size={32}/> : <Camera size={32}/>}
                                    <span className="text-xs font-bold mt-2">{photosBefore.length > 0 ? '✓' : c.forms.before}</span>
                                </label>
                                <label className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${photosAfter.length > 0 ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {if(e.target.files && e.target.files[0]) setPhotosAfter([e.target.files[0]])}} />
                                    {photosAfter.length > 0 ? <CheckCircle2 size={32}/> : <Camera size={32}/>}
                                    <span className="text-xs font-bold mt-2">{photosAfter.length > 0 ? '✓' : c.forms.after}</span>
                                </label>
                            </div>
                        )}

                        {/* Material, Expense, Custody */}
                        {(actionStep === 'material' || actionStep === 'expense' || actionStep === 'custody') && (
                            <div className="space-y-4">
                                {actionStep === 'material' && <input required type="text" placeholder={c.forms.qty} className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${glassInput}`} onChange={e => setFormData({...formData, qty: e.target.value})}/>}
                                {(actionStep === 'expense' || actionStep === 'custody') && <input required type="number" placeholder={c.forms.amount} className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${glassInput}`} onChange={e => setFormData({...formData, amount: e.target.value})}/>}
                                <label className={`w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition ${attachment ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {if(e.target.files && e.target.files[0]) setAttachment(e.target.files[0])}} />
                                    <span className="text-xs font-bold flex gap-2 items-center">{attachment ? <CheckCircle2 size={16}/> : <Camera size={16}/>} {attachment ? 'تم الإرفاق' : 'إرفاق صورة فاتورة (اختياري)'}</span>
                                </label>
                            </div>
                        )}

                        {/* Manpower */}
                        {actionStep === 'manpower' && (
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="text" placeholder={c.forms.role} className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${glassInput}`} onChange={e => setFormData({...formData, role: e.target.value})}/>
                                <input required type="number" placeholder={c.forms.qty} className={`w-full p-4 rounded-xl outline-none border font-bold text-sm ${glassInput}`} onChange={e => setFormData({...formData, qty: e.target.value})}/>
                            </div>
                        )}

                        {/* HR Request (Leaves/Letters) */}
                        {actionStep === 'hr_request' && (
                            <div className="space-y-4">
                                <select className={`w-full p-4 rounded-xl outline-none border font-bold text-sm cursor-pointer ${glassInput}`} value={formData.hrType} onChange={e => setFormData({...formData, hrType: e.target.value})}>
                                    <option value="leave">{c.hr.leave}</option>
                                    <option value="letter">{c.hr.letter}</option>
                                </select>
                                {formData.hrType === 'leave' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-slate-500 block mb-1">{c.hr.from}</label><input required type="date" className={`w-full p-3 rounded-xl border ${glassInput}`} onChange={e => setFormData({...formData, startDate: e.target.value})}/></div>
                                        <div><label className="text-xs text-slate-500 block mb-1">{c.hr.to}</label><input required type="date" className={`w-full p-3 rounded-xl border ${glassInput}`} onChange={e => setFormData({...formData, endDate: e.target.value})}/></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Common Notes Field */}
                        <textarea required rows={3} onChange={e => setFormData({...formData, notes: e.target.value})} className={`w-full p-4 rounded-xl outline-none border resize-none font-bold text-sm ${glassInput}`} placeholder={c.forms.notes} />

                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button type="button" onClick={() => selectedTask ? setActionStep('menu') : closeActionModal()} className={`flex-1 py-4 rounded-xl font-bold text-sm transition ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{c.forms.cancel}</button>
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
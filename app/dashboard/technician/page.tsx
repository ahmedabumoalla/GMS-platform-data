'use client';

import { useState, useEffect } from 'react';
import { 
  Camera, CheckCircle2, AlertTriangle, FileText, Upload, X, 
  Fingerprint, Navigation, Receipt, Box, Briefcase, Send,
  Radio, Globe, Moon, Sun, MapPin // تأكدنا من استيراد MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'map' | 'report'>('tasks');
  const [checkedIn, setCheckedIn] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // --- إعدادات اللغة والثيم ---
  type Language = 'ar' | 'en' | 'ur' | 'hi' | 'bn';
  const [lang, setLang] = useState<Language>('ar');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const isRTL = lang === 'ar' || lang === 'ur';
  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) setIsDark(true);
    else setIsDark(false);
  }, []);

  // --- قاموس الترجمة المصحح (تمت إضافة navMap و navTasks) ---
  const t = {
    ar: {
      welcome: 'مرحباً، عبد الله 👋',
      role: 'فني أول كهرباء • معرف: #4092',
      statusTitle: 'حالة الدوام',
      statusOn: 'متواجد (بث مباشر)',
      statusOff: 'غير مسجل',
      btnStart: 'تسجيل دخول',
      btnStop: 'تسجيل خروج',
      trackingOn: 'جاري التتبع',
      alertTitle: 'ملاحظة هامة',
      alertDesc: 'البث المباشر للموقع يعمل تلقائياً عند تسجيل الدخول لضمان السلامة.',
      navTasks: 'الرئيسية', // تمت الإضافة
      navMap: 'الخريطة',   // تمت الإضافة
      actions: {
        photos: 'صور العمل', photosDesc: 'توثيق قبل/بعد',
        update: 'تحديث الحالة', updateDesc: 'إنجاز المهام',
        materials: 'طلب مواد', materialsDesc: 'قطع غيار',
        custody: 'طلب عهدة', custodyDesc: 'أدوات ومعدات',
        expenses: 'المصروفات', expensesDesc: 'رفع الفواتير',
        requests: 'طلبات أخرى', requestsDesc: 'إجازة / صيانة'
      },
      modal: {
        before: 'قبل العمل (إلزامي)',
        after: 'بعد العمل (إلزامي)',
        takePhoto: 'التقاط صورة',
        send: 'إرسال البيانات',
        notes: 'الملاحظات / التفاصيل',
        amount: 'المبلغ',
        project: 'اختر المشروع',
      }
    },
    en: {
      welcome: 'Hello, Abdullah 👋',
      role: 'Senior Electrician • ID: #4092',
      statusTitle: 'Attendance Status',
      statusOn: 'On Site (Live)',
      statusOff: 'Not Checked In',
      btnStart: 'Check In',
      btnStop: 'Check Out',
      trackingOn: 'Tracking On',
      alertTitle: 'Important Notice',
      alertDesc: 'Live location tracking starts automatically upon check-in.',
      navTasks: 'Home',    // Added
      navMap: 'Map',       // Added
      actions: {
        photos: 'Work Photos', photosDesc: 'Before/After',
        update: 'Update Status', updateDesc: 'Task Completion',
        materials: 'Materials', materialsDesc: 'Spare Parts',
        custody: 'Custody', custodyDesc: 'Tools & Gear',
        expenses: 'Expenses', expensesDesc: 'Upload Bills',
        requests: 'Requests', requestsDesc: 'Leave / Maint.'
      },
      modal: {
        before: 'Before Work (Required)',
        after: 'After Work (Required)',
        takePhoto: 'Take Photo',
        send: 'Submit Data',
        notes: 'Notes / Details',
        amount: 'Amount',
        project: 'Select Project',
      }
    },
    ur: {
      welcome: 'ہیلو، عبداللہ 👋',
      role: 'سینئر الیکٹریشن • ID: #4092',
      statusTitle: 'حاضری کی حیثیت',
      statusOn: 'سائٹ پر (لائیو)',
      statusOff: 'غیر رجسٹرڈ',
      btnStart: 'چیک ان',
      btnStop: 'چیک آؤٹ',
      trackingOn: 'ٹریکنگ جاری',
      alertTitle: 'اہم نوٹس',
      alertDesc: 'حفاظت کے لیے چیک ان کرنے پر لائیو لوکیشن ٹریکنگ شروع ہو جاتی ہے۔',
      navTasks: 'ہوم',      // Added
      navMap: 'نقشہ',       // Added
      actions: {
        photos: 'کام کی تصاویر', photosDesc: 'پہلے/بعد',
        update: 'حالت اپ ڈیٹ', updateDesc: 'کام مکمل',
        materials: 'میٹریل', materialsDesc: 'اسپیئر پارٹس',
        custody: 'عہدہ', custodyDesc: 'اوزار',
        expenses: 'اخراجات', expensesDesc: 'بل اپ لوڈ',
        requests: 'درخواستیں', requestsDesc: 'چھٹی / مرمت'
      },
      modal: {
        before: 'کام سے پہلے',
        after: 'کام کے بعد',
        takePhoto: 'تصویر لیں',
        send: 'بھیجیں',
        notes: 'نوٹس',
        amount: 'رقم',
        project: 'پروجیکٹ',
      }
    },
    hi: {
      welcome: 'नमस्ते, अब्दुल्ला 👋',
      role: 'वरिष्ठ इलेक्ट्रीशियन • ID: #4092',
      statusTitle: 'उपस्थिति स्थिति',
      statusOn: 'साइट पर (लाइव)',
      statusOff: 'चेक इन नहीं',
      btnStart: 'चेक इन',
      btnStop: 'चेक आउट',
      trackingOn: 'ट्रैकिंग चालू',
      alertTitle: 'महत्वपूर्ण सूचना',
      alertDesc: 'सुरक्षा के लिए चेक-इन पर लाइव ट्रैकिंग शुरू हो जाती है।',
      navTasks: 'होम',      // Added
      navMap: 'नक्शा',      // Added
      actions: {
        photos: 'कार्य तस्वीरें', photosDesc: 'पहले/बाद में',
        update: 'स्थिति अपडेट', updateDesc: 'कार्य पूरा',
        materials: 'सामग्री', materialsDesc: 'स्पेयर पार्ट्स',
        custody: 'हिरासत', custodyDesc: 'उपकरण',
        expenses: 'खर्च', expensesDesc: 'बिल अपलोड',
        requests: 'अनुरोध', requestsDesc: 'छुट्टी / रखरखाव'
      },
      modal: {
        before: 'काम से पहले',
        after: 'काम के बाद',
        takePhoto: 'फोटो लें',
        send: 'भेजें',
        notes: 'विवरण',
        amount: 'राशि',
        project: 'परियोजना',
      }
    },
    bn: {
      welcome: 'হ্যালো, আব্দুল্লাহ 👋',
      role: 'সিনিয়র ইলেকট্রিশিয়ান • ID: #4092',
      statusTitle: 'উপস্থিতির অবস্থা',
      statusOn: 'সাইটে (লাইভ)',
      statusOff: 'নিবন্ধিত নয়',
      btnStart: 'চেক ইন',
      btnStop: 'চেক আউট',
      trackingOn: 'ট্র্যাকিং চালু',
      alertTitle: 'গুরুত্বপূর্ণ বিজ্ঞপ্তি',
      alertDesc: 'চেক-ইন করার সময় লাইভ ট্র্যাকিং স্বয়ংক্রিয়ভাবে শুরু হয়।',
      navTasks: 'হোম',      // Added
      navMap: 'মানচিত্র',    // Added
      actions: {
        photos: 'কাজের ছবি', photosDesc: 'আগে/পরে',
        update: 'আপডেট', updateDesc: 'কাজ সম্পন্ন',
        materials: 'উপকরণ', materialsDesc: 'স্পেয়ার পার্টস',
        custody: 'হেফাজত', custodyDesc: 'যন্ত্রপাতি',
        expenses: 'খরচ', expensesDesc: 'বিল',
        requests: 'অনুরোধ', requestsDesc: 'ছুটি'
      },
      modal: {
        before: 'কাজের আগে',
        after: 'কাজের পরে',
        takePhoto: 'ছবি তুলুন',
        send: 'পাঠান',
        notes: 'বিবরণ',
        amount: 'পরিমাণ',
        project: 'প্রকল্প',
      }
    }
  };

  const c = t[lang];

  const actionList = [
    { id: 'photos', title: c.actions.photos, desc: c.actions.photosDesc, icon: Camera, color: 'bg-blue-600' },
    { id: 'update', title: c.actions.update, desc: c.actions.updateDesc, icon: CheckCircle2, color: 'bg-emerald-600' },
    { id: 'materials', title: c.actions.materials, desc: c.actions.materialsDesc, icon: Box, color: 'bg-purple-600' },
    { id: 'custody', title: c.actions.custody, desc: c.actions.custodyDesc, icon: Briefcase, color: 'bg-amber-600' },
    { id: 'expenses', title: c.actions.expenses, desc: c.actions.expensesDesc, icon: Receipt, color: 'bg-rose-600' },
    { id: 'requests', title: c.actions.requests, desc: c.actions.requestsDesc, icon: FileText, color: 'bg-slate-600' }
  ];

  const handleCheckIn = () => {
    if (!checkedIn) { setCheckedIn(true); setTrackingActive(true); } 
    else { setCheckedIn(false); setTrackingActive(false); }
  };

  const closeModal = () => setActiveModal(null);

  const bgMain = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
  const headerBg = isDark ? 'bg-slate-900' : 'bg-slate-900';

  return (
    <div className={`min-h-screen font-sans pb-24 relative overflow-x-hidden transition-colors duration-500 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={dir}>
      
      {/* Watermark */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] opacity-[0.03] pointer-events-none z-0 ${isDark ? 'invert-0' : 'invert'}`}>
         <img src="/logo.png" alt="Watermark" className="w-full h-full object-contain" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 ${headerBg} text-white p-6 rounded-b-[2.5rem] shadow-2xl transition-all duration-300`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold">{c.welcome}</h1>
            <p className="text-slate-400 text-sm opacity-80">{c.role}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 bg-slate-800/50 backdrop-blur rounded-full flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition">
              {isDark ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18} className="text-slate-300"/>}
            </button>
            <div className="relative">
              <button onClick={() => setIsLangOpen(!isLangOpen)} className="w-10 h-10 bg-slate-800/50 backdrop-blur rounded-full flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition">
                <Globe size={18} className="text-blue-400"/>
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full mt-2 w-40 bg-white text-slate-900 rounded-xl shadow-xl overflow-hidden z-50 border border-slate-200 ${isRTL ? 'left-0' : 'right-0'}`}>
                    {[
                      { code: 'ar', label: 'العربية' }, { code: 'en', label: 'English' }, { code: 'ur', label: 'اردو' }, { code: 'hi', label: 'हिंदी' }, { code: 'bn', label: 'বাংলা' }
                    ].map((l) => (
                      <button key={l.code} onClick={() => { setLang(l.code as Language); setIsLangOpen(false); }} className={`w-full text-start px-4 py-3 text-sm font-bold border-b border-slate-50 last:border-0 hover:bg-slate-50 transition flex justify-between items-center ${lang === l.code ? 'text-blue-600 bg-blue-50' : ''}`}>
                        {l.label} {lang === l.code && <CheckCircle2 size={14}/>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl flex justify-between items-center relative overflow-hidden">
          {trackingActive && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none"></div>}
          <div className="relative z-10">
            <div className="text-xs text-slate-400 mb-1">{c.statusTitle}</div>
            <div className={`font-bold flex items-center gap-2 ${checkedIn ? 'text-emerald-400' : 'text-slate-300'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${checkedIn ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`}></div>
              {checkedIn ? c.statusOn : c.statusOff}
            </div>
          </div>
          {trackingActive && <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full animate-bounce shadow-sm border border-emerald-500/20"><Radio size={12}/> {c.trackingOn}</div>}
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="p-6 pt-64 space-y-6 relative z-10">
        
        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
            <button onClick={handleCheckIn} className={`p-6 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-lg transition-all active:scale-95 border relative overflow-hidden group ${checkedIn ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-inner ${checkedIn ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    <Fingerprint size={32} />
                </div>
                <div className="text-center">
                    <h3 className={`font-bold ${checkedIn ? 'text-red-500' : 'text-emerald-500'}`}>{checkedIn ? c.btnStop : c.btnStart}</h3>
                </div>
            </button>

            <button onClick={() => setActiveTab('map')} className={`p-6 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-lg transition-all active:scale-95 border ${cardBg}`}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-900/20">
                    <Navigation size={32} />
                </div>
                <div className="text-center">
                    <h3 className={`font-bold ${textMain}`}>{c.navMap}</h3>
                </div>
            </button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {actionList.map((action) => (
                <button key={action.id} onClick={() => setActiveModal(action.id)} className={`${cardBg} p-4 rounded-2xl shadow-sm flex flex-col items-start gap-3 hover:shadow-lg transition-all active:scale-95 group`}>
                    <div className={`${action.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                        <action.icon size={20} />
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${textMain}`}>{action.title}</h4>
                        <p className={`text-[10px] mt-0.5 ${textSub}`}>{action.desc}</p>
                    </div>
                </button>
            ))}
        </div>

        {/* Alert */}
        <div className={`border p-4 rounded-2xl flex items-center gap-3 mt-4 ${isDark ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-600"><AlertTriangle size={20} /></div>
            <div>
                <h4 className="text-sm font-bold text-amber-600">{c.alertTitle}</h4>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-500/80' : 'text-amber-700'}`}>{c.alertDesc}</p>
            </div>
        </div>
      </main>

      {/* --- Bottom Nav (Fixed) --- */}
      <nav className={`fixed bottom-0 w-full px-6 py-3 flex justify-between items-center z-40 pb-safe border-t ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-md`}>
        <NavButton icon={CheckCircle2} label={c.navTasks} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} isDark={isDark} />
        <div className="relative -top-6">
          <button onClick={() => setActiveModal('photos')} className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-600/40 border-4 border-transparent transition-transform active:scale-95 hover:scale-105">
            <Camera size={28} />
          </button>
        </div>
        <NavButton icon={MapPin} label={c.navMap} active={activeTab === 'map'} onClick={() => setActiveTab('map')} isDark={isDark} />
      </nav>

      {/* --- Modals --- */}
      <AnimatePresence>
      {activeModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'} w-full max-w-md rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-bold ${textMain}`}>{actionList.find(a => a.id === activeModal)?.title}</h3>
              <button onClick={closeModal} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><X size={20}/></button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); closeModal(); }}>
              <div className="space-y-1">
                <label className={`text-xs font-bold ${textSub}`}>{c.modal.project}</label>
                <select className={`w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                  <option>NEOM Main Station</option>
                  <option>Red Sea Project</option>
                </select>
              </div>

              {activeModal === 'photos' && (
                 <div className="grid grid-cols-2 gap-4">
                    {['before', 'after'].map((type) => (
                        <div key={type} className="space-y-2">
                            <label className={`text-xs font-bold block text-center ${textSub}`}>{type === 'before' ? c.modal.before : c.modal.after}</label>
                            <div className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                                <Camera className="text-slate-400 mb-1" size={24} />
                                <span className="text-[10px] text-slate-400 font-bold">{c.modal.takePhoto}</span>
                            </div>
                        </div>
                    ))}
                 </div>
              )}

              {activeModal === 'expenses' && (
                 <div className="space-y-1">
                    <label className={`text-xs font-bold ${textSub}`}>{c.modal.amount}</label>
                    <input type="number" className={`w-full border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="0.00" />
                 </div>
              )}

              {activeModal !== 'photos' && (
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${textSub}`}>{c.modal.notes}</label>
                    <textarea rows={3} className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="..."></textarea>
                  </div>
              )}

              <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition active:scale-95">
                <Send size={18}/> {c.modal.send}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick, isDark }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-600' : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
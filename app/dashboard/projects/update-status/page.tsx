'use client';

import { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, Camera, Mic, 
  Send, MapPin, FileText, ChevronDown, ChevronUp, Globe, 
  Briefcase, Save, ShieldAlert, Sparkles, Loader2, X, 
  UploadCloud, Lock, Check, Calendar
} from 'lucide-react';

// --- Types & Interfaces ---
type StatusType = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked' | 'Delayed';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

interface Task {
  id: string;
  title: string;
  project: string;
  projectId: string;
  location: string;
  dueDate: string;
  currentSystemProgress: number; // Read-only from backend
}

export default function EnterpriseFieldUpdatePage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeTask, setActiveTask] = useState<string | null>(null);
  
  // AI & Processing States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<{type: 'warning' | 'success', msg: string} | null>(null);
  
  // Reporting Form State (Reset when task changes in real app)
  const [status, setStatus] = useState<StatusType>('In Progress');
  const [delayReason, setDelayReason] = useState('');
  const [notes, setNotes] = useState('');
  const [risk, setRisk] = useState<RiskLevel>('Low');
  const [attachments, setAttachments] = useState<string[]>([]);

  // Mock Data
  const tasks: Task[] = [
    { 
      id: 'TSK-2024-101', 
      title: lang === 'ar' ? 'تركيب العدادات الذكية - قطاع 4' : 'Smart Meter Installation - Sector 4', 
      project: lang === 'ar' ? 'مشروع البنية التحتية للكهرباء' : 'Electrical Infrastructure Project', 
      projectId: 'PRJ-ELEC-04',
      location: 'Riyadh, Al-Malqa', 
      dueDate: '2024-02-25',
      currentSystemProgress: 65 
    },
    { 
      id: 'TSK-2024-102', 
      title: lang === 'ar' ? 'فحص جودة التمديدات الأرضية' : 'Underground Cabling QA Inspection', 
      project: lang === 'ar' ? 'مشروع شبكات المياه' : 'Water Network Project', 
      projectId: 'PRJ-WATER-09',
      location: 'Jeddah, North Obhur', 
      dueDate: '2024-02-28',
      currentSystemProgress: 40 
    },
  ];

  // --- Handlers ---
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const handleAiValidation = () => {
    setIsAiAnalyzing(true);
    setAiInsight(null);
    
    // Simulate AI Logic
    setTimeout(() => {
      setIsAiAnalyzing(false);
      if (status === 'Delayed' && !delayReason) {
        setAiInsight({
            type: 'warning',
            msg: lang === 'ar' ? 'تنبيه: يجب تحديد سبب التأخير لإكمال التقرير.' : 'Alert: Delay reason is mandatory for this status.'
        });
      } else if (notes.length < 20) {
        setAiInsight({
            type: 'warning',
            msg: lang === 'ar' ? 'الملاحظات قصيرة جداً. يرجى إضافة تفاصيل فنية لضمان الامتثال.' : 'Notes are too brief. Please add technical details for compliance.'
        });
      } else {
        setAiInsight({
            type: 'success',
            msg: lang === 'ar' ? 'التقرير مكتمل ومتوافق مع المعايير. جاهز للإرسال.' : 'Report is complete and compliant. Ready to submit.'
        });
      }
    }, 1500);
  };

  const handleFileUpload = () => {
    setAttachments(prev => [...prev, `IMG_${Math.floor(Math.random() * 1000)}.jpg`]);
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Reporting Context Header --- */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="text-blue-600" />
              {lang === 'ar' ? 'تحديث التنفيذ الميداني' : 'Field Execution Update'}
            </h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
              <span>Eng. Ahmed Al-Ghamdi (Field Supervisor)</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                <MapPin size={10} /> GPS Verified
              </span>
            </p>
          </div>
          <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
             <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Task Selection List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            {lang === 'ar' ? 'المهام المسندة الحالية' : 'Current Assigned Tasks'}
          </h2>
          
          {tasks.map(task => (
            <div key={task.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${activeTask === task.id ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-200'}`}>
              
              {/* Task Summary Card (Clickable) */}
              <div 
                onClick={() => setActiveTask(activeTask === task.id ? null : task.id)}
                className={`p-5 flex justify-between items-center cursor-pointer transition ${activeTask === task.id ? 'bg-slate-50 border-b border-slate-100' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl flex flex-col items-center justify-center w-14 h-14 ${activeTask === task.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{task.id}</span>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{task.projectId}</span>
                        </div>
                        <h3 className={`font-bold text-lg leading-tight ${activeTask === task.id ? 'text-blue-700' : 'text-slate-800'}`}>{task.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {task.location}</span>
                            <span className="flex items-center gap-1"><Calendar size={12}/> {task.dueDate}</span>
                        </div>
                    </div>
                </div>
                {activeTask === task.id ? <ChevronUp className="text-blue-600" /> : <ChevronDown className="text-slate-400" />}
              </div>

              {/* Extended Reporting Form */}
              {activeTask === task.id && (
                <div className="p-6 space-y-8 animate-in slide-in-from-top-4 duration-300">
                  
                  {/* Section 1: System Calculated Progress (Read-Only) */}
                  <div className="bg-slate-900 rounded-xl p-5 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Lock size={12} /> {lang === 'ar' ? 'نسبة الإنجاز المحسوبة (نظامياً)' : 'System Calculated Progress'}
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
                    <SectionLabel title={lang === 'ar' ? 'تحديث حالة المهمة' : 'Task Status Update'} />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <StatusButton 
                            label={lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'} 
                            active={status === 'In Progress'} 
                            onClick={() => setStatus('In Progress')} 
                            icon={Clock} color="blue" 
                        />
                        <StatusButton 
                            label={lang === 'ar' ? 'مكتمل' : 'Completed'} 
                            active={status === 'Completed'} 
                            onClick={() => setStatus('Completed')} 
                            icon={CheckCircle2} color="green" 
                        />
                        <StatusButton 
                            label={lang === 'ar' ? 'متوقف/محظور' : 'Blocked'} 
                            active={status === 'Blocked'} 
                            onClick={() => setStatus('Blocked')} 
                            icon={X} color="red" 
                        />
                        <StatusButton 
                            label={lang === 'ar' ? 'متأخر' : 'Delayed'} 
                            active={status === 'Delayed'} 
                            onClick={() => setStatus('Delayed')} 
                            icon={AlertTriangle} color="amber" 
                        />
                    </div>

                    {/* Conditional Delay Reason */}
                    {(status === 'Delayed' || status === 'Blocked') && (
                        <div className="animate-in fade-in zoom-in duration-200">
                            <label className="text-xs font-bold text-red-600 mb-2 block">
                                {lang === 'ar' ? 'سبب التأخير / التوقف (إلزامي)*' : 'Reason for Delay/Blockage (Mandatory)*'}
                            </label>
                            <select 
                                className="w-full bg-red-50 border border-red-200 text-slate-700 text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500 transition"
                                value={delayReason}
                                onChange={(e) => setDelayReason(e.target.value)}
                            >
                                <option value="">{lang === 'ar' ? '-- اختر السبب --' : '-- Select Reason --'}</option>
                                <option value="material">{lang === 'ar' ? 'نقص المواد' : 'Material Shortage'}</option>
                                <option value="access">{lang === 'ar' ? 'تعذر الوصول للموقع' : 'Site Access Issue'}</option>
                                <option value="weather">{lang === 'ar' ? 'أحوال جوية' : 'Weather Conditions'}</option>
                                <option value="approval">{lang === 'ar' ? 'انتظار تصريح/موافقة' : 'Pending Approval'}</option>
                            </select>
                        </div>
                    )}
                  </div>

                  {/* Section 3: Execution Notes */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <SectionLabel title={lang === 'ar' ? 'سجل التنفيذ والملاحظات' : 'Execution Log & Observations'} />
                        <button 
                            onClick={handleAiValidation}
                            className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:bg-purple-50 px-2 py-1 rounded-lg transition"
                        >
                            <Sparkles size={12}/> {lang === 'ar' ? 'تدقيق بالذكاء الاصطناعي' : 'AI Audit'}
                        </button>
                    </div>
                    
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition h-32 resize-none placeholder:text-slate-400 leading-relaxed"
                        placeholder={lang === 'ar' 
                            ? '• الأعمال المنجزة اليوم:\n• المشاكل التي واجهتها:\n• ملاحظات السلامة:' 
                            : '• Work performed today:\n• Issues encountered:\n• Safety observations:'}
                    ></textarea>

                    {/* AI Feedback Area */}
                    {isAiAnalyzing && (
                        <div className="flex items-center gap-2 text-xs text-purple-600 animate-pulse">
                            <Loader2 size={14} className="animate-spin"/> {lang === 'ar' ? 'جاري تحليل اكتمال التقرير...' : 'Analyzing report completeness...'}
                        </div>
                    )}
                    
                    {aiInsight && (
                        <div className={`p-3 rounded-xl flex gap-3 animate-in fade-in zoom-in duration-300 border ${
                            aiInsight.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800'
                        }`}>
                            {aiInsight.type === 'warning' ? <AlertTriangle size={18} className="shrink-0"/> : <Check size={18} className="shrink-0"/>}
                            <p className="text-xs font-bold">{aiInsight.msg}</p>
                        </div>
                    )}
                  </div>

                  {/* Section 4: Evidence & Attachments */}
                  <div className="space-y-4">
                    <SectionLabel title={lang === 'ar' ? 'الأدلة والمرفقات (مطلوب)' : 'Evidence & Attachments (Required)'} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button onClick={handleFileUpload} className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition group">
                            <Camera size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold">{lang === 'ar' ? 'التقاط صورة' : 'Take Photo'}</span>
                        </button>
                        <button className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition group">
                            <UploadCloud size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold">{lang === 'ar' ? 'رفع ملف' : 'Upload File'}</span>
                        </button>
                        
                        {/* Attachments List */}
                        {attachments.map((file, idx) => (
                            <div key={idx} className="aspect-square relative bg-blue-50 border border-blue-200 rounded-xl flex flex-col items-center justify-center text-blue-600 animate-in zoom-in">
                                <FileText size={24} />
                                <span className="text-[8px] mt-2 px-1 truncate w-full text-center font-bold">{file}</span>
                                <div className="text-[8px] text-blue-400 mt-0.5">10:45 AM</div>
                                <button className="absolute top-1 right-1 bg-white/50 hover:bg-red-500 hover:text-white rounded-full p-0.5 transition"><X size={12}/></button>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Section 5: Risk Assessment */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <SectionLabel title={lang === 'ar' ? 'سجل المخاطر والتصعيد' : 'Risk & Escalation Log'} />
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'مستوى الخطورة الملاحظ:' : 'Observed Risk Level:'}</span>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                {['Low', 'Medium', 'High', 'Critical'].map((r) => (
                                    <button 
                                        key={r}
                                        onClick={() => setRisk(r as RiskLevel)}
                                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition ${
                                            risk === r 
                                            ? r === 'High' || r === 'Critical' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-800 text-white shadow-md'
                                            : 'text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Escalation Warning */}
                        {(risk === 'High' || risk === 'Critical') && (
                            <div className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100 text-red-700 animate-pulse">
                                <ShieldAlert size={20} className="shrink-0 mt-0.5"/>
                                <div>
                                    <p className="text-xs font-bold">{lang === 'ar' ? 'إشعار تصعيد تلقائي' : 'Automatic Escalation Notice'}</p>
                                    <p className="text-[10px] opacity-80 mt-0.5">
                                        {lang === 'ar' ? 'سيتم إرسال تنبيه فوري إلى مدير المشروع وفريق السلامة.' : 'Immediate alert will be sent to Project Manager and HSE Team.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-3 pt-6 sticky bottom-0 bg-white/90 backdrop-blur pb-2 z-10 border-t border-slate-100">
                    <button className="flex-1 py-3.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2">
                        <Save size={18} /> {lang === 'ar' ? 'حفظ كمسودة' : 'Save Draft'}
                    </button>
                    <button className="flex-[2] py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center justify-center gap-2">
                        <Send size={18} /> {lang === 'ar' ? 'رفع التقرير الرسمي' : 'Submit Official Report'}
                    </button>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

// --- Sub Components ---

function SectionLabel({ title }: { title: string }) {
    return (
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            {title} <div className="h-px bg-slate-200 flex-1"></div>
        </h4>
    );
}

interface StatusBtnProps { label: string; active: boolean; onClick: () => void; icon: any; color: 'blue' | 'green' | 'red' | 'amber' }
function StatusButton({ label, active, onClick, icon: Icon, color }: StatusBtnProps) {
    const colors = {
        blue: 'bg-blue-50 border-blue-500 text-blue-700',
        green: 'bg-emerald-50 border-emerald-500 text-emerald-700',
        red: 'bg-red-50 border-red-500 text-red-700',
        amber: 'bg-amber-50 border-amber-500 text-amber-700',
    };
    return (
        <button 
            onClick={onClick}
            className={`py-4 px-2 rounded-2xl text-xs font-bold border-2 transition flex flex-col items-center gap-2 ${
                active ? colors[color] : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
            }`}
        >
            <Icon size={24} className={active ? '' : 'opacity-50'}/>
            {label}
        </button>
    );
}
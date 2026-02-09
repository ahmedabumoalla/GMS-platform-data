'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Flag, MapPin, ChevronLeft, ChevronRight, 
  Filter, Search, ZoomIn, ZoomOut, AlertTriangle, CheckCircle, 
  GitCommit, Layers, MoreHorizontal, BrainCircuit,
  ArrowRight, ArrowLeft, BarChart3, Loader2
} from 'lucide-react';

// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout'; 

// --- Types ---
type EventStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Critical' | 'Completed';
type EventType = 'Milestone' | 'Task' | 'Meeting' | 'Review' | 'Delivery';
type Priority = 'High' | 'Medium' | 'Low';

interface TimelineEvent {
  id: string;
  date: string;
  time?: string;
  title: string;
  project: string;
  client: string;
  type: EventType;
  status: EventStatus;
  priority: Priority;
  description: string;
  assignedTo?: string;
  isCriticalPath?: boolean;
}

export default function EnterpriseTimelinePage() {
  // ✅ استخدام اللغة من النظام العام
  const { lang } = useDashboard();
  
  const [selectedView, setSelectedView] = useState<'Vertical' | 'Gantt'>('Vertical');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true); // إعادة تفعيل اللودينج عند تغيير اللغة
    setTimeout(() => {
      setEvents([
        { 
          id: 'EVT-001', date: '2024-02-05', time: '09:00 AM', 
          title: lang === 'ar' ? 'تسليم الموقع - مشروع الورود' : 'Site Handover - Al-Wurud', 
          project: lang === 'ar' ? 'تطوير البنية التحتية' : 'Infrastructure Dev', 
          client: 'MOMRA', type: 'Milestone', status: 'Completed', priority: 'High', 
          description: lang === 'ar' ? 'استلام الموقع من الأمانة وبدء التجهيزات.' : 'Site handover from municipality and setup start.',
          assignedTo: 'Eng. Ahmed', isCriticalPath: true
        },
        { 
          id: 'EVT-002', date: '2024-02-10', time: '10:30 AM', 
          title: lang === 'ar' ? 'اجتماع المراجعة الأسبوعي' : 'Weekly Review Meeting', 
          project: lang === 'ar' ? 'صيانة الشبكات' : 'Network Maintenance', 
          client: 'SEC', type: 'Meeting', status: 'On Track', priority: 'Medium', 
          description: lang === 'ar' ? 'مناقشة تقارير الأداء مع الاستشاري.' : 'Discuss performance reports with consultant.' 
        },
        { 
          id: 'EVT-003', date: '2024-02-15', 
          title: lang === 'ar' ? 'انتهاء مرحلة الحفر - القطاع 3' : 'Excavation End - Sector 3', 
          project: lang === 'ar' ? 'تطوير البنية التحتية' : 'Infrastructure Dev', 
          client: 'MOMRA', type: 'Task', status: 'At Risk', priority: 'High', 
          description: lang === 'ar' ? 'الموعد النهائي لإنهاء أعمال الحفر وتمديد الأنابيب.' : 'Deadline for excavation and pipe laying.',
          isCriticalPath: true
        },
        { 
          id: 'EVT-004', date: '2024-02-20', 
          title: lang === 'ar' ? 'اختبارات التشغيل الأولي' : 'Initial Operation Tests', 
          project: lang === 'ar' ? 'محطة الضخ 4' : 'Pump Station 4', 
          client: 'NWC', type: 'Review', status: 'Delayed', priority: 'High', 
          description: lang === 'ar' ? 'بدء اختبارات الضغط للشبكة الجديدة.' : 'Start pressure tests for new network.',
          assignedTo: 'Eng. Sarah'
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]); // ✅ التحديث عند تغيير اللغة

  // --- Logic ---
  const runAiAnalysis = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiInsight(lang === 'ar' 
        ? 'تحليل الجدول: يوجد تضارب محتمل في الموارد بتاريخ 15 فبراير بين مشروعين حرجين. يُنصح بإعادة جدولة "اجتماع المراجعة" لتخفيف الضغط.' 
        : 'Schedule Analysis: Potential resource conflict detected on Feb 15 between two critical projects. Suggest rescheduling "Review Meeting" to alleviate load.');
    }, 2000);
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'On Track': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'At Risk': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Delayed': return 'bg-red-100 text-red-700 border-red-200';
      case 'Critical': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getTypeIcon = (type: EventType) => {
    switch (type) {
        case 'Milestone': return <Flag size={16} />;
        case 'Meeting': return <UsersIcon size={16} />;
        case 'Task': return <GitCommit size={16} />;
        case 'Review': return <Search size={16} />;
        default: return <Clock size={16} />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Timeline Control Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              {lang === 'ar' ? 'تنسيق الجدول الزمني للمشاريع' : 'Project Timeline Orchestration'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'إدارة المواعيد النهائية، المسارات الحرجة، ومخاطر التأخير' : 'Manage deadlines, critical paths, and delay risks'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             
             {/* Date Navigation */}
             <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 p-1">
                <button className="p-1.5 hover:bg-white rounded-lg transition shadow-sm"><ChevronRight size={18} /></button>
                <span className="px-4 text-sm font-bold text-slate-700 w-32 text-center">
                    {currentDate.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button className="p-1.5 hover:bg-white rounded-lg transition shadow-sm"><ChevronLeft size={18} /></button>
             </div>

             {/* زر التحليل الذكي */}
             <button 
                onClick={runAiAnalysis}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center gap-2"
             >
                {isAiAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} className={isAiAnalyzing ? 'animate-pulse' : ''} />}
                {isAiAnalyzing ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'كشف التعارضات الذكي' : 'AI Conflict Detection')}
             </button>
          </div>
        </div>

        {/* Controls & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
                <ViewToggle label={lang === 'ar' ? 'قائمة زمنية' : 'Vertical'} active={selectedView === 'Vertical'} onClick={() => setSelectedView('Vertical')} />
                <ViewToggle label={lang === 'ar' ? 'مخطط جانت' : 'Gantt'} active={selectedView === 'Gantt'} onClick={() => setSelectedView('Gantt')} />
                <ViewToggle label={lang === 'ar' ? 'المسار الحرج' : 'Critical Path'} active={false} onClick={() => {}} />
            </div>
            
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} className="pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 w-48" />
                </div>
                <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                    <Filter size={18} />
                </button>
                <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                    <ZoomIn size={18} />
                </button>
            </div>
        </div>

        {/* AI Insight Box */}
        {aiInsight && (
            <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm"><AlertTriangle size={18}/></div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">{aiInsight}</p>
                <button onClick={() => setAiInsight(null)} className="mr-auto text-slate-400 hover:text-slate-600">
                    {lang === 'ar' ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}
                </button>
            </div>
        )}
      </div>

      {/* --- Section 2: Timeline Content (Vertical View) --- */}
      <div className="p-6 relative">
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل الجدول الزمني...' : 'Loading timeline...'}</div>
        ) : (
            <div className="max-w-5xl mx-auto">
                {/* Vertical Line */}
                <div className={`absolute top-6 bottom-6 w-0.5 bg-slate-200 ${lang === 'ar' ? 'right-12' : 'left-12'}`}></div>

                <div className="space-y-8">
                    {events.map((event) => (
                        <div key={event.id} className="relative flex items-start gap-6 group">
                            
                            {/* Timeline Node */}
                            <div className={`relative z-10 w-12 h-12 rounded-2xl border-4 border-slate-50 shadow-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 
                                ${event.isCriticalPath ? 'bg-red-500 text-white' : 'bg-white text-slate-500'}`}>
                                {getTypeIcon(event.type)}
                            </div>

                            {/* Event Card */}
                            <div className={`flex-1 bg-white p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group-hover:shadow-lg group-hover:-translate-y-1
                                ${event.isCriticalPath ? 'border-red-200 shadow-red-50' : 'border-slate-200 shadow-sm'}
                            `}>
                                {/* Critical Path Stripe */}
                                {event.isCriticalPath && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>}

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                            {event.isCriticalPath && (
                                                <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                                    <AlertTriangle size={10} /> {lang === 'ar' ? 'مسار حرج' : 'Critical Path'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg">{event.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-700">{event.date}</div>
                                        {event.time && <div className="text-xs text-slate-400 font-mono">{event.time}</div>}
                                    </div>
                                </div>

                                <p className="text-sm text-slate-500 leading-relaxed mb-4">{event.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded"><BriefcaseIcon size={12}/> {event.project}</span>
                                        {event.assignedTo && <span className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded"><UsersIcon size={12}/> {event.assignedTo}</span>}
                                    </div>
                                    <button className="text-slate-400 hover:text-blue-600 transition">
                                        <MoreHorizontal size={18}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

    </div>
  );
}

// --- Helper Components ---

function ViewToggle({ label, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                active 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
        >
            {label}
        </button>
    );
}

function UsersIcon({size}: {size: number}) { return <span style={{fontSize: size}}>👥</span> }
function BriefcaseIcon({size}: {size: number}) { return <span style={{fontSize: size}}>💼</span> }
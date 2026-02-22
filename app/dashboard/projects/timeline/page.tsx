'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; 
import { 
  Calendar, Clock, Flag, MapPin, ChevronLeft, ChevronRight, 
  Filter, Search, ZoomIn, ZoomOut, AlertTriangle, CheckCircle, 
  GitCommit, Layers, MoreHorizontal, BrainCircuit,
  ArrowRight, ArrowLeft, BarChart3, Loader2, Users, Briefcase, X,
  Eye, MessageSquare, Download, CheckSquare 
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion'; 
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
  const router = useRouter(); 
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar'; 
  
  const [selectedView, setSelectedView] = useState<'Vertical' | 'Gantt'>('Vertical');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // 🚀 حالة القائمة المنسدلة والتحميل
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- Fetch Real Data from Supabase ---
  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        let query = supabase.from('projects').select('*').order('start_date', { ascending: true });

        if (user.role === 'project_manager') {
            query = query.ilike('manager_name', `%${user.full_name}%`);
        }

        const { data: projectsData, error } = await query;
        if (error) throw error;

        if (projectsData) {
            const generatedEvents: TimelineEvent[] = [];
            const today = new Date();

            projectsData.forEach((p: any) => {
                if (p.start_date) {
                    const startDate = new Date(p.start_date);
                    generatedEvents.push({
                        id: `START-${p.id}`,
                        date: p.start_date,
                        title: isRTL ? `بدء العمل: ${p.title}` : `Kickoff: ${p.title}`,
                        project: p.title,
                        client: p.location_name || (isRTL ? 'داخلي' : 'Internal'),
                        type: 'Milestone',
                        status: startDate < today ? 'Completed' : 'On Track',
                        priority: 'Medium',
                        description: p.task_description || (isRTL ? 'بدء التجهيزات وتعبئة الموارد للمشروع.' : 'Project kickoff and resource mobilization.'),
                        assignedTo: p.manager_name || 'N/A'
                    });
                }

                if (p.end_date) {
                    const endDate = new Date(p.end_date);
                    let evtStatus: EventStatus = p.status === 'Completed' ? 'Completed' : 'On Track';
                    
                    if (p.status !== 'Completed') {
                        if (endDate < today) {
                            evtStatus = 'Delayed';
                        } else {
                            const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                            if (daysLeft <= 7) evtStatus = 'Critical';
                        }
                    }

                    generatedEvents.push({
                        id: `END-${p.id}`,
                        date: p.end_date,
                        title: isRTL ? `تسليم نهائي: ${p.title}` : `Final Delivery: ${p.title}`,
                        project: p.title,
                        client: p.location_name || (isRTL ? 'داخلي' : 'Internal'),
                        type: 'Delivery',
                        status: evtStatus,
                        priority: 'High',
                        description: isRTL ? 'الموعد النهائي لتسليم وإغلاق المشروع.' : 'Deadline for final project handover.',
                        assignedTo: p.manager_name || 'N/A',
                        isCriticalPath: true
                    });
                }
            });

            generatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            setEvents(generatedEvents);
            setFilteredEvents(generatedEvents);
        }
      } catch (error) {
        console.error("Error fetching timeline data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [user, isRTL]);

  useEffect(() => {
      if (!searchQuery.trim()) {
          setFilteredEvents(events);
      } else {
          const q = searchQuery.toLowerCase();
          setFilteredEvents(events.filter(e => 
              e.title.toLowerCase().includes(q) || 
              e.project.toLowerCase().includes(q) || 
              e.assignedTo?.toLowerCase().includes(q)
          ));
      }
  }, [searchQuery, events]);

  // 🚀 --- أفعال القائمة المنسدلة الذكية --- 🚀

  const getRealProjectId = (eventId: string) => eventId.replace('START-', '').replace('END-', '');

  const handleViewDetails = (eventId: string) => {
      const projectId = getRealProjectId(eventId);
      router.push(`/dashboard/projects/progress?search=${projectId}`);
      setActiveActionMenu(null);
  };

  const handleMarkCompleted = async (eventId: string) => {
      setActionLoading(eventId);
      const projectId = getRealProjectId(eventId);
      
      try {
          const { error } = await supabase.from('projects').update({ status: 'Completed' }).eq('id', projectId);
          if (error) throw error;

          const updatedEvents = events.map(e => getRealProjectId(e.id) === projectId ? { ...e, status: 'Completed' as EventStatus } : e);
          setEvents(updatedEvents);
          setFilteredEvents(updatedEvents);
          
          alert(isRTL ? 'تم التحديث كـ "مكتمل" بنجاح!' : 'Marked as completed successfully!');
      } catch (error: any) {
          alert(isRTL ? 'حدث خطأ أثناء التحديث' : 'Error updating status');
      } finally {
          setActionLoading(null);
          setActiveActionMenu(null);
      }
  };

  const handleMessageTeam = (projectName: string) => {
      router.push(`/dashboard/communication/chat?context=${encodeURIComponent(projectName)}`);
      setActiveActionMenu(null);
  };

  // 🚀 4. التصميم الاحترافي لـ PDF عبر الطباعة الذكية للمتصفح
  const handleDownloadReport = (event: TimelineEvent) => {
      setActionLoading(event.id);
      
      setTimeout(() => {
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) {
            alert(isRTL ? 'يرجى السماح بالنوافذ المنبثقة (Pop-ups) لتحميل التقرير' : 'Please allow pop-ups to download the report');
            setActionLoading(null);
            return;
        }

        // بناء قالب HTML احترافي جداً للتقرير
        const htmlContent = `
          <!DOCTYPE html>
          <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'en'}">
            <head>
              <meta charset="utf-8">
              <title>${isRTL ? 'تقرير' : 'Report'} - ${event.project}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
                body {
                  font-family: 'Tajawal', sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #fff;
                  color: #1e293b;
                }
                .page-container {
                  position: relative;
                  width: 100%;
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 40px;
                  box-sizing: border-box;
                }
                /* الشعار كعلامة مائية في الخلفية */
                .watermark {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  opacity: 0.05;
                  width: 400px;
                  height: auto;
                  z-index: -1;
                  pointer-events: none;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 3px solid #2563eb;
                  padding-bottom: 20px;
                  margin-bottom: 30px;
                }
                .header h1 {
                  margin: 0;
                  font-size: 24px;
                  color: #1e40af;
                  font-weight: 900;
                }
                .header p {
                  margin: 5px 0 0;
                  font-size: 12px;
                  color: #64748b;
                }
                .status-badge {
                  background-color: #eff6ff;
                  color: #1d4ed8;
                  padding: 6px 12px;
                  border-radius: 6px;
                  font-weight: bold;
                  font-size: 14px;
                  border: 1px solid #bfdbfe;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 30px;
                }
                .info-card {
                  background: #f8fafc;
                  padding: 15px;
                  border-radius: 10px;
                  border: 1px solid #e2e8f0;
                }
                .info-label {
                  font-size: 11px;
                  text-transform: uppercase;
                  color: #64748b;
                  margin-bottom: 5px;
                  font-weight: bold;
                }
                .info-value {
                  font-size: 16px;
                  font-weight: bold;
                  color: #0f172a;
                }
                .desc-section {
                  margin-top: 30px;
                }
                .desc-title {
                  font-size: 16px;
                  font-weight: bold;
                  border-bottom: 1px solid #e2e8f0;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
                  color: #1e293b;
                }
                .desc-content {
                  background: #f8fafc;
                  padding: 20px;
                  border-radius: 10px;
                  font-size: 14px;
                  line-height: 1.6;
                  border: 1px solid #e2e8f0;
                  color: #334155;
                }
                .footer {
                  margin-top: 50px;
                  text-align: center;
                  font-size: 11px;
                  color: #94a3b8;
                  border-top: 1px dashed #e2e8f0;
                  padding-top: 20px;
                }
                /* لضمان طباعة الألوان والخلفية في ملف الـ PDF */
                @media print {
                  @page { margin: 0; size: A4; }
                  body { padding: 2cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .page-container { width: 100%; max-width: none; padding: 0; }
                }
              </style>
            </head>
            <body>
              <div class="page-container">
                <img src="/logo.png" class="watermark" alt="GMS Logo" onerror="this.style.display='none'" />
                
                <div class="header">
                  <div>
                    <h1>${isRTL ? 'تقرير تفاصيل الحدث' : 'Event Details Report'}</h1>
                    <p>GMS ERP Platform - ${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
                  </div>
                  <div class="status-badge">${event.status}</div>
                </div>

                <div class="info-grid">
                  <div class="info-card">
                    <div class="info-label">${isRTL ? 'المشروع' : 'Project'}</div>
                    <div class="info-value">${event.project}</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">${isRTL ? 'عنوان الحدث' : 'Event Title'}</div>
                    <div class="info-value">${event.title}</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">${isRTL ? 'التاريخ' : 'Date'}</div>
                    <div class="info-value">${event.date}</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">${isRTL ? 'العميل / الموقع' : 'Client / Location'}</div>
                    <div class="info-value">${event.client}</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">${isRTL ? 'المدير المسؤول' : 'Assigned Manager'}</div>
                    <div class="info-value">${event.assignedTo || 'N/A'}</div>
                  </div>
                  <div class="info-card">
                    <div class="info-label">${isRTL ? 'مستوى الأولوية' : 'Priority'}</div>
                    <div class="info-value">${event.priority}</div>
                  </div>
                </div>

                <div class="desc-section">
                  <div class="desc-title">${isRTL ? 'وصف وتفاصيل الحدث' : 'Event Description & Details'}</div>
                  <div class="desc-content">
                    ${event.description || (isRTL ? 'لا توجد تفاصيل إضافية.' : 'No additional details provided.')}
                  </div>
                </div>

                <div class="footer">
                  ${isRTL ? 'تم إنشاء هذا التقرير آلياً بواسطة نظام إدارة الموارد GMS.' : 'This report was automatically generated by GMS ERP System.'}<br/>
                  ${new Date().toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                </div>
              </div>
              <script>
                // أمر الحفظ كملف PDF تلقائياً
                window.onload = function() {
                  setTimeout(() => {
                    window.print();
                  }, 500);
                }
              </script>
            </body>
          </html>
        `;

        reportWindow.document.open();
        reportWindow.document.write(htmlContent);
        reportWindow.document.close();

        setActionLoading(null);
        setActiveActionMenu(null);
      }, 500);
  };

  const runAiAnalysis = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      const criticalEvents = events.filter(e => e.status === 'Critical' || e.status === 'Delayed');
      
      if (criticalEvents.length > 0) {
          setAiInsight(isRTL 
            ? `تحليل الجدول: تم رصد ${criticalEvents.length} أحداث في المسار الحرج تحتاج لتدخل سريع. يُنصح بإعادة توجيه الموارد لتجنب غرامات التأخير.` 
            : `Schedule Analysis: Detected ${criticalEvents.length} critical path events requiring immediate intervention to avoid delay penalties.`);
      } else {
          setAiInsight(isRTL 
            ? `تحليل الجدول: الجدول الزمني مستقر ولا توجد تعارضات أو تأخيرات حرجة حالياً.` 
            : `Schedule Analysis: The timeline is stable. No critical conflicts or delays detected.`);
      }
    }, 2000);
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'On Track': return isDark ? 'bg-blue-900/40 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200';
      case 'At Risk': return isDark ? 'bg-amber-900/40 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Delayed': return isDark ? 'bg-orange-900/40 text-orange-400 border-orange-800' : 'bg-red-100 text-red-700 border-red-200';
      case 'Critical': return isDark ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Completed': return isDark ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800' : 'bg-green-100 text-green-700 border-green-200';
      default: return isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getTypeIcon = (type: EventType) => {
    switch (type) {
        case 'Milestone': return <Flag size={16} />;
        case 'Meeting': return <Users size={16} />;
        case 'Task': return <GitCommit size={16} />;
        case 'Review': return <Search size={16} />;
        case 'Delivery': return <CheckCircle size={16} />;
        default: return <Clock size={16} />;
    }
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="w-full md:w-auto">
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Calendar className="text-blue-600" />
              {isRTL ? 'تنسيق الجدول الزمني للمشاريع' : 'Project Timeline Orchestration'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
              {isRTL ? 'إدارة المواعيد النهائية، المسارات الحرجة، ومخاطر التأخير' : 'Manage deadlines, critical paths, and delay risks'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className={`h-8 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
             
             <div className={`flex items-center rounded-xl border p-1 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <button className={`p-1.5 rounded-lg transition shadow-sm ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}><ChevronRight size={18} className={isRTL ? 'rotate-180' : ''}/></button>
                <span className="px-4 text-sm font-bold w-32 text-center">
                    {currentDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button className={`p-1.5 rounded-lg transition shadow-sm ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}><ChevronLeft size={18} className={isRTL ? 'rotate-180' : ''}/></button>
             </div>

             <button 
                onClick={runAiAnalysis}
                disabled={isAiAnalyzing || events.length === 0}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
             >
                {isAiAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} className={isAiAnalyzing ? 'animate-pulse' : ''} />}
                {isAiAnalyzing ? (isRTL ? 'جاري التحليل...' : 'Analyzing...') : (isRTL ? 'كشف التعارضات' : 'Detect Conflicts')}
             </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
                <ViewToggle isDark={isDark} label={isRTL ? 'قائمة زمنية' : 'Vertical'} active={selectedView === 'Vertical'} onClick={() => setSelectedView('Vertical')} />
                <ViewToggle isDark={isDark} label={isRTL ? 'مخطط جانت' : 'Gantt'} active={selectedView === 'Gantt'} onClick={() => setSelectedView('Gantt')} />
                <ViewToggle isDark={isDark} label={isRTL ? 'المسار الحرج' : 'Critical Path'} active={false} onClick={() => {}} />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-slate-400 w-4 h-4`} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isRTL ? 'بحث في الأحداث...' : 'Search events...'} 
                        className={`w-full rounded-xl px-4 py-2 text-sm outline-none transition border ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`} 
                    />
                </div>
                <button className={`p-2 rounded-xl transition border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <Filter size={18} />
                </button>
                <button className={`p-2 rounded-xl transition border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <ZoomIn size={18} />
                </button>
            </div>
        </div>

        <AnimatePresence>
            {aiInsight && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-sm shrink-0"><AlertTriangle size={18}/></div>
                    <p className={`text-sm font-medium leading-relaxed mt-1 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>{aiInsight}</p>
                    <button onClick={() => setAiInsight(null)} className={`mr-auto p-1 rounded-full ${isDark ? 'text-indigo-400 hover:bg-indigo-900/50' : 'text-indigo-400 hover:bg-indigo-100'}`}>
                        <X size={16}/>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="p-6 relative">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : filteredEvents.length === 0 ? (
            <div className={`text-center py-20 font-medium ${textSub}`}>
                {isRTL ? 'لا توجد أحداث زمنية مسجلة.' : 'No timeline events found.'}
            </div>
        ) : (
            <div className="max-w-5xl mx-auto pb-20">
                <div className={`absolute top-6 bottom-6 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} ${isRTL ? 'right-12' : 'left-12'}`}></div>

                <div className="space-y-8">
                    {filteredEvents.map((event) => (
                        <div key={event.id} className="relative flex items-start gap-6 group">
                            
                            <div className={`relative z-10 w-12 h-12 rounded-2xl border-4 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm
                                ${isDark ? 'border-slate-950' : 'border-slate-50'}
                                ${event.isCriticalPath ? 'bg-red-500 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'}`}>
                                {getTypeIcon(event.type)}
                            </div>

                            <div className={`flex-1 p-5 rounded-2xl border transition-all duration-300 relative overflow-visible group-hover:shadow-lg group-hover:-translate-y-1
                                ${cardBg}
                                ${event.isCriticalPath ? (isDark ? 'border-red-900/50 shadow-red-900/20' : 'border-red-200 shadow-red-50') : ''}
                            `}>
                                {event.isCriticalPath && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-2xl"></div>}

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                            {event.isCriticalPath && (
                                                <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded border ${isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                    <AlertTriangle size={10} /> {isRTL ? 'مسار حرج' : 'Critical Path'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={`font-bold text-lg mt-2 ${textMain}`}>{event.title}</h3>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={`text-sm font-bold ${textMain}`}>{event.date}</div>
                                        {event.time && <div className={`text-xs font-mono mt-0.5 ${textSub}`}>{event.time}</div>}
                                    </div>
                                </div>

                                <p className={`text-sm leading-relaxed mb-4 ${textSub}`}>{event.description}</p>

                                <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                    <div className={`flex flex-wrap items-center gap-3 text-xs font-medium ${textSub}`}>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}><Briefcase size={14}/> {event.project}</span>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}><MapPin size={14}/> {event.client}</span>
                                        {event.assignedTo && <span className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}><Users size={14}/> {event.assignedTo}</span>}
                                    </div>
                                    
                                    {/* 🚀 القائمة المنسدلة للإجراءات السريعة الحقيقية */}
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveActionMenu(activeActionMenu === event.id ? null : event.id)}
                                            className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-blue-400' : 'hover:bg-slate-100 text-slate-400 hover:text-blue-600'}`}
                                        >
                                            <MoreHorizontal size={18}/>
                                        </button>

                                        <AnimatePresence>
                                            {activeActionMenu === event.id && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                                                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                                                    transition={{ duration: 0.15 }}
                                                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-full mb-2 w-56 rounded-xl shadow-2xl border z-50 overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                                                >
                                                    <div className="flex flex-col py-1.5">
                                                        <button onClick={() => handleViewDetails(event.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                            <Eye size={16} className="text-blue-500"/> {isRTL ? 'عرض تفاصيل المشروع' : 'View Project Details'}
                                                        </button>
                                                        
                                                        {event.status !== 'Completed' && (
                                                            <button 
                                                                onClick={() => handleMarkCompleted(event.id)} 
                                                                disabled={actionLoading === event.id}
                                                                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors disabled:opacity-50 ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                                            >
                                                                {actionLoading === event.id ? <Loader2 size={16} className="animate-spin text-emerald-500"/> : <CheckSquare size={16} className="text-emerald-500"/>}
                                                                {isRTL ? 'تحديث كـ "مكتمل"' : 'Mark as Completed'}
                                                            </button>
                                                        )}

                                                        <button onClick={() => handleMessageTeam(event.project)} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                                                            <MessageSquare size={16} className="text-purple-500"/> {isRTL ? 'مراسلة الفريق' : 'Message Team'}
                                                        </button>
                                                        
                                                        <div className={`h-px my-1 mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                                                        
                                                        <button 
                                                            onClick={() => handleDownloadReport(event)} 
                                                            disabled={actionLoading === event.id}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors disabled:opacity-50 ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
                                                        >
                                                            {actionLoading === event.id ? <Loader2 size={16} className="animate-spin text-slate-400"/> : <Download size={16} className="text-slate-400"/>}
                                                            {isRTL ? 'حفظ كملف PDF' : 'Save as PDF'}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

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

function ViewToggle({ label, active, onClick, isDark }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                active 
                ? (isDark ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-white border-slate-800')
                : (isDark ? 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
            }`}
        >
            {label}
        </button>
    );
}
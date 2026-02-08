'use client';

import { useState, useEffect } from 'react';
import { 
  MoreHorizontal, Plus, Search, Filter, AlertTriangle, 
  CheckCircle2, Clock, PlayCircle, StopCircle, BrainCircuit, 
  Loader2, Globe, LayoutGrid, List, X, ArrowRight, ShieldCheck, User
} from 'lucide-react';

// --- Types ---
type TaskStatus = 'Pending' | 'In Progress' | 'Review' | 'Completed';
type Priority = 'High' | 'Medium' | 'Low';

interface WorkflowTask {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: Priority;
  deadline: string;
  status: TaskStatus;
  progress: number;
  isBlocked?: boolean;
  description?: string; // تفاصيل إضافية
}

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  icon: any;
}

export default function EnterpriseWorkflowPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Task Details Modal State
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);

  // --- Mock Data ---
  useEffect(() => {
    setTimeout(() => {
      setTasks([
        { 
          id: 'T-101', title: lang === 'ar' ? 'طلب مواد أولية' : 'Material Request', 
          project: 'Project A', assignee: 'Ahmed', priority: 'High', deadline: '2024-02-20', status: 'Pending', progress: 0, isBlocked: true,
          description: lang === 'ar' ? 'مطلوب توريد كابلات ضغط عالي للموقع رقم 3. الطلب معلق بانتظار موافقة المشتريات.' : 'HV cables supply required for Site 3. Request pending procurement approval.'
        },
        { 
          id: 'T-102', title: lang === 'ar' ? 'حفر الأساسات - قطاع 4' : 'Excavation Sector 4', 
          project: 'Project B', assignee: 'Saeed', priority: 'Medium', deadline: '2024-02-25', status: 'In Progress', progress: 45,
          description: lang === 'ar' ? 'أعمال الحفر مستمرة حسب الجدول. تم إنجاز 45% من المنطقة المحددة.' : 'Excavation ongoing as per schedule. 45% of designated area completed.'
        },
        { 
          id: 'T-103', title: lang === 'ar' ? 'اختبار الضغط' : 'Pressure Test', 
          project: 'Project C', assignee: 'Omar', priority: 'High', deadline: '2024-02-15', status: 'Review', progress: 90,
          description: lang === 'ar' ? 'تم الانتهاء من الاختبار الأولي. بانتظار مراجعة مهندس الجودة للاعتماد النهائي.' : 'Initial test completed. Waiting for QA engineer final approval.'
        },
        { 
          id: 'T-104', title: lang === 'ar' ? 'تسليم الموقع أ' : 'Site Handover A', 
          project: 'Project A', assignee: 'Yasser', priority: 'Low', deadline: '2024-02-10', status: 'Completed', progress: 100,
          description: lang === 'ar' ? 'تم تسليم الموقع للعميل واستلام محضر الاستلام.' : 'Site handed over to client and handover minutes received.'
        },
        { 
          id: 'T-105', title: lang === 'ar' ? 'تمديد الكابلات' : 'Cable Laying', 
          project: 'Project B', assignee: 'Team 2', priority: 'Medium', deadline: '2024-03-01', status: 'In Progress', progress: 60,
          description: lang === 'ar' ? 'جاري تمديد الكابلات في المسارات الرئيسية.' : 'Laying cables in main tracks.'
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  const columns: Column[] = [
    { id: 'Pending', title: lang === 'ar' ? 'قيد الانتظار' : 'Pending', color: 'bg-slate-100 border-slate-200', icon: Clock },
    { id: 'In Progress', title: lang === 'ar' ? 'جاري التنفيذ' : 'In Progress', color: 'bg-blue-50 border-blue-100', icon: PlayCircle },
    { id: 'Review', title: lang === 'ar' ? 'المراجعة والجودة' : 'Review & QA', color: 'bg-purple-50 border-purple-100', icon: CheckCircle2 },
    { id: 'Completed', title: lang === 'ar' ? 'تم الإنجاز' : 'Completed', color: 'bg-green-50 border-green-100', icon: StopCircle },
  ];

  // --- Actions ---
  const handleTaskAction = (action: string) => {
    if (!selectedTask) return;

    let newStatus = selectedTask.status;
    let newProgress = selectedTask.progress;

    if (action === 'start') { newStatus = 'In Progress'; newProgress = 10; }
    if (action === 'submit_review') { newStatus = 'Review'; newProgress = 90; }
    if (action === 'approve') { newStatus = 'Completed'; newProgress = 100; }
    if (action === 'reject') { newStatus = 'In Progress'; newProgress = 50; } // إعادة للعمل

    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, status: newStatus, progress: newProgress } : t));
    setSelectedTask(null); // إغلاق النافذة
  };

  const runAiAnalysis = async () => {
    setIsAiAnalyzing(true);
    setAiInsight(null);
    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-progress',
          lang,
          data: { projects: tasks.map(t => ({ name: t.title, status: t.status, priority: t.priority, risk: t.isBlocked ? 'High' : 'Low' })) }
        })
      });
      const data = await response.json();
      setAiInsight(data.result);
    } catch (error) {
      console.error(error);
      setAiInsight(lang === 'ar' ? 'فشل الاتصال بالذكاء الاصطناعي' : 'AI Connection Failed');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const getPriorityColor = (p: Priority) => {
    if (p === 'High') return 'bg-red-100 text-red-700';
    if (p === 'Medium') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className={`h-[calc(100vh-100px)] flex flex-col bg-slate-50 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <LayoutGrid className="text-blue-600" />
              {lang === 'ar' ? 'لوحة التحكم في سير العمل' : 'Operational Workflow Board'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'مراقبة حالة التنفيذ والتقدم الميداني لحظياً' : 'Real-time field execution monitoring and status'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             <button 
                onClick={runAiAnalysis}
                disabled={isAiAnalyzing}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center gap-2"
             >
                {isAiAnalyzing ? <Loader2 size={14} className="animate-spin"/> : <BrainCircuit size={14} />} 
                {lang === 'ar' ? 'تحليل الاختناقات' : 'Analyze Bottlenecks'}
             </button>
          </div>
        </div>

        {/* AI Insight */}
        {aiInsight && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-xl border border-indigo-100 flex items-start gap-3 animate-in slide-in-from-top-2 mb-4">
                <BrainCircuit size={16} className="text-indigo-600 shrink-0 mt-0.5"/>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{aiInsight}</p>
            </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                <input type="text" placeholder={lang === 'ar' ? 'بحث عن مهمة...' : 'Search task...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-blue-500 transition" />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                <Filter size={16} />
            </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading workflow data...'}</div>
        ) : (
            <div className="flex gap-6 min-w-[1000px] h-full">
                {columns.map(col => {
                    const colTasks = tasks.filter(t => t.status === col.id);
                    return (
                        <div key={col.id} className="flex-1 flex flex-col w-72 bg-slate-50/50 rounded-2xl border border-slate-200 h-full">
                            
                            {/* Column Header */}
                            <div className={`p-4 border-b border-slate-200 bg-white rounded-t-2xl flex justify-between items-center sticky top-0 z-10`}>
                                <div className="flex items-center gap-2">
                                    <col.icon size={16} className="text-slate-500"/>
                                    <span className="font-bold text-slate-700 text-sm">{col.title}</span>
                                </div>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600">{colTasks.length}</span>
                            </div>

                            {/* Task List */}
                            <div className="p-3 space-y-3 overflow-y-auto flex-1">
                                {colTasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        onClick={() => setSelectedTask(task)} // جعل الكرت تفاعلي
                                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer hover:border-blue-300 transition group relative overflow-hidden"
                                    >
                                        {/* Status Line */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.isBlocked ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                                        <div className="flex justify-between items-start mb-2 pl-2">
                                            <span className="text-[10px] font-mono text-slate-400">{task.id}</span>
                                            {task.isBlocked && <AlertTriangle size={14} className="text-red-500 animate-pulse"/>}
                                        </div>
                                        
                                        <h4 className="text-sm font-bold text-slate-800 mb-1 pl-2 leading-snug">{task.title}</h4>
                                        <p className="text-[10px] text-slate-500 pl-2 mb-3">{task.project}</p>

                                        {/* Metrics */}
                                        <div className="pl-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-50 pt-2">
                                            <span className={`px-1.5 py-0.5 rounded font-bold ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12}/> {task.deadline}
                                            </div>
                                        </div>

                                        {/* Progress Bar (System Calculated) */}
                                        <div className="mt-3 pl-2">
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className="text-slate-400">{lang === 'ar' ? 'إنجاز النظام' : 'System Progress'}</span>
                                                <span className="font-bold text-slate-700">{task.progress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${task.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* --- Task Details Modal --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded">{selectedTask.id}</span>
                            {selectedTask.isBlocked && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle size={10}/> {lang === 'ar' ? 'متوقف' : 'Blocked'}</span>}
                        </div>
                        <h3 className="font-bold text-xl text-slate-900">{selectedTask.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{selectedTask.project}</p>
                    </div>
                    <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-lg transition"><X size={20}/></button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Status & Progress */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'الحالة الحالية' : 'Current Status'}</span>
                            <span className="text-sm font-bold text-blue-700">{selectedTask.status}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${selectedTask.progress}%` }}></div>
                        </div>
                        <div className="text-right text-xs font-bold text-slate-600 mt-1">{selectedTask.progress}% {lang === 'ar' ? 'مكتمل' : 'Completed'}</div>
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-2">{lang === 'ar' ? 'تفاصيل المهمة' : 'Description'}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 border border-slate-100 rounded-xl">
                            {selectedTask.description}
                        </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><User size={14}/> {lang === 'ar' ? 'المسؤول' : 'Assignee'}</div>
                            <div className="font-bold text-slate-800 text-sm">{selectedTask.assignee}</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><Clock size={14}/> {lang === 'ar' ? 'الموعد النهائي' : 'Deadline'}</div>
                            <div className="font-bold text-slate-800 text-sm">{selectedTask.deadline}</div>
                        </div>
                    </div>

                    {/* Action Buttons (Decision Making) */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{lang === 'ar' ? 'الإجراءات والقرارات' : 'Actions & Decisions'}</h4>
                        <div className="flex flex-col gap-2">
                            {selectedTask.status === 'Pending' && (
                                <button onClick={() => handleTaskAction('start')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                    <PlayCircle size={18}/> {lang === 'ar' ? 'بدء التنفيذ' : 'Start Execution'}
                                </button>
                            )}
                            
                            {selectedTask.status === 'In Progress' && (
                                <button onClick={() => handleTaskAction('submit_review')} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition flex items-center justify-center gap-2">
                                    <ArrowRight size={18}/> {lang === 'ar' ? 'إرسال للمراجعة' : 'Submit for Review'}
                                </button>
                            )}

                            {selectedTask.status === 'Review' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleTaskAction('approve')} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2">
                                        <ShieldCheck size={18}/> {lang === 'ar' ? 'اعتماد' : 'Approve'}
                                    </button>
                                    <button onClick={() => handleTaskAction('reject')} className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition">
                                        {lang === 'ar' ? 'إعادة للعمل' : 'Reject'}
                                    </button>
                                </div>
                            )}

                            {selectedTask.status === 'Completed' && (
                                <div className="text-center p-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm border border-green-100 flex items-center justify-center gap-2">
                                    <CheckCircle2 size={18}/> {lang === 'ar' ? 'تم إغلاق المهمة' : 'Task Closed'}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
}
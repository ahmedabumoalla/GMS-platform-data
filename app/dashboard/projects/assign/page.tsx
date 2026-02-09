'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Briefcase, UserPlus, Calendar, 
  AlertTriangle, CheckCircle2, ChevronDown, LayoutGrid, 
  List, Zap, BarChart3, Clock, BrainCircuit, 
  ArrowRight, ArrowLeft, MoreHorizontal, MapPin, ShieldAlert,
  Loader2, Sparkles
} from 'lucide-react';

// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout'; 

// --- Types & Interfaces ---
type Priority = 'Critical' | 'High' | 'Medium' | 'Normal';
type RiskLevel = 'Low' | 'Moderate' | 'High';
type TaskStatus = 'Pending' | 'In Progress' | 'Review' | 'Completed';

interface Task {
  id: string;
  title: string;
  project: string;
  client: string;
  priority: Priority;
  risk: RiskLevel;
  status: TaskStatus;
  due_date: string;
  location: string;
  assigned_to: Employee | null;
  completion_rate: number;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  status: 'Available' | 'Busy' | 'On Leave';
  skill_match: number; 
  workload: number; 
  location_proximity: string;
}

export default function EnterpriseOperationsPage() {
  // ✅ استخدام اللغة من النظام العام
  const { lang } = useDashboard();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & AI States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  
  // حالات الذكاء الاصطناعي
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false); // للمودال
  const [isGlobalAiAnalyzing, setIsGlobalAiAnalyzing] = useState(false); // للزر العلوي
  
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null); // نتيجة المودال
  const [globalAiInsight, setGlobalAiInsight] = useState<string | null>(null); // نتيجة الزر العلوي

  // --- Mock Data Loading ---
  useEffect(() => {
    setLoading(true); // إعادة تفعيل اللودينج عند تغيير اللغة
    setTimeout(() => {
      setTasks([
        { 
          id: 'TSK-2024-001', title: lang === 'ar' ? 'فحص كابلات الجهد العالي - قطاع 7' : 'HV Cable Testing - Sector 7', 
          project: lang === 'ar' ? 'البنية التحتية للكهرباء' : 'Power Infrastructure', client: 'SEC',
          priority: 'Critical', risk: 'High', status: 'Pending', 
          due_date: '2024-02-25', location: 'Riyadh, Al-Malqa', assigned_to: null, completion_rate: 0 
        },
        { 
          id: 'TSK-2024-002', title: lang === 'ar' ? 'صيانة دورية للمولد رقم 4' : 'Generator #4 Maintenance', 
          project: lang === 'ar' ? 'عقود الصيانة السنوية' : 'Annual Maintenance', client: 'Ministry of Water',
          priority: 'Medium', risk: 'Low', status: 'In Progress', 
          due_date: '2024-02-28', location: 'Jeddah, Port', assigned_to: null, completion_rate: 45 
        },
        { 
          id: 'TSK-2024-003', title: lang === 'ar' ? 'اختبار جودة الألياف الضوئية' : 'Fiber Optic QA Testing', 
          project: lang === 'ar' ? 'مشروع الاتصالات الذكية' : 'Smart Telecom', client: 'STC',
          priority: 'High', risk: 'Moderate', status: 'Pending', 
          due_date: '2024-03-01', location: 'Dammam, Ind. Area', assigned_to: null, completion_rate: 0 
        },
        { 
          id: 'TSK-2024-004', title: lang === 'ar' ? 'تركيب عدادات ذكية - مجمع 2' : 'Smart Meter Installation - Zone 2', 
          project: lang === 'ar' ? 'مبادرة العدادات' : 'Metering Initiative', client: 'NHC',
          priority: 'Normal', risk: 'Low', status: 'Pending', 
          due_date: '2024-03-05', location: 'Riyadh, Narjis', assigned_to: null, completion_rate: 0 
        },
      ]);

      setEmployees([
        { id: 1, name: 'سعيد القحطاني', role: 'Senior Tech', status: 'Busy', skill_match: 95, workload: 80, location_proximity: '5 km' },
        { id: 2, name: 'عمر فاروق', role: 'Site Engineer', status: 'Available', skill_match: 88, workload: 20, location_proximity: '12 km' },
        { id: 3, name: 'ياسر الحربي', role: 'Safety Officer', status: 'Available', skill_match: 60, workload: 10, location_proximity: '25 km' },
        { id: 4, name: 'محمد علي', role: 'Cable Specialist', status: 'On Leave', skill_match: 99, workload: 0, location_proximity: 'N/A' },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]); // ✅ يعيد التحميل عند تغيير اللغة

  // --- Logic ---
  const handleAssign = (employee: Employee) => {
    if (!selectedTask) return;
    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, assigned_to: employee, status: 'In Progress' } : t));
    setAssignModalOpen(false);
    setSelectedTask(null);
    setAiRecommendation(null);
  };

  // 1. تحليل مهمة محددة (داخل المودال)
  const runTaskAiAnalysis = async () => {
    if (!selectedTask) return;
    setIsAiAnalyzing(true);
    setAiRecommendation(null);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-assignment',
          lang,
          data: {
            task: { title: selectedTask.title, location: selectedTask.location, risk: selectedTask.risk },
            employees: employees.map(e => ({ name: e.name, status: e.status, skill: e.skill_match, proximity: e.location_proximity }))
          }
        })
      });
      const data = await response.json();
      setAiRecommendation(data.result);
    } catch (error) {
      setAiRecommendation(lang === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection Error');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // 2. تحليل عام للعمليات (الزر العلوي)
  const runGlobalAnalysis = async () => {
    setIsGlobalAiAnalyzing(true);
    setGlobalAiInsight(null);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-progress', 
          lang,
          data: { 
            projects: tasks.map(t => ({ name: t.title, status: t.status, priority: t.priority, risk: t.risk }))
          }
        })
      });
      const data = await response.json();
      setGlobalAiInsight(data.result);
    } catch (error) {
      setGlobalAiInsight(lang === 'ar' ? 'فشل الاتصال بالخادم' : 'Server Connection Failed');
    } finally {
      setIsGlobalAiAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Operational Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Zap className="text-blue-600" fill="currentColor" />
              {lang === 'ar' ? 'مركز العمليات وتوزيع المهام' : 'Operations Control & Dispatch'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'إدارة التعيينات الميدانية ومراقبة الأداء التشغيلي' : 'Manage field assignments and monitor operational performance'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             <button className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200" onClick={() => setViewMode('grid')}>
                <LayoutGrid size={18} className={viewMode === 'grid' ? 'text-blue-600' : ''} />
             </button>
             <button className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200" onClick={() => setViewMode('list')}>
                <List size={18} className={viewMode === 'list' ? 'text-blue-600' : ''} />
             </button>
             
             {/* الزر العلوي للتحليل العام */}
             <button 
                onClick={runGlobalAnalysis}
                disabled={isGlobalAiAnalyzing}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center gap-2"
             >
                {isGlobalAiAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16} />} 
                {isGlobalAiAnalyzing ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'تحليل التوزيع الذكي' : 'AI Smart Dispatch')}
             </button>
          </div>
        </div>

        {/* Global Insight Box */}
        {globalAiInsight && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><BrainCircuit size={18}/></div>
                <div>
                    <h4 className="text-xs font-bold text-blue-800 mb-1">{lang === 'ar' ? 'رؤية النظام الذكية:' : 'System AI Insight:'}</h4>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{globalAiInsight}</p>
                </div>
                <button onClick={() => setGlobalAiInsight(null)} className="mr-auto text-slate-400 hover:text-slate-600">
                    {lang === 'ar' ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}
                </button>
            </div>
        )}

        {/* Operational Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label={lang === 'ar' ? 'مهام معلقة' : 'Pending Tasks'} value={tasks.filter(t => t.status === 'Pending').length} color="amber" icon={Clock} />
            <StatCard label={lang === 'ar' ? 'عاجل جداً' : 'Critical Priority'} value={tasks.filter(t => t.priority === 'Critical').length} color="red" icon={AlertTriangle} />
            <StatCard label={lang === 'ar' ? 'قيد التنفيذ' : 'In Execution'} value={tasks.filter(t => t.status === 'In Progress').length} color="blue" icon={Zap} />
            <StatCard label={lang === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'} value="64%" color="green" icon={BarChart3} />
        </div>

        {/* Advanced Filter Bar */}
        <div className="mt-6 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                <input type="text" placeholder={lang === 'ar' ? 'بحث برقم المهمة، الموقع، أو المشروع...' : 'Search by Task ID, Location...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-blue-500 transition" />
            </div>
            <FilterSelect label={lang === 'ar' ? 'الأولوية' : 'Priority'} />
            <FilterSelect label={lang === 'ar' ? 'المنطقة' : 'Zone'} />
            <FilterSelect label={lang === 'ar' ? 'الفريق' : 'Team'} />
        </div>
      </div>

      {/* --- Section 2: Smart Task Cards --- */}
      <div className="p-6">
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل البيانات التشغيلية...' : 'Loading operational data...'}</div>
        ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {tasks.map(task => (
                    <div key={task.id} className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        
                        {/* Severity Line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${getPriorityColor(task.priority)}`}></div>

                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{task.id}</span>
                                    <h3 className="text-lg font-bold text-slate-900 mt-1 leading-tight group-hover:text-blue-700 transition">{task.title}</h3>
                                </div>
                                <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={20}/></button>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                <Badge text={task.priority} type="priority" />
                                <Badge text={task.project} type="project" />
                                {task.risk === 'High' && <Badge text={lang === 'ar' ? 'مخاطر عالية' : 'High Risk'} type="risk" />}
                            </div>

                            {/* Details */}
                            <div className="space-y-3 text-sm text-slate-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={16} className="text-slate-400" />
                                    <span>{task.client}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span>{task.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className={task.priority === 'Critical' ? 'text-red-600 font-bold' : ''}>{task.due_date}</span>
                                </div>
                            </div>

                            {/* Footer / Action */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                {task.assigned_to ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                                            {task.assigned_to.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'مسندة إلى' : 'Assigned To'}</div>
                                            <div className="text-sm font-bold text-slate-800">{task.assigned_to.name}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => { setSelectedTask(task); setAssignModalOpen(true); }}
                                        className="w-full py-2.5 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white"
                                    >
                                        <UserPlus size={16} /> {lang === 'ar' ? 'تعيين موظف' : 'Assign Engineer'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- Section 3: Assignment Modal --- */}
      {isAssignModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">{lang === 'ar' ? 'تعيين المهمة الذكي' : 'Smart Task Assignment'}</h3>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{selectedTask.id}</p>
                    </div>
                    <div className="flex gap-2">
                        {/* زر تحليل المودال (للمهمة المحددة) */}
                        <button 
                            onClick={runTaskAiAnalysis}
                            disabled={isAiAnalyzing}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition disabled:opacity-50"
                            title="AI Suggestion"
                        >
                            {isAiAnalyzing ? <Loader2 size={20} className="animate-spin"/> : <BrainCircuit size={20} />}
                        </button>
                        <button onClick={() => setAssignModalOpen(false)} className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition border border-slate-200">X</button>
                    </div>
                </div>

                {aiRecommendation && (
                    <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-xl border border-purple-100 flex gap-3 animate-in slide-in-from-top-2">
                        <div className="p-1.5 bg-white rounded-lg border border-purple-100 text-purple-600 h-fit"><Sparkles size={16} /></div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{aiRecommendation}</p>
                    </div>
                )}
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3 bg-slate-50/50 flex-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">{lang === 'ar' ? 'الفريق المتاح والمؤهل' : 'Available & Qualified Team'}</h4>
              {employees.map(emp => (
                <div 
                  key={emp.id}
                  onClick={() => emp.status !== 'On Leave' && handleAssign(emp)}
                  className={`group bg-white p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                      emp.status === 'On Leave' 
                      ? 'opacity-60 cursor-not-allowed border-slate-100' 
                      : 'cursor-pointer hover:border-blue-400 hover:shadow-md border-slate-200'
                  }`}
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-slate-100">
                      <div className={`h-full ${getScoreColor(emp.skill_match)}`} style={{ width: `${emp.skill_match}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                            {emp.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 text-sm">{emp.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                {emp.role} &bull; <span className="text-blue-600">{emp.location_proximity}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <StatusBadge status={emp.status} />
                        <div className="text-[10px] text-slate-400 mt-1 font-bold">
                            {lang === 'ar' ? 'تطابق المهارة' : 'Match'}: <span className="text-slate-700">{emp.skill_match}%</span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <button onClick={() => setAssignModalOpen(false)} className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Functions ---

function StatCard({ label, value, color, icon: Icon }: any) {
    const colors: any = {
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600'
    };
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
                <div className="text-2xl font-black text-slate-800">{value}</div>
                <div className="text-xs font-bold text-slate-400">{label}</div>
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function Badge({ text, type }: any) {
    let classes = "px-2.5 py-1 rounded-lg text-[10px] font-bold border ";
    if (type === 'priority') {
        if (text === 'Critical') classes += "bg-red-50 text-red-700 border-red-100";
        else if (text === 'High') classes += "bg-orange-50 text-orange-700 border-orange-100";
        else classes += "bg-blue-50 text-blue-700 border-blue-100";
    } else if (type === 'risk') {
        classes += "bg-rose-50 text-rose-700 border-rose-100 flex items-center gap-1";
    } else {
        classes += "bg-slate-50 text-slate-600 border-slate-200";
    }
    return (
        <span className={classes}>
            {type === 'risk' && <ShieldAlert size={10} />}
            {text}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = status === 'Available' 
        ? 'bg-emerald-100 text-emerald-700' 
        : status === 'Busy' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500';
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles}`}>{status}</span>;
}

function FilterSelect({ label }: { label: string }) {
    return (
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            {label} <ChevronDown size={14} />
        </button>
    );
}

const getPriorityColor = (p: Priority) => {
    switch (p) {
        case 'Critical': return 'bg-red-600';
        case 'High': return 'bg-orange-500';
        case 'Medium': return 'bg-blue-500';
        default: return 'bg-slate-400';
    }
};

const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    return 'bg-amber-500';
};
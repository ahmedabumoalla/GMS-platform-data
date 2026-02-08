'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, AlertTriangle, CheckCircle, 
  MoreHorizontal, Filter, Search, Calendar, BrainCircuit,
  Globe, LayoutGrid, List, Clock, Zap, ArrowRight, ArrowLeft,
  ChevronDown, Activity, AlertOctagon
} from 'lucide-react';

// --- Types & Interfaces ---
type ProjectStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Critical' | 'Completed';
type RiskLevel = 'Low' | 'Medium' | 'High';

interface Project {
  id: string;
  name: string;
  client: string;
  manager: string;
  progress: number;
  status: ProjectStatus;
  risk: RiskLevel;
  deadline: string;
  lastUpdate: string;
  tasksCompleted: number;
  totalTasks: number;
  delayDays?: number;
}

export default function EnterpriseProgressPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- Mock Data Loading ---
  useEffect(() => {
    setTimeout(() => {
      setProjects([
        { 
          id: 'PRJ-2024-001', name: lang === 'ar' ? 'تطوير البنية التحتية - حي الورود' : 'Infrastructure Dev - Al-Wurud', 
          client: lang === 'ar' ? 'وزارة الشؤون البلدية' : 'MOMRA', manager: 'Eng. Ahmed',
          progress: 78, status: 'On Track', risk: 'Low', deadline: '2024-05-15',
          lastUpdate: '2h ago', tasksCompleted: 45, totalTasks: 58 
        },
        { 
          id: 'PRJ-2024-002', name: lang === 'ar' ? 'صيانة شبكات الري المركزية' : 'Central Irrigation Maint.', 
          client: lang === 'ar' ? 'أمانة الرياض' : 'Riyadh Municipality', manager: 'Eng. Omar',
          progress: 42, status: 'Delayed', risk: 'Medium', deadline: '2024-04-01', delayDays: 5,
          lastUpdate: '1d ago', tasksCompleted: 20, totalTasks: 48 
        },
        { 
          id: 'PRJ-2024-003', name: lang === 'ar' ? 'توريد وفحص كابلات الضغط العالي' : 'HV Cables Supply & Test', 
          client: lang === 'ar' ? 'الشركة السعودية للكهرباء' : 'SEC', manager: 'Eng. Sarah',
          progress: 88, status: 'Critical', risk: 'High', deadline: '2024-03-10', delayDays: 12,
          lastUpdate: '3d ago', tasksCompleted: 18, totalTasks: 20 
        },
        { 
          id: 'PRJ-2024-004', name: lang === 'ar' ? 'تشغيل محطة الضخ رقم 4' : 'Pumping Station #4 Ops', 
          client: lang === 'ar' ? 'المياه الوطنية' : 'NWC', manager: 'Eng. Fahad',
          progress: 100, status: 'Completed', risk: 'Low', deadline: '2024-02-01',
          lastUpdate: 'Today', tasksCompleted: 30, totalTasks: 30 
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  // --- Logic ---
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const runAiAnalysis = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiInsight(lang === 'ar' 
        ? 'تحليل الذكاء الاصطناعي: مشروع "كابلات الضغط العالي" يواجه خطراً حرجاً بسبب تأخر التوريد. يُنصح بتصعيد الأمر للمورد فوراً.' 
        : 'AI Insight: "HV Cables" project is at critical risk due to supply delays. Immediate escalation to vendor is recommended.');
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Progress Control Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="text-blue-600" />
              {lang === 'ar' ? 'مراقبة إنجاز المشاريع' : 'Project Execution Monitoring'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'نظرة شاملة على تقدم العمل، المخاطر، والأداء التشغيلي' : 'Overview of progress, risks, and operational performance'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             <button className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200" onClick={() => setViewMode('grid')}>
                <LayoutGrid size={18} className={viewMode === 'grid' ? 'text-blue-600' : ''} />
             </button>
             <button className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200" onClick={() => setViewMode('list')}>
                <List size={18} className={viewMode === 'list' ? 'text-blue-600' : ''} />
             </button>
             <button 
                onClick={runAiAnalysis}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center gap-2"
             >
                <BrainCircuit size={16} className={isAiAnalyzing ? 'animate-pulse' : ''} /> 
                {isAiAnalyzing ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'تحليل الأداء الذكي' : 'AI Performance Scan')}
             </button>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'مشاريع نشطة' : 'Active Projects'} value={projects.filter(p => p.status !== 'Completed').length} color="blue" icon={Zap} />
            <StatCard label={lang === 'ar' ? 'متأخرة' : 'Delayed'} value={projects.filter(p => p.status === 'Delayed' || p.status === 'Critical').length} color="red" icon={AlertOctagon} />
            <StatCard label={lang === 'ar' ? 'نسبة الإنجاز العام' : 'Avg. Completion'} value="72%" color="green" icon={TrendingUp} />
            <StatCard label={lang === 'ar' ? 'مخاطر عالية' : 'High Risk'} value={projects.filter(p => p.risk === 'High').length} color="amber" icon={AlertTriangle} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                <input type="text" placeholder={lang === 'ar' ? 'بحث باسم المشروع، العميل...' : 'Search project, client...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-blue-500 transition" />
            </div>
            <FilterSelect label={lang === 'ar' ? 'الحالة' : 'Status'} />
            <FilterSelect label={lang === 'ar' ? 'العميل' : 'Client'} />
            <FilterSelect label={lang === 'ar' ? 'المخاطر' : 'Risk'} />
        </div>

        {/* AI Insight Box */}
        {aiInsight && (
            <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm"><BrainCircuit size={18}/></div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">{aiInsight}</p>
            </div>
        )}
      </div>

      {/* --- Section 2: Project Health Cards --- */}
      <div className="p-6">
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل بيانات الأداء...' : 'Loading performance data...'}</div>
        ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {projects.map(project => (
                    <div key={project.id} className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 pb-4 border-b border-slate-50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{project.id}</span>
                                    {project.risk === 'High' && <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100">{lang === 'ar' ? 'خطر مرتفع' : 'High Risk'}</span>}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition line-clamp-1" title={project.name}>{project.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{project.client}</p>
                            </div>
                            
                            {/* Circular Progress (Mini) */}
                            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                        strokeDasharray={126} strokeDashoffset={126 - (126 * project.progress) / 100}
                                        className={getStatusColor(project.status, 'text')} 
                                    />
                                </svg>
                                <span className="absolute text-[10px] font-bold text-slate-700">{project.progress}%</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(project.status, 'bg')}`}>
                                    {getStatusIcon(project.status)}
                                    {project.status}
                                </span>
                                {project.delayDays && (
                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1">
                                        <Clock size={12}/> {project.delayDays} {lang === 'ar' ? 'يوم تأخير' : 'Days Delay'}
                                    </span>
                                )}
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'المهام المنجزة' : 'Tasks Done'}</div>
                                    <div className="text-sm font-bold text-slate-800">{project.tasksCompleted} / {project.totalTasks}</div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'الموعد النهائي' : 'Deadline'}</div>
                                    <div className={`text-sm font-bold ${project.status === 'Critical' ? 'text-red-600' : 'text-slate-800'}`}>{project.deadline}</div>
                                </div>
                            </div>

                            {/* Manager & Update */}
                            <div className="flex justify-between items-end text-xs text-slate-500">
                                <div>
                                    <span className="block text-slate-400 text-[10px] uppercase">{lang === 'ar' ? 'مدير المشروع' : 'Manager'}</span>
                                    <span className="font-bold text-slate-700">{project.manager}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-slate-400 text-[10px] uppercase">{lang === 'ar' ? 'آخر تحديث' : 'Updated'}</span>
                                    <span>{project.lastUpdate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Footer */}
                        <div className="bg-slate-50 p-3 border-t border-slate-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-0 left-0 right-0">
                            <button className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 transition">
                                {lang === 'ar' ? 'التفاصيل' : 'Details'}
                            </button>
                            <button className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-red-600 hover:border-red-300 transition">
                                {lang === 'ar' ? 'تقرير' : 'Report'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}

// --- Helper Functions & Components ---

function getStatusColor(status: ProjectStatus, type: 'bg' | 'text') {
    const colors = {
        'On Track': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'text-emerald-500' },
        'At Risk': { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-500' },
        'Delayed': { bg: 'bg-orange-50 text-orange-700 border-orange-100', text: 'text-orange-500' },
        'Critical': { bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-600' },
        'Completed': { bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'text-blue-600' },
    };
    return type === 'bg' ? colors[status].bg : colors[status].text;
}

function getStatusIcon(status: ProjectStatus) {
    switch (status) {
        case 'On Track': return <CheckCircle size={14} />;
        case 'At Risk': return <AlertTriangle size={14} />;
        case 'Delayed': return <Clock size={14} />;
        case 'Critical': return <AlertOctagon size={14} />;
        case 'Completed': return <CheckCircle size={14} />;
    }
}

function StatCard({ label, value, color, icon: Icon }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
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

function FilterSelect({ label }: { label: string }) {
    return (
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            {label} <ChevronDown size={14} />
        </button>
    );
}
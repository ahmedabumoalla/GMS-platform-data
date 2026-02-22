'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart2, TrendingUp, AlertTriangle, CheckCircle, 
  MoreHorizontal, Filter, Search, Calendar, BrainCircuit,
  LayoutGrid, List, Clock, Zap, ArrowRight, ArrowLeft,
  ChevronDown, Activity, AlertOctagon, Loader2, MapPin, Send, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../layout'; 

// --- Types & Interfaces ---
type ProjectStatus = 'On Track' | 'At Risk' | 'Delayed' | 'Critical' | 'Completed' | 'Pending';
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
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- 1. Fetch Real Data (🛠️ FIXED: Decoupled Queries for Reliability) ---
  useEffect(() => {
    const fetchProjectsProgress = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 1. جلب المشاريع أولاً
        let pQuery = supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        // الفلترة حسب صلاحية المستخدم
        if (user.role === 'project_manager') {
            pQuery = pQuery.ilike('manager_name', `%${user.full_name}%`);
        }

        const { data: projectsData, error: projError } = await pQuery;
        if (projError) throw projError;

        if (projectsData && projectsData.length > 0) {
            // 2. جلب جميع المهام (task_assignments) المرتبطة بهذه المشاريع
            const projectIds = projectsData.map(p => p.id);
            const { data: assignmentsData } = await supabase
                .from('task_assignments')
                .select('id, project_id, status, updated_at')
                .in('project_id', projectIds);

            const now = new Date();
            
            // 3. دمج البيانات وحساب النسب
            const processedData: Project[] = projectsData.map((p: any) => {
                // استخراج مهام هذا المشروع تحديداً
                const projectAssignments = assignmentsData?.filter(a => a.project_id === p.id) || [];
                
                const totalTasks = projectAssignments.length;
                const completedTasks = projectAssignments.filter(ta => ta.status === 'Completed').length;
                
                // حساب نسبة الإنجاز
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                // حساب التأخير والمخاطر
                let delayDays = 0;
                let calcStatus: ProjectStatus = progress === 100 ? 'Completed' : (totalTasks > 0 ? 'On Track' : 'Pending');
                let risk: RiskLevel = 'Low';

                if (p.end_date && progress < 100) {
                    const endDate = new Date(p.end_date);
                    if (now > endDate) {
                        const diffTime = Math.abs(now.getTime() - endDate.getTime());
                        delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (delayDays > 14) {
                            calcStatus = 'Critical';
                            risk = 'High';
                        } else {
                            calcStatus = 'Delayed';
                            risk = 'Medium';
                        }
                    } else {
                        // إذا كان متبقي أقل من 7 أيام والإنجاز أقل من 50%
                        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysLeft <= 7 && progress < 50) {
                            calcStatus = 'At Risk';
                            risk = 'High';
                        }
                    }
                }

                // تحديد آخر تحديث
                let lastUpdateDate = p.start_date;
                if (projectAssignments.length > 0) {
                    const latestTask = projectAssignments.reduce((latest: any, current: any) => {
                        return (!latest || new Date(current.updated_at) > new Date(latest.updated_at)) ? current : latest;
                    }, null);
                    if (latestTask && latestTask.updated_at) lastUpdateDate = new Date(latestTask.updated_at).toLocaleDateString();
                }

                return {
                    id: p.id,
                    name: p.title,
                    client: p.location_name || (isRTL ? 'داخلي' : 'Internal'),
                    manager: p.manager_name || 'N/A',
                    progress,
                    status: calcStatus,
                    risk,
                    deadline: p.end_date || (isRTL ? 'غير محدد' : 'Not Set'),
                    lastUpdate: lastUpdateDate || 'N/A',
                    tasksCompleted: completedTasks,
                    totalTasks,
                    delayDays: delayDays > 0 ? delayDays : undefined
                };
            });

            setProjects(processedData);
            setFilteredProjects(processedData);
        } else {
            setProjects([]);
            setFilteredProjects([]);
        }
      } catch (error: any) {
        console.error("Error fetching progress data:", error.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsProgress();
  }, [user, isRTL]);

  // --- 2. Handlers & Search ---
  useEffect(() => {
      if (!searchQuery.trim()) {
          setFilteredProjects(projects);
      } else {
          const lowerQ = searchQuery.toLowerCase();
          setFilteredProjects(projects.filter(p => 
              p.name.toLowerCase().includes(lowerQ) || 
              p.client.toLowerCase().includes(lowerQ) ||
              p.manager.toLowerCase().includes(lowerQ)
          ));
      }
  }, [searchQuery, projects]);

  const runAiAnalysis = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      const criticalProjects = projects.filter(p => p.risk === 'High');
      if (criticalProjects.length > 0) {
          setAiInsight(isRTL 
            ? `تحليل الذكاء الاصطناعي: يوجد ${criticalProjects.length} مشاريع تواجه خطراً حرجاً أبرزها "${criticalProjects[0].name}". يُنصح بتوجيه دعم فوري.` 
            : `AI Insight: ${criticalProjects.length} projects are at high risk, notably "${criticalProjects[0].name}". Immediate support is recommended.`);
      } else {
          setAiInsight(isRTL 
            ? `تحليل الذكاء الاصطناعي: الأداء العام مستقر. لا توجد مخاطر حرجة حالياً.` 
            : `AI Insight: Overall performance is stable. No critical risks detected at the moment.`);
      }
    }, 1500);
  };

  // --- Styles ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Progress Control Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Activity className="text-blue-600" />
              {isRTL ? 'مراقبة إنجاز المشاريع' : 'Project Execution Monitoring'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
              {isRTL ? 'نظرة شاملة على تقدم العمل، المخاطر، والأداء التشغيلي' : 'Overview of progress, risks, and operational performance'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className={`h-8 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
             <button className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600') : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200')}`} onClick={() => setViewMode('grid')}>
                <LayoutGrid size={18} />
             </button>
             <button className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600') : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200')}`} onClick={() => setViewMode('list')}>
                <List size={18} />
             </button>
             
             {/* زر التحليل الذكي */}
             <button 
                onClick={runAiAnalysis}
                disabled={isAiAnalyzing || projects.length === 0}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50 flex-1 md:flex-none justify-center"
             >
                {isAiAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16} />} 
                {isAiAnalyzing ? (isRTL ? 'جاري التحليل...' : 'Analyzing...') : (isRTL ? 'تحليل الأداء الذكي' : 'AI Performance Scan')}
             </button>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard isDark={isDark} label={isRTL ? 'مشاريع نشطة' : 'Active Projects'} value={filteredProjects.filter(p => p.status === 'On Track').length} color="blue" icon={Zap} />
            <StatCard isDark={isDark} label={isRTL ? 'المتأخرة' : 'Delayed'} value={filteredProjects.filter(p => p.status === 'Delayed' || p.status === 'Critical').length} color="red" icon={AlertOctagon} />
            <StatCard isDark={isDark} label={isRTL ? 'المهام المكتملة' : 'Completed Tasks'} value={filteredProjects.reduce((acc, curr) => acc + curr.tasksCompleted, 0)} color="green" icon={CheckCircle} />
            <StatCard isDark={isDark} label={isRTL ? 'مخاطر عالية' : 'High Risk'} value={filteredProjects.filter(p => p.risk === 'High').length} color="amber" icon={AlertTriangle} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3 text-slate-400 w-5 h-5`} />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRTL ? 'بحث باسم المشروع، العميل، المدير...' : 'Search project, client, manager...'} 
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`} 
                />
            </div>
            <FilterSelect isDark={isDark} label={isRTL ? 'الحالة' : 'Status'} />
            <FilterSelect isDark={isDark} label={isRTL ? 'المخاطر' : 'Risk'} />
        </div>

        {/* AI Insight Box */}
        <AnimatePresence>
            {aiInsight && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-sm shrink-0"><BrainCircuit size={18}/></div>
                    <p className={`text-sm font-medium leading-relaxed mt-1 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>{aiInsight}</p>
                    <button onClick={() => setAiInsight(null)} className={`mr-auto p-1 rounded-full ${isDark ? 'text-indigo-400 hover:bg-indigo-900/50' : 'text-indigo-400 hover:bg-indigo-100'}`}>
                        <X size={16}/>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* --- Section 2: Project Health Cards --- */}
      <div className="p-6">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium">
                {isRTL ? 'لا توجد مشاريع مطابقة للبحث.' : 'No projects found.'}
            </div>
        ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProjects.map(project => (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} key={project.id} className={`group rounded-2xl border transition-all duration-300 relative overflow-hidden ${cardBg} ${viewMode === 'list' ? 'flex flex-row items-center p-0' : 'hover:-translate-y-1 hover:shadow-xl'}`}>
                        
                        {/* Severity Line */}
                        <div className={`absolute ${viewMode === 'list' ? 'left-0 top-0 bottom-0 w-1.5' : 'top-0 left-0 right-0 h-1.5'} ${getStatusColor(project.status, 'bg-line')}`}></div>

                        <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'border-slate-800' : 'border-slate-100'} ${viewMode === 'list' ? 'border-b-0 border-l flex-1' : ''}`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{project.id.substring(0,8)}</span>
                                    {project.risk === 'High' && <span className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-bold border border-red-100 dark:border-red-500/20">{isRTL ? 'خطر مرتفع' : 'High Risk'}</span>}
                                </div>
                                <h3 className={`text-lg font-bold leading-tight transition line-clamp-1 mt-2 ${textMain}`} title={project.name}>{project.name}</h3>
                                <p className={`text-xs font-medium mt-1 ${textSub}`}><MapPin size={12} className="inline mr-1"/> {project.client}</p>
                            </div>
                            
                            {/* Circular Progress */}
                            <div className={`relative w-12 h-12 flex items-center justify-center shrink-0 ${viewMode === 'list' ? 'ml-6' : ''}`}>
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className={isDark ? 'text-slate-800' : 'text-slate-100'} />
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                        strokeDasharray={126} strokeDashoffset={126 - (126 * project.progress) / 100}
                                        className={`${getStatusColor(project.status, 'text')} transition-all duration-1000`} 
                                    />
                                </svg>
                                <span className={`absolute text-[10px] font-bold ${textMain}`}>{project.progress}%</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className={`p-6 ${viewMode === 'list' ? 'w-[400px] shrink-0 pt-6' : 'pt-4'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(project.status, 'badge')}`}>
                                    {getStatusIcon(project.status)}
                                    {project.status === 'Pending' && (isRTL ? 'بانتظار الإسناد' : 'Pending')}
                                    {project.status === 'On Track' && (isRTL ? 'قيد التنفيذ' : 'On Track')}
                                    {project.status === 'At Risk' && (isRTL ? 'في خطر' : 'At Risk')}
                                    {project.status === 'Delayed' && (isRTL ? 'متأخر' : 'Delayed')}
                                    {project.status === 'Critical' && (isRTL ? 'حرج' : 'Critical')}
                                    {project.status === 'Completed' && (isRTL ? 'مكتمل' : 'Completed')}
                                </span>
                                {project.delayDays && project.delayDays > 0 && (
                                    <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 px-2 py-1 rounded border border-red-100 dark:border-red-500/20 flex items-center gap-1">
                                        <Clock size={12}/> {project.delayDays} {isRTL ? 'يوم تأخير' : 'Days Delay'}
                                    </span>
                                )}
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{isRTL ? 'المهام المنجزة' : 'Tasks Done'}</div>
                                    <div className={`text-sm font-bold ${textMain}`}>{project.tasksCompleted} / {project.totalTasks}</div>
                                </div>
                                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{isRTL ? 'الموعد النهائي' : 'Deadline'}</div>
                                    <div className={`text-sm font-bold ${project.status === 'Critical' || project.status === 'Delayed' ? 'text-red-500' : textMain}`}>{project.deadline}</div>
                                </div>
                            </div>

                            {/* Manager & Update */}
                            <div className="flex justify-between items-end text-xs">
                                <div>
                                    <span className="block text-slate-400 text-[10px] uppercase mb-0.5">{isRTL ? 'إدارة' : 'Manager'}</span>
                                    <span className={`font-bold ${textMain}`}>{project.manager}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-slate-400 text-[10px] uppercase mb-0.5">{isRTL ? 'آخر تحديث' : 'Updated'}</span>
                                    <span className={`font-medium ${textSub}`}>{project.lastUpdate}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}

// --- Helper Functions & Components ---

function getStatusColor(status: ProjectStatus, type: 'bg-line' | 'text' | 'badge') {
    const colors = {
        'Pending': { line: 'bg-slate-400', text: 'text-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
        'Assigned': { line: 'bg-blue-400', text: 'text-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30' },
        'On Track': { line: 'bg-emerald-500', text: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30' },
        'In Progress': { line: 'bg-blue-500', text: 'text-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30' },
        'At Risk': { line: 'bg-amber-500', text: 'text-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30' },
        'Delayed': { line: 'bg-orange-500', text: 'text-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30' },
        'Critical': { line: 'bg-red-600', text: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30' },
        'Completed': { line: 'bg-indigo-600', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30' },
    };
    if (type === 'bg-line') return colors[status]?.line || colors['Pending'].line;
    if (type === 'text') return colors[status]?.text || colors['Pending'].text;
    return colors[status]?.badge || colors['Pending'].badge;
}

function getStatusIcon(status: ProjectStatus) {
    switch (status) {
        case 'Pending': return <Clock size={14} />;
        case 'On Track': return <CheckCircle size={14} />;
        case 'At Risk': return <AlertTriangle size={14} />;
        case 'Delayed': return <Clock size={14} />;
        case 'Critical': return <AlertOctagon size={14} />;
        case 'Completed': return <CheckCircle size={14} />;
        default: return <Activity size={14} />;
    }
}

function StatCard({ label, value, color, icon: Icon, isDark }: any) {
    const colors: any = {
        blue: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100',
        green: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-100',
        red: isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100',
    };
    return (
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:shadow-md'}`}>
            <div>
                <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</div>
                <div className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
            </div>
            <div className={`p-3 rounded-xl border ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function FilterSelect({ label, isDark }: { label: string, isDark: boolean }) {
    return (
        <button className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {label} <ChevronDown size={14} />
        </button>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, Clock, CheckCircle2, TrendingUp, Users, 
  Filter, Download, Share2, Info, ChevronDown, 
  ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck, 
  Calendar, Search, Loader2, BrainCircuit, X, User, Activity, Globe
} from 'lucide-react';
import { useDashboard } from '../../layout';

// --- Types ---
interface KPI {
  id: string;
  label: string;
  value: string;
  trend: number;
  insight: string;
  details: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Team {
  id: string;
  name: string;
  projectName: string;
  managerName: string;
  efficiency: number;
  completed: number;
  total: number;
  onTimeRate: number;
  qaPassRate: number;
  workload: 'Under' | 'Optimal' | 'Overloaded';
  risk?: string;
  members: TeamMember[];
}

interface Performer {
  id: string;
  name: string;
  role: string;
  team: string;
  tasksCompleted: number;
  qualityScore: number;
  onTimeRate: number;
  workload: 'Balanced' | 'High'; 
}

export default function ProductivityPage() {
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [period, setPeriod] = useState(new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' }));
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [performers, setPerformers] = useState<Performer[]>([]);
  
  // Drawer States
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'KPI' | 'Team' | 'Performer' | null>(null);

  // Filters
  const [teamFilter, setTeamFilter] = useState('All');

  // --- Real Data Fetching ---
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // جلب المشاريع، المهام، والموظفين
        const [resProjects, resTasks, resProfiles] = await Promise.all([
            supabase.from('projects').select('id, title, manager_name, status'),
            supabase.from('task_assignments').select('*'),
            supabase.from('profiles').select('id, full_name, role, job_title')
        ]);

        const dbProjects = resProjects.data || [];
        const dbTasks = resTasks.data || [];
        const dbProfiles = resProfiles.data || [];

        // --- Calculate System-Wide KPIs ---
        const totalTasks = dbTasks.length;
        const completedTasks = dbTasks.filter(t => t.status === 'Completed' || t.status === 'Approved');
        const onTimeTasks = completedTasks.filter(t => !t.due_date || new Date(t.completed_at || t.created_at) <= new Date(t.due_date));
        const reworkTasks = dbTasks.filter(t => t.is_rework === true);
        
        const onTimeRate = completedTasks.length > 0 ? Math.round((onTimeTasks.length / completedTasks.length) * 100) : 100;
        const qaPassRate = totalTasks > 0 ? Math.round(((totalTasks - reworkTasks.length) / totalTasks) * 100) : 100;
        
        let totalCycleHours = 0;
        completedTasks.forEach(t => {
            const start = new Date(t.created_at).getTime();
            const end = new Date(t.completed_at || new Date()).getTime();
            totalCycleHours += (end - start) / (1000 * 60 * 60);
        });
        const avgCycleTime = completedTasks.length > 0 ? (totalCycleHours / completedTasks.length).toFixed(1) : '0';

        setKpis([
          { id: 'kpi-1', label: isRTL ? 'المهام المنجزة' : 'Completed Tasks', value: `${completedTasks.length}`, trend: 12, insight: isRTL ? 'معدل الإنجاز العام عبر كافة المشاريع' : 'Overall completion across projects', details: isRTL ? 'إجمالي المهام المكتملة في النظام.' : 'Total tasks marked as completed.' },
          { id: 'kpi-2', label: isRTL ? 'معدل الإنجاز' : 'Completion Rate', value: `${totalTasks > 0 ? Math.round((completedTasks.length/totalTasks)*100) : 0}%`, trend: 5, insight: isRTL ? 'نسبة إغلاق المهام المفتوحة' : 'Ratio of closed to open tasks', details: isRTL ? 'نسبة المهام المنتهية من إجمالي المهام.' : 'Percentage of finished tasks.' },
          { id: 'kpi-3', label: isRTL ? 'الالتزام بالوقت' : 'On-Time Delivery', value: `${onTimeRate}%`, trend: 4, insight: isRTL ? 'مستوى تسليم الفرق للمهام قبل الموعد' : 'Team delivery before Due Date', details: isRTL ? 'نسبة المهام المسلمة قبل الموعد.' : 'Tasks delivered before due date.' },
          { id: 'kpi-4', label: isRTL ? 'معدل اجتياز الجودة' : 'QA Pass Rate', value: `${qaPassRate}%`, trend: 2, insight: isRTL ? 'نسبة المهام التي لم تتطلب إعادة عمل' : 'Tasks requiring no rework', details: isRTL ? 'المهام المقبولة من أول مرة.' : 'Tasks passed without rework.' },
        ]);

        // --- 🚀 تشكيل الفرق ديناميكياً (فقط للفرق النشطة) ---
        const dynamicTeams: Team[] = [];
        
        dbProjects.forEach(project => {
            const projectTasks = dbTasks.filter(t => t.project_id === project.id);
            
            // 🚀 هذا السطر السحري يمنع ظهور أي مشروع فارغ من المهام كفريق
            if (projectTasks.length === 0) return; 

            const uniqueTechIds = [...new Set(projectTasks.map(t => t.tech_id).filter(Boolean))];
            
            const teamMembers: TeamMember[] = uniqueTechIds.map(techId => {
                const techProfile = dbProfiles.find(p => p.id === techId);
                return {
                    id: String(techId),
                    name: techProfile?.full_name || (isRTL ? 'فني غير معروف' : 'Unknown Tech'),
                    role: techProfile?.job_title || techProfile?.role || 'Technician',
                    avatar: techProfile?.full_name?.charAt(0) || 'U'
                };
            });

            const managerNameStr = project.manager_name || (isRTL ? 'إدارة المشاريع' : 'PMO');
            
            const tCompleted = projectTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
            const tOnTime = projectTasks.filter(t => (t.status === 'Completed' || t.status === 'Approved') && (!t.due_date || new Date(t.completed_at || new Date()) <= new Date(t.due_date))).length;
            
            const tOnTimeRate = tCompleted > 0 ? Math.round((tOnTime / tCompleted) * 100) : 100;
            const tQaScoreAvg = projectTasks.length > 0 ? (projectTasks.reduce((acc, t) => acc + (Number(t.qa_score) || 10), 0) / projectTasks.length) : 10;
            const tQaPassRate = projectTasks.length > 0 ? Math.round((tQaScoreAvg / 10) * 100) : 0;
            
            const efficiency = projectTasks.length > 0 ? Math.round((tOnTimeRate + tQaPassRate + (tCompleted/projectTasks.length*100)) / 3) : 0;

            const activeTasks = projectTasks.length - tCompleted;
            let workloadStatus: 'Under' | 'Optimal' | 'Overloaded' = 'Under';
            if (activeTasks > teamMembers.length * 3 && teamMembers.length > 0) workloadStatus = 'Overloaded';
            else if (activeTasks > 0) workloadStatus = 'Optimal';

            const teamDisplayName = isRTL 
                ? `فريق م. ${managerNameStr.split(' ')[0]}` 
                : `Team ${managerNameStr.split(' ')[0]}`;

            dynamicTeams.push({
                id: project.id,
                name: teamDisplayName,
                projectName: project.title,
                managerName: managerNameStr,
                efficiency,
                completed: tCompleted,
                total: projectTasks.length,
                onTimeRate: tOnTimeRate,
                qaPassRate: tQaPassRate,
                workload: workloadStatus,
                risk: workloadStatus === 'Overloaded' ? (isRTL ? 'ضغط عمل وتأخير محتمل' : 'Delay Risk Due to Overload') : undefined,
                members: teamMembers
            });
        });

        setTeams(dynamicTeams.sort((a, b) => b.efficiency - a.efficiency));

        // --- Process Top Performers ---
        const formattedPerformers: Performer[] = dbProfiles.map(prof => {
            const userTasks = dbTasks.filter(t => t.tech_id === prof.id);
            const completed = userTasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
            
            if (completed === 0) return null; 

            const onTime = userTasks.filter(t => (t.status === 'Completed' || t.status === 'Approved') && (!t.due_date || new Date(t.completed_at || new Date()) <= new Date(t.due_date))).length;
            
            const uOnTimeRate = completed > 0 ? Math.round((onTime / completed) * 100) : 100;
            const uQaScore = userTasks.length > 0 ? (userTasks.reduce((acc, t) => acc + (Number(t.qa_score) || 10), 0) / userTasks.length) : 10;

            const lastTask = userTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            const activeProj = dbProjects.find(p => p.id === lastTask?.project_id);
            const teamNameStr = activeProj ? activeProj.title : (isRTL ? 'عمليات عامة' : 'General Ops');

            const activeTasksCount = userTasks.length - completed;
            const perfWorkload: 'High' | 'Balanced' = activeTasksCount > 5 ? 'High' : 'Balanced';

            return {
                id: prof.id,
                name: prof.full_name,
                role: prof.job_title || prof.role,
                team: teamNameStr,
                tasksCompleted: completed,
                qualityScore: Number(uQaScore.toFixed(1)),
                onTimeRate: uOnTimeRate,
                workload: perfWorkload
            } as Performer; 
        }).filter(Boolean) as Performer[]; 
        
        setPerformers(formattedPerformers.sort((a, b) => b.qualityScore - a.qualityScore || b.tasksCompleted - a.tasksCompleted).slice(0, 5));

      } catch (error: any) {
        console.error("Error fetching analytics:", error.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, isRTL, period]);

  // --- Handlers ---
  const handleOpenDrawer = (type: 'KPI' | 'Team' | 'Performer', data: any) => {
    setDrawerType(type);
    if (type === 'KPI') setSelectedKPI(data as KPI);
    if (type === 'Team') setSelectedTeam(data as Team);
    if (type === 'Performer') setSelectedPerformer(data as Performer);
    setIsDrawerOpen(true);
  };

  const handleExport = () => {
    alert(isRTL ? 'جاري تصدير تقرير الإنتاجية (PDF)...' : 'Exporting Productivity Report (PDF)...');
  };

  const filteredTeams = teamFilter === 'All' ? teams : teams.filter(t => t.name.toLowerCase().includes(teamFilter.toLowerCase()) || t.projectName.toLowerCase().includes(teamFilter.toLowerCase()));

  // --- UI Helpers ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  const TrendIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center text-xs font-bold ${value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
      {value >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
      {Math.abs(value)}%
    </span>
  );

  const WorkloadBadge = ({ level }: { level: string }) => {
      const colors: any = { 
          'Under': isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200', 
          'Optimal': isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200', 
          'Overloaded': isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200' 
      };
      const localizedLevel = isRTL ? { 'Under': 'متاح (طاقة مهدرة)', 'Optimal': 'مثالي', 'Overloaded': 'مضغوط (خطر)' }[level] : level;
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[level] || 'bg-slate-100'}`}>{localizedLevel}</span>;
  };

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Command Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <TrendingUp className="text-blue-600" />
              {isRTL ? 'استخبارات الإنتاجية والأداء' : 'Productivity Intelligence'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
              {isRTL ? 'تحليل مباشر لكفاءة الفرق الميدانية وتوزيع المهام' : 'Live analysis of field teams efficiency and task distribution'}
            </p>
          </div>
          
          <div className="flex gap-2">
             <div className={`rounded-xl px-3 py-1.5 flex items-center gap-2 border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                <Calendar size={14} className="text-slate-500"/>
                <span className="text-xs font-bold">{period}</span>
             </div>
             <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-lg flex items-center gap-2 transition active:scale-95">
                <Download size={16} /> {isRTL ? 'تصدير التقرير' : 'Export Report'}
             </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
            <button 
                onClick={() => setTeamFilter('All')} 
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${teamFilter === 'All' ? (isDark ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')}`}
            >
                {isRTL ? 'جميع المشاريع/الفرق' : 'All Teams'}
            </button>
            {/* Dynamic Project/Team Filters */}
            {teams.slice(0, 5).map(t => (
                <button 
                    key={t.id} 
                    onClick={() => setTeamFilter(t.projectName)} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${teamFilter === t.projectName ? (isDark ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')}`}
                >
                    {t.projectName}
                </button>
            ))}
        </div>
      </div>

      {/* --- Section 2: Executive KPI Grid --- */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
            <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={30}/></div>
        ) : kpis.map(kpi => (
            <div 
                key={kpi.id} 
                onClick={() => handleOpenDrawer('KPI', kpi)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all group ${cardBg} ${isDark ? 'hover:border-slate-600' : 'hover:shadow-md hover:border-slate-300'}`}
            >
                <div className={`text-xs font-bold mb-2 truncate ${textSub}`} title={kpi.label}>{kpi.label}</div>
                <div className="flex justify-between items-end">
                    <div className={`text-3xl font-black ${textMain}`}>{kpi.value}</div>
                    <TrendIndicator value={kpi.trend} />
                </div>
            </div>
        ))}
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* --- Section 3: Dynamic Teams Efficiency --- */}
        <div className={`xl:col-span-2 rounded-2xl border shadow-sm overflow-hidden flex flex-col ${cardBg}`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`font-bold text-lg flex items-center gap-2 ${textMain}`}>
                    <Users className="text-blue-600" size={20}/> {isRTL ? 'كفاءة المشاريع (الفرق الديناميكية)' : 'Dynamic Teams Efficiency'}
                </h3>
            </div>
            <div className={`divide-y flex-1 overflow-y-auto ${isDark ? 'divide-slate-800/50' : 'divide-slate-50'}`}>
                {filteredTeams.length === 0 && !loading ? (
                    <div className="p-10 text-center text-slate-500">{isRTL ? 'لا توجد مشاريع نشطة حالياً.' : 'No active projects found.'}</div>
                ) : filteredTeams.map(team => (
                    <div 
                        key={team.id} 
                        onClick={() => handleOpenDrawer('Team', team)}
                        className={`p-5 transition cursor-pointer group ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className={`font-bold text-lg ${textMain}`}>{team.name}</div>
                                <div className={`text-xs mt-1 font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{isRTL ? 'مشروع:' : 'Project:'} {team.projectName}</div>
                                <div className={`text-xs mt-1 ${textSub}`}>{team.completed} / {team.total} {isRTL ? 'مهمة منجزة' : 'Tasks Done'}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <WorkloadBadge level={team.workload} />
                                {team.risk && <div className="text-[10px] text-red-500 font-bold flex items-center gap-1"><AlertTriangle size={12}/> {team.risk}</div>}
                            </div>
                        </div>
                        
                        {/* Efficiency Bar */}
                        <div className="space-y-1.5">
                            <div className={`flex justify-between text-xs font-bold ${textSub}`}>
                                <span>{isRTL ? 'الكفاءة العامة (مزيج الجودة والوقت)' : 'Overall Efficiency'}</span>
                                <span className={textMain}>{team.efficiency}%</span>
                            </div>
                            <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <div className={`h-full rounded-full ${team.efficiency >= 90 ? 'bg-emerald-500' : team.efficiency >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${team.efficiency}%` }}></div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className={`grid grid-cols-2 gap-4 mt-5 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
                            <div>
                                <span className={`block text-[10px] uppercase font-bold mb-1 ${textSub}`}>{isRTL ? 'الالتزام بالوقت' : 'On-Time'}</span>
                                <span className={`font-black text-sm ${textMain}`}>{team.onTimeRate}%</span>
                            </div>
                            <div>
                                <span className={`block text-[10px] uppercase font-bold mb-1 ${textSub}`}>{isRTL ? 'معدل الجودة' : 'QA Pass'}</span>
                                <span className={`font-black text-sm ${textMain}`}>{team.qaPassRate}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- Section 4: Performance Leaders --- */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col ${cardBg}`}>
            <div className={`p-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`font-bold text-lg flex items-center gap-2 ${textMain}`}>
                    <ShieldCheck className="text-emerald-500" size={20}/> {isRTL ? 'أفضل الفنيين أداءً' : 'Top Performers'}
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {performers.length === 0 && !loading ? (
                    <div className="text-center text-slate-500">{isRTL ? 'لا توجد مهام منجزة لتقييم الأداء.' : 'No completed tasks to evaluate.'}</div>
                ) : performers.map((user, idx) => (
                    <div 
                        key={user.id} 
                        onClick={() => handleOpenDrawer('Performer', user)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer group ${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-sm'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700/50' : isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-600 border-slate-200'}`}>
                                {idx + 1}
                            </div>
                            <div>
                                <div className={`font-bold text-sm transition ${textMain} ${isDark ? 'group-hover:text-emerald-400' : 'group-hover:text-emerald-600'}`}>{user.name}</div>
                                <div className={`text-xs ${textSub}`}>{user.team}</div>
                            </div>
                        </div>
                        <div className={`text-right ${isRTL ? 'text-left' : 'text-right'}`}>
                            <div className="text-lg font-black text-emerald-500">{user.qualityScore}</div>
                            <div className={`text-[9px] font-bold uppercase ${textSub}`}>{isRTL ? 'الجودة' : 'QA Score'}</div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* AI Insight Box */}
            <div className={`p-5 border-t ${isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase mb-2">
                    <BrainCircuit size={16}/> {isRTL ? 'تحليل النظام الذكي' : 'System Insight'}
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>
                    {isRTL 
                        ? 'الفرق يتم تشكيلها برمجياً بناءً على المشاريع. الإحصائيات مستمدة مباشرة من إغلاق المهام وتقييمات الجودة المسجلة.'
                        : 'Teams are dynamically formed based on project assignments. Stats are pulled directly from closed tasks and QA scores.'}
                </p>
            </div>
        </div>

      </div>

      {/* --- Section 6: Details Drawer --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
                
                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <h3 className={`font-bold text-lg ${textMain}`}>
                        {drawerType === 'KPI' && (isRTL ? 'تفاصيل المؤشر' : 'KPI Details')}
                        {drawerType === 'Team' && (isRTL ? 'تحليل الفريق والمشروع' : 'Team & Project Analysis')}
                        {drawerType === 'Performer' && (isRTL ? 'سجل أداء الفني' : 'Tech Performance')}
                    </h3>
                    <button onClick={() => setIsDrawerOpen(false)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    
                    {/* KPI Details */}
                    {drawerType === 'KPI' && selectedKPI && (
                        <div className="space-y-6">
                            <div className={`text-center py-8 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-sm font-bold mb-3 ${textSub}`}>{selectedKPI.label}</div>
                                <div className={`text-5xl font-black mb-4 ${textMain}`}>{selectedKPI.value}</div>
                                <div className={`inline-block px-4 py-1.5 rounded-full border shadow-sm ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}><TrendIndicator value={selectedKPI.trend}/></div>
                            </div>
                            <div>
                                <h4 className={`font-bold mb-2 text-sm ${textMain}`}>{isRTL ? 'التحليل الاستنتاجي' : 'Insight'}</h4>
                                <div className={`flex gap-3 items-start p-4 rounded-xl border ${isDark ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100'}`}>
                                    <Activity size={18} className="text-blue-500 mt-0.5 shrink-0"/>
                                    <p className={`text-sm leading-relaxed ${isDark ? 'text-blue-200' : 'text-slate-700'}`}>{selectedKPI.insight}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Team Details */}
                    {drawerType === 'Team' && selectedTeam && (
                        <div className="space-y-6">
                            <div className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl border ${isDark ? 'bg-slate-700 text-blue-400 border-slate-600' : 'bg-white text-blue-600 border-slate-200'}`}>
                                    {selectedTeam.managerName.charAt(0)}
                                </div>
                                <div>
                                    <div className={`font-bold text-lg ${textMain}`}>{selectedTeam.name}</div>
                                    <div className={`text-xs mt-1 font-bold ${textSub}`}>{selectedTeam.projectName}</div>
                                </div>
                            </div>

                            {/* Team Members List */}
                            <div>
                                <h4 className={`font-bold mb-3 text-sm flex items-center gap-2 ${textMain}`}>
                                    <Users size={16} className="text-blue-500"/> {isRTL ? 'الفنيين في هذا المشروع' : 'Techs in Project'}
                                </h4>
                                <div className="space-y-2">
                                    {selectedTeam.members.map((member, i) => (
                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-100'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${isDark ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {member.avatar}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${textMain}`}>{member.name}</div>
                                                <div className={`text-xs ${textSub}`}>{member.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedTeam.members.length === 0 && (
                                        <div className={`text-xs text-center p-4 ${textSub}`}>{isRTL ? 'لا يوجد أعضاء' : 'No members'}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performer Details */}
                    {drawerType === 'Performer' && selectedPerformer && (
                        <div className="space-y-6">
                            <div className="text-center py-6">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-4 border-4 shadow-lg ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-400 border-white'}`}>
                                    {selectedPerformer.name.charAt(0)}
                                </div>
                                <h3 className={`font-bold text-xl ${textMain}`}>{selectedPerformer.name}</h3>
                                <p className={`text-sm mt-1 font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{selectedPerformer.team}</p>
                            </div>

                            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <span className={textSub}>{isRTL ? 'المهام المنجزة' : 'Tasks Done'}</span>
                                    <span className={`font-black text-lg ${textMain}`}>{selectedPerformer.tasksCompleted}</span>
                                </div>
                                <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <span className={textSub}>{isRTL ? 'تقييم الجودة' : 'Quality Score'}</span>
                                    <span className="font-black text-lg text-emerald-500">{selectedPerformer.qualityScore} <span className="text-xs text-slate-400">/ 10</span></span>
                                </div>
                                <div className={`flex justify-between items-center pb-1`}>
                                    <span className={textSub}>{isRTL ? 'الالتزام بالوقت' : 'On-Time Delivery'}</span>
                                    <span className={`font-black text-lg ${textMain}`}>{selectedPerformer.onTimeRate}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-5 border-t ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                    <button onClick={() => setIsDrawerOpen(false)} className={`w-full py-3 rounded-xl font-bold text-sm transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                        {isRTL ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
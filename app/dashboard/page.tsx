'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 
import useSWR from 'swr'; 
import { 
  Users, Wallet, Briefcase, Activity, CheckCircle2, 
  Clock, AlertTriangle, MapPin, Calendar, 
  ArrowLeft, ArrowRight, ShieldCheck, Filter, ChevronLeft,
  ChevronRight, Home, Plus, Video, Receipt, ChevronDown, Inbox, 
  BrainCircuit, History
} from 'lucide-react';
import { useDashboard } from './layout'; 
import { motion, AnimatePresence } from 'framer-motion';

// --- Types Definitions (حل أخطاء الـ TypeScript) ---
interface DashboardStat {
  id: string;
  label: string; 
  value: string; 
  color: string; 
  icon: any;
  link?: string; 
}

interface LogEntry {
  action: string;
  user_name: string;
  created_at: string;
}

interface AIRecommendation {
  type: 'critical' | 'warning' | 'success' | 'info';
  text: string;
}

interface TaskEntry {
  id: string;
  status: string;
  created_at: string;
  projects?: { title: string } | null;
  profiles?: { full_name: string } | null;
}

interface FetcherResult {
  stats: DashboardStat[];
  activeModules: string[];
  recentLogs: LogEntry[];
  aiRecommendations: AIRecommendation[];
  recentTasks: TaskEntry[];
}

// 🚀 دالة جلب البيانات الخاصة بـ SWR 
const fetcher = async (role: string, lang: string, t: any): Promise<FetcherResult> => {
    const isRTL = lang === 'ar';
    const dynamicStats: DashboardStat[] = [];
    
    // تعريف المتغيرات بأنواع محددة بدلاً من any[] لحل أخطاء الشاشة
    let recentLogs: LogEntry[] = [];
    let aiRecommendations: AIRecommendation[] = [];
    let recentTasks: TaskEntry[] = [];
    let activeModules: string[] = [];

    try {
        const { data: plugins } = await supabase.from('system_plugins').select('plugin_key').eq('is_active', true);
        const activeKeys = plugins?.map(p => p.plugin_key) || [];
        activeModules = activeKeys;

        if (role === 'super_admin' || role === 'admin') {
            const [
                { count: usersCount },
                { count: activeProjectsCount },
                { count: workingTeamsCount }, // 🚀 جلب العدد مباشرة (كل مهمة غير مكتملة = فرقة عاملة)
                { count: requestsCount },
                { data: sysLogs }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('projects').select('*', { count: 'exact', head: true }).ilike('status', '%activ%'),
                supabase.from('task_assignments').select('*', { count: 'exact', head: true }).neq('status', 'Completed').neq('status', 'Cancelled'),
                supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('status', 'Unread').eq('is_actionable', true),
                supabase.from('notification_logs').select('action, user_name, created_at').order('created_at', { ascending: false }).limit(5)
            ]);

            dynamicStats.push({ id: 's1', label: t.kpi.users, value: usersCount?.toString() || '0', color: 'blue', icon: Users, link: '/dashboard/users' });
            dynamicStats.push({ id: 's2', label: t.kpi.projects, value: activeProjectsCount?.toString() || '0', color: 'purple', icon: Briefcase, link: '/dashboard/projects/list' });
            dynamicStats.push({ id: 's3', label: t.kpi.workingTeams, value: workingTeamsCount?.toString() || '0', color: 'emerald', icon: Activity, link: '/dashboard/projects/team' }); 
            dynamicStats.push({ id: 's4', label: t.kpi.requests, value: requestsCount?.toString() || '0', color: 'amber', icon: Inbox, link: '/dashboard/operations/requests' }); 

            if (sysLogs) {
                 recentLogs = sysLogs.map(log => ({
                     action: log.action || '',
                     user_name: log.user_name || 'System',
                     created_at: log.created_at || ''
                 }));
            }

            const aiRecs: AIRecommendation[] = [];
            if (activeProjectsCount === 0) aiRecs.push({ type: 'warning', text: isRTL ? 'لا توجد مشاريع نشطة حالياً، ننصح بمراجعة إدارة المبيعات.' : 'No active projects.' });
            if (requestsCount && requestsCount > 5) aiRecs.push({ type: 'critical', text: isRTL ? `يوجد تراكم في الطلبات المعلقة (${requestsCount}). يرجى اتخاذ إجراء.` : `High volume of pending requests.` });
            if (workingTeamsCount && workingTeamsCount > 0) aiRecs.push({ type: 'success', text: isRTL ? `يوجد حالياً ${workingTeamsCount} فرق ميدانية تعمل، معدل الانخراط ممتاز.` : `Field team engagement is optimal.` });
            if(aiRecs.length === 0) aiRecs.push({ type: 'info', text: isRTL ? 'النظام مستقر ولا توجد ملاحظات حرجة.' : 'System is stable.' });
            aiRecommendations = aiRecs;

        } 
        else if (role === 'project_manager') {
            const [
                { count: activeProjects },
                { count: teamCount }
            ] = await Promise.all([
                supabase.from('projects').select('*', { count: 'exact', head: true }).ilike('status', '%activ%'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['technician', 'engineer'])
            ]);

            dynamicStats.push({ id: 'p1', label: t.kpi.projects, value: activeProjects?.toString() || '0', color: 'blue', icon: Briefcase, link: '/dashboard/projects/list' });
            dynamicStats.push({ id: 'p2', label: t.kpi.team, value: teamCount?.toString() || '0', color: 'emerald', icon: Users, link: '/dashboard/projects/team' });
            dynamicStats.push({ id: 'p3', label: t.kpi.tasks, value: '0', color: 'amber', icon: CheckCircle2, link: '/dashboard/projects/progress' });
            dynamicStats.push({ id: 'p4', label: t.kpi.efficiency, value: '0%', color: 'purple', icon: Activity });
        } 
        else {
            dynamicStats.push({ id: 't1', label: t.kpi.tasks, value: '0', color: 'blue', icon: CheckCircle2 });
            dynamicStats.push({ id: 't2', label: t.kpi.safety, value: '100%', color: 'green', icon: ShieldCheck });
            dynamicStats.push({ id: 't3', label: t.kpi.deadline, value: '--', color: 'red', icon: Calendar });
        }

        const { data: latestTasks } = await supabase
            .from('task_assignments')
            .select(`id, status, created_at, projects(title), profiles!tech_id(full_name)`)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (latestTasks) {
             recentTasks = latestTasks.map((task: any) => ({
                 id: task.id,
                 status: task.status,
                 created_at: task.created_at,
                 projects: task.projects,
                 profiles: task.profiles
             }));
        }

        return {
            stats: dynamicStats.slice(0, 4),
            activeModules,
            recentLogs,
            aiRecommendations,
            recentTasks
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export default function DashboardPage() {
  const { isDark, lang, user, loadingUser } = useDashboard(); 
  const router = useRouter();
  
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);

  const isRTL = lang === 'ar';
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;
  const BreadcrumbArrow = isRTL ? ChevronLeft : ChevronRight;

  const t = {
    ar: {
      welcome: 'مرحباً،',
      desc: {
        super_admin: 'مركز الحوكمة والتحكم الشامل بالنظام.',
        admin: 'لوحة القيادة والإدارة العامة.',
        project_manager: 'لوحة متابعة المشاريع الميدانية وسير العمل.',
        engineer: 'إدارة المهام الفنية والتقارير الهندسية.',
        technician: 'جدول المهام اليومي الميداني.',
        accountant: 'الإدارة المالية والمحاسبة.'
      },
      kpi: {
        projects: 'المشاريع النشطة', team: 'أعضاء الفريق', tasks: 'المهام المعلقة', efficiency: 'معدل الإنجاز',
        users: 'إجمالي المستخدمين', workingTeams: 'الفرق العاملة', alerts: 'التنبيهات', requests: 'طلبات المشاريع', safety: 'الجودة والسلامة', deadline: 'الموعد القادم'
      },
      sections: { logs: 'سجل أحدث العمليات على النظام', tasks: 'آخر المهام المُسندة', ai: 'توصيات الذكاء الاصطناعي (AI)', quick: 'إجراءات سريعة' },
      actions: { quickAdd: 'إجراء سريع', newProject: 'مشروع جديد', newTask: 'مهمة جديدة', newMeeting: 'اجتماع جديد', newInvoice: 'فاتورة جديدة', viewAll: 'عرض الكل' },
      breadcrumbs: { home: 'الرئيسية', dashboard: 'لوحة التحكم' }
    },
    en: {
      welcome: 'Welcome back,',
      desc: {
        super_admin: 'System Governance Center.',
        admin: 'General Administration Dashboard.',
        project_manager: 'Project Workflow & Field Monitoring.',
        engineer: 'Technical Task Management.',
        technician: 'Daily Field Tasks.',
        accountant: 'Financial Management.'
      },
      kpi: {
        projects: 'Active Projects', team: 'Team Members', tasks: 'Pending Tasks', efficiency: 'Completion Rate',
        users: 'Total Users', workingTeams: 'Working Teams', alerts: 'Alerts', requests: 'Project Requests', safety: 'QA & Safety', deadline: 'Next Deadline'
      },
      sections: { logs: 'Recent System Activity', tasks: 'Recent Assigned Tasks', ai: 'AI Recommendations', quick: 'Quick Actions' },
      actions: { quickAdd: 'Quick Add', newProject: 'New Project', newTask: 'New Task', newMeeting: 'New Meeting', newInvoice: 'New Invoice', viewAll: 'View All' },
      breadcrumbs: { home: 'Home', dashboard: 'Dashboard' }
    }
  };

  const content = t[lang];

  // 🚀 تطبيق SWR للكاشينج والسرعة (تم إضافة as string لحل خطأ TypeScript)
  const { data, isLoading } = useSWR<FetcherResult>(
    user && !loadingUser ? ['dashboardData', user.role, lang] : null,
    ([_, role]) => fetcher(role as string, lang, content),
    {
      revalidateOnFocus: false, 
      dedupingInterval: 60000 
    }
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAdd(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  if (loadingUser || isLoading) return <div className="h-full flex items-center justify-center p-10"><span className="animate-pulse text-blue-500 font-bold text-lg">جاري التحليل واستخراج البيانات الحقيقية...</span></div>;

  const { stats = [], activeModules = [], recentLogs = [], aiRecommendations = [], recentTasks = [] } = data || {};
  const firstName = user?.full_name?.split(' ')[0] || 'User';
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      
      <nav className="flex items-center gap-2 text-sm font-bold">
          <Home size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
          <span className={textSub}>{content.breadcrumbs.home}</span>
          <BreadcrumbArrow size={14} className={textSub}/>
          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>{content.breadcrumbs.dashboard}</span>
      </nav>

      <div className={`p-8 rounded-[2rem] border relative overflow-visible flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none ${isDark ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
        
        <div className="relative z-10">
          <h2 className={`text-3xl font-black mb-2 ${textMain}`}>
            {content.welcome} <span className="text-blue-500">{firstName}!</span> 👋
          </h2>
          <p className={`text-sm max-w-lg leading-relaxed ${textSub}`}>
            {(content.desc as any)[user?.role || 'project_manager']}
          </p>
        </div>

        {!isSuperAdmin && user?.role !== 'technician' && (
            <div className="relative z-20" ref={quickAddRef}>
                <button 
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-transform hover:-translate-y-1"
                >
                    <Plus size={18}/> {content.actions.quickAdd} <ChevronDown size={14} className={`transition-transform ml-1 ${showQuickAdd ? 'rotate-180' : ''}`}/>
                </button>

                <AnimatePresence>
                    {showQuickAdd && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute top-full mt-2 w-48 rounded-xl shadow-2xl border overflow-hidden z-50 ${isRTL ? 'left-0' : 'right-0'} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                        >
                            <div className="p-1">
                                {activeModules.includes('operations') && (
                                    <Link href="/dashboard/projects/create" className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-bold transition ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}>
                                        <Briefcase size={16} className="text-blue-500"/> {content.actions.newProject}
                                    </Link>
                                )}
                                {activeModules.includes('operations') && (
                                    <Link href="/dashboard/projects/assign" className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-bold transition ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}>
                                        <CheckCircle2 size={16} className="text-purple-500"/> {content.actions.newTask}
                                    </Link>
                                )}
                                {activeModules.includes('comms') && (
                                    <Link href="/dashboard/communication/meetings" className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm font-bold transition ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}`}>
                                        <Video size={16} className="text-amber-500"/> {content.actions.newMeeting}
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
            stat.link ? (
                <Link href={stat.link} key={stat.id} className="block">
                    <div className={`p-6 rounded-3xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-1 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3.5 rounded-2xl ${
                                stat.color === 'blue' ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') :
                                stat.color === 'emerald' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                                stat.color === 'purple' ? (isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600') :
                                stat.color === 'amber' ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600') :
                                (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                            }`}>
                                <stat.icon size={24} />
                            </div>
                            <DirectionalArrow size={16} className={`opacity-50 transition-transform ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${textSub}`}>{stat.label}</p>
                            <h4 className={`text-2xl font-black ${textMain}`}>{stat.value}</h4>
                        </div>
                    </div>
                </Link>
            ) : (
                <div key={stat.id} className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3.5 rounded-2xl ${
                            stat.color === 'blue' ? (isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600') :
                            stat.color === 'emerald' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                            stat.color === 'purple' ? (isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600') :
                            stat.color === 'amber' ? (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600') :
                            (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                        }`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${textSub}`}>{stat.label}</p>
                        <h4 className={`text-2xl font-black ${textMain}`}>{stat.value}</h4>
                    </div>
                </div>
            )
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            
            {isSuperAdmin ? (
              <div className={`rounded-3xl border overflow-hidden relative ${cardBg}`}>
                  <div className="p-6 flex justify-between items-center border-b border-inherit">
                    <h3 className={`font-bold flex items-center gap-2 ${textMain}`}>
                      <History className="text-blue-500" size={20}/> {content.sections.logs}
                    </h3>
                  </div>
                  <div className="p-0">
                      {recentLogs.length === 0 ? (
                          <div className="text-center py-10"><p className="text-slate-400 text-sm">لا توجد عمليات مسجلة حديثاً</p></div>
                      ) : (
                          <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                              {recentLogs.map((log, i) => (
                                  <div key={i} className={`p-4 flex items-center justify-between transition ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{log.user_name?.charAt(0) || 'S'}</div>
                                          <div>
                                              <p className={`text-sm font-bold ${textMain}`}>{log.action}</p>
                                              <p className={`text-xs ${textSub}`}>{isRTL ? 'بواسطة:' : 'By:'} {log.user_name}</p>
                                          </div>
                                      </div>
                                      <div className={`text-[10px] font-mono ${textSub}`}>{new Date(log.created_at).toLocaleString()}</div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
            ) : null}

            <div className={`rounded-3xl border p-6 ${cardBg}`}>
                <div className="flex justify-between items-center mb-6 border-b border-inherit pb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${textMain}`}>
                    <CheckCircle2 className="text-purple-500" size={20}/> {content.sections.tasks}
                  </h3>
                  <Link href="/dashboard/projects/progress" className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1">
                      {content.actions.viewAll} <DirectionalArrow size={14}/>
                  </Link>
                </div>
                <div>
                    {recentTasks.length === 0 ? (
                        <div className="text-center py-10"><p className="text-slate-400 text-sm">لا توجد مهام حديثة</p></div>
                    ) : (
                        <div className="space-y-3">
                            {recentTasks.map((task) => (
                                <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                                            <Briefcase size={18} className="text-blue-500"/>
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold truncate max-w-[200px] md:max-w-xs ${textMain}`}>
                                                {task.projects?.title || 'مهمة عامة'}
                                            </p>
                                            <p className={`text-xs ${textSub}`}>
                                                {isRTL ? 'مسندة إلى:' : 'Assigned to:'} {task.profiles?.full_name || 'غير محدد'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-8">
             {isSuperAdmin ? (
                 <div className={`rounded-3xl border p-6 ${cardBg}`}>
                    <h3 className={`font-bold flex items-center gap-2 mb-6 ${textMain}`}>
                        <BrainCircuit className="text-purple-500" size={20}/> {content.sections.ai}
                    </h3>
                    <div className="space-y-3">
                        {aiRecommendations.map((rec, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${
                                rec.type === 'critical' ? (isDark ? 'bg-red-900/10 border-red-900/50' : 'bg-red-50 border-red-100') :
                                rec.type === 'warning' ? (isDark ? 'bg-amber-900/10 border-amber-900/50' : 'bg-amber-50 border-amber-100') :
                                rec.type === 'success' ? (isDark ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100') :
                                (isDark ? 'bg-blue-900/10 border-blue-900/50' : 'bg-blue-50 border-blue-100')
                            }`}>
                                <div className="mt-0.5">
                                    {rec.type === 'critical' ? <AlertTriangle size={16} className="text-red-500"/> :
                                     rec.type === 'warning' ? <AlertTriangle size={16} className="text-amber-500"/> :
                                     rec.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-500"/> :
                                     <Info size={16} className="text-blue-500"/>}
                                </div>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{rec.text}</p>
                            </div>
                        ))}
                    </div>
                 </div>
             ) : (
                <div className={`rounded-3xl border p-6 ${cardBg} min-h-[200px] flex items-center justify-center`}>
                    <div className="text-center">
                        <ShieldCheck className="mx-auto text-slate-300 mb-2" size={32}/>
                        <p className="text-slate-400 text-sm">لا توجد تنبيهات أمان جديدة</p>
                    </div>
                </div>
             )}
        </div>
      </div>
    </div>
  );
}

function Info({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>;
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // 👈 استدعاء Supabase
import { 
  Users, Wallet, Briefcase, Activity, CheckCircle2, 
  Clock, AlertTriangle, MapPin, Calendar, 
  ArrowLeft, ArrowRight, ShieldCheck, LayoutDashboard, Filter
} from 'lucide-react';
import { useDashboard } from './layout'; 

// تعريف نوع البيانات
interface DashboardStats {
  kpi1: { label: string; value: string; trend?: string; color: string; icon: any };
  kpi2: { label: string; value: string; trend?: string; color: string; icon: any };
  kpi3: { label: string; value: string; trend?: string; color: string; icon: any };
  kpi4: { label: string; value: string; trend?: string; color: string; icon: any };
}

export default function DashboardPage() {
  const { isDark, lang, user, loadingUser } = useDashboard(); 
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const isRTL = lang === 'ar';
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;

  const t = {
    ar: {
      welcome: 'مرحباً،',
      desc: {
        super_admin: 'مركز الحوكمة والتحكم الشامل بالنظام.',
        project_manager: 'لوحة متابعة المشاريع الميدانية وسير العمل.',
        engineer: 'إدارة المهام الفنية والتقارير الهندسية.',
        technician: 'جدول المهام اليومي.',
        accountant: 'الإدارة المالية والمحاسبة.'
      },
      kpi: {
        projects: 'المشاريع النشطة', team: 'أعضاء الفريق', tasks: 'المهام المعلقة', efficiency: 'معدل الإنجاز',
        users: 'المستخدمين', revenue: 'الإيرادات', alerts: 'التنبيهات', attendance: 'الحضور', safety: 'السلامة', deadline: 'الموعد القادم'
      },
      sections: { map: 'خريطة المشاريع المباشرة', tasks: 'آخر المهام', quick: 'إجراءات سريعة' },
      actions: { newProject: 'إنشاء مشروع جديد', checkIn: 'تسجيل دخول', viewAll: 'عرض الكل' }
    },
    en: {
      welcome: 'Welcome back,',
      desc: {
        super_admin: 'System Governance Center.',
        project_manager: 'Project Workflow & Field Monitoring.',
        engineer: 'Technical Task Management.',
        technician: 'Daily Tasks.',
        accountant: 'Financial Management.'
      },
      kpi: {
        projects: 'Active Projects', team: 'Team Members', tasks: 'Pending Tasks', efficiency: 'Completion Rate',
        users: 'Active Users', revenue: 'Revenue', alerts: 'Alerts', attendance: 'Attendance', safety: 'Safety', deadline: 'Next Deadline'
      },
      sections: { map: 'Live Project Map', tasks: 'Recent Tasks', quick: 'Quick Actions' },
      actions: { newProject: 'New Project', checkIn: 'Check-In', viewAll: 'View All' }
    }
  };

  const content = t[lang];

  // --- 🔥 جلب البيانات الحقيقية من Supabase ---
  useEffect(() => {
    if (loadingUser || !user) return;

    const fetchRealStats = async () => {
        setLoadingStats(true);
        const role = user.role;
        let kpiData: any = {};

        try {
            if (role === 'super_admin') {
                // جلب عدد المستخدمين
                const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                // جلب عدد المشاريع
                const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
                
                kpiData = {
                    kpi1: { label: content.kpi.users, value: usersCount?.toString() || '0', color: 'blue', icon: Users },
                    kpi2: { label: content.kpi.revenue, value: '---', color: 'emerald', icon: Wallet }, // يحتاج جدول مالية
                    kpi3: { label: content.kpi.projects, value: projectsCount?.toString() || '0', color: 'purple', icon: Briefcase },
                    kpi4: { label: content.kpi.alerts, value: '0', color: 'red', icon: AlertTriangle },
                };
            } else if (role === 'project_manager') {
                // جلب عدد المشاريع النشطة فقط
                const { count: activeProjects } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active');
                
                // جلب عدد الفنيين (كمثال)
                const { count: teamCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['technician', 'engineer']);

                kpiData = {
                    kpi1: { label: content.kpi.projects, value: activeProjects?.toString() || '0', color: 'blue', icon: Briefcase },
                    kpi2: { label: content.kpi.team, value: teamCount?.toString() || '0', color: 'emerald', icon: Users },
                    kpi3: { label: content.kpi.tasks, value: '0', color: 'amber', icon: CheckCircle2 }, // يحتاج جدول مهام
                    kpi4: { label: content.kpi.efficiency, value: '0%', color: 'purple', icon: Activity },
                };
            } else {
                // الفنيين والمهندسين
                kpiData = {
                    kpi1: { label: content.kpi.tasks, value: '0', color: 'blue', icon: CheckCircle2 },
                    kpi2: { label: content.kpi.attendance, value: '--:--', color: 'emerald', icon: Clock },
                    kpi3: { label: content.kpi.safety, value: '100%', color: 'green', icon: ShieldCheck },
                    kpi4: { label: content.kpi.deadline, value: '--', color: 'red', icon: Calendar },
                };
            }
            setStats(kpiData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStats(false);
        }
    };

    fetchRealStats();
  }, [user, lang, loadingUser]);

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  if (loadingUser || loadingStats) return <div className="h-full flex items-center justify-center p-10"><span className="animate-pulse text-slate-400">جاري تحميل البيانات...</span></div>;

  const firstName = user?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
      
      {/* Welcome Card */}
      <div className={`p-8 rounded-[2rem] border relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 ${isDark ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
        
        <div className="relative z-10">
          <h2 className={`text-3xl font-black mb-2 ${textMain}`}>
            {content.welcome} <span className="text-blue-500">{firstName}!</span> 👋
          </h2>
          <p className={`text-sm max-w-lg leading-relaxed ${textSub}`}>
            {(content.desc as any)[user?.role || 'project_manager']}
          </p>
        </div>

        <div className="relative z-10">
             {user?.role !== 'technician' && (
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-transform hover:-translate-y-1">
                  <LayoutDashboard size={18}/> {content.actions.newProject}
                </button>
             )}
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard isDark={isDark} data={stats.kpi1} />
          <StatCard isDark={isDark} data={stats.kpi2} />
          <StatCard isDark={isDark} data={stats.kpi3} />
          <StatCard isDark={isDark} data={stats.kpi4} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            {/* Map Placeholder */}
            {user?.role !== 'technician' && (
              <div className={`rounded-3xl border overflow-hidden relative group ${cardBg}`}>
                  <div className="p-6 flex justify-between items-center border-b border-slate-100/10">
                    <h3 className={`font-bold flex items-center gap-2 ${textMain}`}>
                      <MapPin className="text-blue-500" size={20}/> {content.sections.map}
                    </h3>
                    <button className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1">
                      {content.actions.viewAll} <DirectionalArrow size={14}/>
                    </button>
                  </div>
                  <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                      <div className="text-center">
                          <MapPin className="mx-auto text-slate-300 mb-2" size={32}/>
                          <p className="text-slate-400 text-sm">لا توجد مشاريع نشطة على الخريطة حالياً</p>
                      </div>
                  </div>
              </div>
            )}

            {/* Recent Tasks */}
            <div className={`rounded-3xl border p-6 ${cardBg}`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`font-bold flex items-center gap-2 ${textMain}`}>
                    <CheckCircle2 className="text-purple-500" size={20}/> {content.sections.tasks}
                  </h3>
                  <button className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                    <Filter size={18} className={textSub}/>
                  </button>
                </div>
                <div className="text-center py-10">
                    <p className="text-slate-400 text-sm">لا توجد مهام حديثة</p>
                </div>
            </div>
        </div>

        <div className="space-y-8">
             <div className={`rounded-3xl border p-6 ${cardBg} min-h-[200px] flex items-center justify-center`}>
                <div className="text-center">
                    <ShieldCheck className="mx-auto text-slate-300 mb-2" size={32}/>
                    <p className="text-slate-400 text-sm">لا توجد تنبيهات أمان جديدة</p>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ data, isDark }: { data: any, isDark: boolean }) {
  const colorMap: any = {
    blue: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    purple: isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600',
    amber: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
    red: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
    green: isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600',
  };
  const Icon = data.icon;
  return (
    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3.5 rounded-2xl ${colorMap[data.color]}`}><Icon size={24} /></div>
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{data.label}</p>
        <h4 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.value}</h4>
      </div>
    </div>
  );
}
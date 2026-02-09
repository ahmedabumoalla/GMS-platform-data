'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Wallet, Briefcase, Activity, CheckCircle2, 
  Clock, AlertTriangle, TrendingUp, MapPin, Calendar, 
  ArrowLeft, ArrowRight, ShieldCheck, LayoutDashboard,
  Filter, FileText, ChevronDown
} from 'lucide-react';
// استدعاء الكونتكست من ملف اللاي أوت
import { useDashboard } from './layout'; 

// --- Types & Role Definitions ---
// يمكنك تغيير الدور الافتراضي هنا أو جلبه من الـ API
type UserRole = 'super_admin' | 'project_manager' | 'technician';

interface DashboardStats {
  kpi1: { label: string; value: string; trend?: string; color: string; icon: any };
  kpi2: { label: string; value: string; trend?: string; color: string; icon: any };
  kpi3: { label: string; value: string; trend?: string; color: string; icon: any };
  kpi4: { label: string; value: string; trend?: string; color: string; icon: any };
}

export default function DashboardPage() {
  const { isDark, lang } = useDashboard(); 
  
  // ✅ تثبيت الدور هنا (يمكنك تغييره إلى 'super_admin' أو جلبه من جلسة المستخدم)
  const [role] = useState<UserRole>('project_manager'); 
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const isRTL = lang === 'ar';
  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;

  // --- Dictionary (Content) ---
  const t = {
    ar: {
      welcome: 'مرحباً،',
      role: {
        super_admin: 'مدير النظام (Super Admin)',
        project_manager: 'مدير المشاريع',
        technician: 'فني ميداني'
      },
      desc: {
        super_admin: 'مركز الحوكمة، الأمان، وإدارة النظام الشاملة.',
        project_manager: 'متابعة سير العمل، الفرق الميدانية، واعتماد الطلبات.',
        technician: 'جدول المهام اليومي، تسجيل الحضور، وتقارير السلامة.'
      },
      kpi: {
        users: 'المستخدمين النشطين',
        revenue: 'الإيرادات',
        projects: 'المشاريع',
        alerts: 'تنبيهات النظام',
        team: 'الفريق الميداني',
        tasks: 'المهام المعلقة',
        efficiency: 'الكفاءة',
        attendance: 'سجل الحضور',
        safety: 'الامتثال للسلامة',
        deadline: 'الموعد القادم'
      },
      sections: {
        map: 'التتبع الميداني المباشر',
        tasks: 'قائمة المهام والعمليات',
        approvals: 'طلبات بانتظار الاعتماد',
        security: 'سجل الأمان والحوكمة',
        quick: 'إجراءات سريعة'
      },
      actions: {
        viewAll: 'عرض الكل',
        checkIn: 'تسجيل دخول',
      }
    },
    en: {
      welcome: 'Welcome back,',
      role: {
        super_admin: 'System Administrator',
        project_manager: 'Project Manager',
        technician: 'Field Technician'
      },
      desc: {
        super_admin: 'Governance center, security, and full system administration.',
        project_manager: 'Workflow monitoring, field teams, and approvals.',
        technician: 'Daily tasks, attendance log, and safety reporting.'
      },
      kpi: {
        users: 'Active Users',
        revenue: 'Revenue',
        projects: 'Active Projects',
        alerts: 'System Alerts',
        team: 'Field Team',
        tasks: 'Pending Tasks',
        efficiency: 'Efficiency',
        attendance: 'Attendance',
        safety: 'Safety Compliance',
        deadline: 'Next Deadline'
      },
      sections: {
        map: 'Live Field Tracking',
        tasks: 'Tasks & Operations',
        approvals: 'Pending Approvals',
        security: 'Security & Governance Log',
        quick: 'Quick Actions'
      },
      actions: {
        viewAll: 'View All',
        checkIn: 'Check-In',
      }
    }
  };

  const content = t[lang];

  // --- Fetch Data ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      if (role === 'super_admin') {
        setStats({
          kpi1: { label: content.kpi.users, value: '1,240', trend: '+12%', color: 'blue', icon: Users },
          kpi2: { label: content.kpi.revenue, value: '$4.2M', trend: '+8%', color: 'emerald', icon: Wallet },
          kpi3: { label: content.kpi.projects, value: '45', color: 'purple', icon: Briefcase },
          kpi4: { label: content.kpi.alerts, value: '3', color: 'red', icon: AlertTriangle },
        });
      } else if (role === 'project_manager') {
        setStats({
          kpi1: { label: content.kpi.projects, value: '12', trend: 'Active', color: 'blue', icon: Briefcase },
          kpi2: { label: content.kpi.team, value: '28', trend: 'Online', color: 'emerald', icon: Users },
          kpi3: { label: content.kpi.tasks, value: '142', color: 'amber', icon: CheckCircle2 },
          kpi4: { label: content.kpi.efficiency, value: '94%', trend: '+2%', color: 'purple', icon: Activity },
        });
      } else { 
        setStats({
          kpi1: { label: content.kpi.tasks, value: '5', trend: 'Today', color: 'blue', icon: CheckCircle2 },
          kpi2: { label: content.kpi.attendance, value: '07:55', trend: 'On Time', color: 'emerald', icon: Clock },
          kpi3: { label: content.kpi.safety, value: '100%', color: 'green', icon: ShieldCheck },
          kpi4: { label: content.kpi.deadline, value: '2h', color: 'red', icon: Calendar },
        });
      }
      setLoading(false);
    }, 600);
  }, [role, lang]);

  // --- Dynamic Styles ---
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  if (loading) return (
    <div className={`h-full flex items-center justify-center ${textSub}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-bold animate-pulse">Initializing...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
      
      {/* --- Welcome Block --- */}
      <div className={`p-8 rounded-[2rem] border relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 ${isDark ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
        
        <div className="relative z-10">
          <h2 className={`text-3xl font-black mb-2 ${textMain}`}>
            {content.welcome} <span className="text-blue-500">Ahmed!</span> 👋
          </h2>
          <p className={`text-sm max-w-lg leading-relaxed ${textSub}`}>
            {content.desc[role]}
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          {role === 'technician' ? (
             <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-transform hover:-translate-y-1">
               <Clock size={18}/> {content.actions.checkIn}
             </button>
          ) : (
             <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-transform hover:-translate-y-1">
               <LayoutDashboard size={18}/> {lang === 'ar' ? 'عرض التقارير' : 'View Reports'}
             </button>
          )}
        </div>
      </div>

      {/* --- KPI Grid --- */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard isDark={isDark} data={stats.kpi1} />
          <StatCard isDark={isDark} data={stats.kpi2} />
          <StatCard isDark={isDark} data={stats.kpi3} />
          <StatCard isDark={isDark} data={stats.kpi4} />
        </div>
      )}

      {/* --- Content Area --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Map (Managers) */}
          {role !== 'technician' && (
            <div className={`rounded-3xl border overflow-hidden relative group ${cardBg}`}>
              <div className="p-6 flex justify-between items-center border-b border-slate-100/10">
                <h3 className={`font-bold flex items-center gap-2 ${textMain}`}>
                  <MapPin className="text-blue-500" size={20}/> {content.sections.map}
                </h3>
                <button className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1">
                  {content.actions.viewAll} <DirectionalArrow size={14}/>
                </button>
              </div>
              <div className="h-64 bg-slate-100 dark:bg-slate-800 relative">
                 <div className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${isDark ? 'opacity-30' : 'opacity-60'}`} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop')" }}></div>
              </div>
            </div>
          )}

          {/* Tasks */}
          <div className={`rounded-3xl border p-6 ${cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold flex items-center gap-2 ${textMain}`}>
                <CheckCircle2 className="text-purple-500" size={20}/> {content.sections.tasks}
              </h3>
              <button className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                <Filter size={18} className={textSub}/>
              </button>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition hover:border-blue-500/30 ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {i === 1 ? <CheckCircle2 size={20}/> : <Clock size={20}/>}
                    </div>
                    <div>
                      <div className={`font-bold text-sm ${textMain}`}>Maintenance Request #{100+i}</div>
                      <div className={`text-xs ${textSub}`}>Sector 7 • High Voltage Unit</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${i === 1 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                    {i === 1 ? 'Completed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-8">
          {role !== 'technician' && (
            <div className={`p-6 rounded-[2rem] border relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 text-white border-slate-800'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
              <h3 className="font-bold mb-6 relative z-10 text-white">{content.sections.quick}</h3>
              <div className="space-y-3 relative z-10">
                <QuickBtn icon={Users} label={lang === 'ar' ? 'إضافة موظف' : 'Add Employee'} />
                <QuickBtn icon={FileText} label={lang === 'ar' ? 'إنشاء تقرير' : 'Create Report'} />
                <QuickBtn icon={Wallet} label={lang === 'ar' ? 'اعتماد ميزانية' : 'Approve Budget'} />
              </div>
            </div>
          )}

          <div className={`rounded-3xl border p-6 ${cardBg}`}>
            <h3 className={`font-bold mb-5 flex items-center gap-2 ${textMain}`}>
              <AlertTriangle className="text-amber-500" size={20}/> {content.sections.security}
            </h3>
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                <strong>Warning:</strong> Unsuccessful login attempts detected from IP 192.168.1.X.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Components ---
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
    <div className={`p-6 rounded-3xl border transition hover:-translate-y-1 hover:shadow-lg ${isDark ? 'bg-slate-900 border-slate-800 hover:shadow-blue-900/10' : 'bg-white border-slate-200 hover:shadow-slate-200'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3.5 rounded-2xl ${colorMap[data.color]}`}>
          <Icon size={24} />
        </div>
        {data.trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            {data.trend}
          </span>
        )}
      </div>
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{data.label}</p>
        <h4 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{data.value}</h4>
      </div>
    </div>
  );
}

function QuickBtn({ icon: Icon, label }: any) {
  return (
    <button className="w-full py-3.5 px-5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition flex items-center justify-between group backdrop-blur-sm border border-white/5">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-slate-300 group-hover:text-white transition"/>
        <span>{label}</span>
      </div>
      <ChevronDown size={16} className="text-slate-500 group-hover:text-white -rotate-90 transition"/>
    </button>
  );
}
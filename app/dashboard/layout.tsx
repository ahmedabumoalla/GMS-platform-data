'use client';

import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, ClipboardList, MapPin, DollarSign, FileText, LogOut, Bell, Shield, 
  ChevronLeft, LayoutDashboard, PlusCircle, Share2, ListChecks, 
  Calendar, Box, RefreshCw, GitPullRequest, Inbox, CheckSquare, 
  Video, Folder, TrendingUp, Target, Receipt, Banknote, PieChart,
  Sun, Moon, Globe, Briefcase,
  BookOpen, ReceiptText, Calculator, LineChart, Landmark, ShieldCheck, Loader2, List,
  HardDrive // أيقونة جديدة لخزنة البيانات
} from 'lucide-react';

// --- 1. تعريف أنواع البيانات ---
type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  job_title: string;
  email: string;
  avatar?: string;
  permissions: string[];
};

type ThemeContextType = {
  isDark: boolean;
  lang: 'ar' | 'en';
  toggleTheme: () => void;
  toggleLang: () => void;
  t: any;
  user: UserProfile | null;
  loadingUser: boolean;
};

const DashboardContext = createContext<ThemeContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    return { 
      isDark: false, lang: 'ar' as const, toggleTheme: () => {}, toggleLang: () => {}, 
      t: { ar: {}, en: {} }, user: null, loadingUser: true 
    }; 
  }
  return context;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const isRTL = lang === 'ar';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { router.push('/login'); return; }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;
        setUser(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        router.push('/login');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [router]);

  // --- القاموس ---
  const t = {
    ar: { 
        logout: 'تسجيل الخروج', headerTitle: 'نظام إدارة الموارد GMS', 
        menu: {
            sys: 'إدارة النظام', main: 'الرئيسية', users: 'المستخدمين', track: 'التتبع المباشر',
            proj: 'المشاريع والمهام', proj_list: 'قائمة المشاريع', new_task: 'مهمة جديدة', assign: 'توزيع المهام', progress: 'الإنجاز', timeline: 'الجدول الزمني', resources: 'الموارد', update: 'تحديث الحالة', team: 'فريق العمل',
            ops: 'العمليات', workflow: 'سير العمل', requests: 'الطلبات', quality: 'الجودة',
            // --- التعديل هنا في الترجمة ---
            comm: 'التواصل والملفات', meet: 'جدولة الاجتماعات', vault: 'خزنة البيانات والملفات', notif: 'الإشعارات',
            perf: 'التقارير والأداء', prod: 'الإنتاجية', kpi: 'مؤشرات الأداء', boards: 'اللوحات',
            fin: 'المالية', fin_gl: 'القيود', fin_invoices: 'الفوترة', fin_expenses: 'المصروفات', fin_payroll: 'الرواتب', fin_budget: 'الميزانية'
        }
    },
    en: { 
        logout: 'Logout', headerTitle: 'GMS ERP System', 
        menu: {
            sys: 'System Admin', main: 'Dashboard', users: 'Users', track: 'Live Tracking',
            proj: 'Projects', proj_list: 'Projects List', new_task: 'New Task', assign: 'Assign', progress: 'Progress', timeline: 'Timeline', resources: 'Resources', update: 'Update', team: 'Team',
            ops: 'Operations', workflow: 'Workflow', requests: 'Requests', quality: 'Quality',
            // --- التعديل هنا في الترجمة ---
            comm: 'Comms & Files', meet: 'Meetings Schedule', vault: 'Data Vault & Files', notif: 'Notifications',
            perf: 'Reports', prod: 'Productivity', kpi: 'KPIs', boards: 'Dashboards',
            fin: 'Finance', fin_gl: 'GL', fin_invoices: 'Invoicing', fin_expenses: 'Expenses', fin_payroll: 'Payroll', fin_budget: 'Budget'
        }
    }
  };
  const currentT = t[lang];

  // --- 🔥 القائمة الجانبية الذكية (Filtered Navigation) ---
  const navigation = useMemo(() => {
    if (!user) return [];
    const userRole = user.role;

    const fullNavigation = [
      {
        title: currentT.menu.sys,
        icon: <Shield size={20} />,
        allowedRoles: ['super_admin'],
        items: [
          { label: currentT.menu.main, href: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: currentT.menu.users, href: '/dashboard/users', icon: <Users size={18} /> },
          { label: currentT.menu.track, href: '/dashboard/map', icon: <MapPin size={18} /> },
        ]
      },
      {
        title: currentT.menu.proj,
        icon: <Briefcase size={20} />,
        allowedRoles: ['super_admin', 'admin', 'project_manager', 'engineer'],
        items: [
          { label: currentT.menu.main, href: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: currentT.menu.proj_list, href: '/dashboard/projects/list', icon: <List size={18} /> },
          ...( ['super_admin', 'admin'].includes(userRole) 
                ? [{ label: currentT.menu.new_task, href: '/dashboard/projects/create', icon: <PlusCircle size={18} /> }] 
                : [] ),
          { label: currentT.menu.assign, href: '/dashboard/projects/assign', icon: <Share2 size={18} /> },
          { label: currentT.menu.progress, href: '/dashboard/projects/progress', icon: <ListChecks size={18} /> },
          { label: currentT.menu.timeline, href: '/dashboard/projects/timeline', icon: <Calendar size={18} /> },
          { label: currentT.menu.team, href: '/dashboard/projects/team', icon: <Users size={18} /> },
        ]
      },
      {
        title: currentT.menu.ops,
        icon: <GitPullRequest size={20} />,
        allowedRoles: ['super_admin', 'admin', 'project_manager'],
        items: [
          { label: currentT.menu.workflow, href: '/dashboard/operations/workflow', icon: <GitPullRequest size={18} /> },
          { label: currentT.menu.requests, href: '/dashboard/operations/requests', icon: <Inbox size={18} /> },
          { label: currentT.menu.quality, href: '/dashboard/operations/quality', icon: <CheckSquare size={18} /> },
        ]
      },
      // --- 🔥 التعديل المطلوب في هذا القسم ---
      {
        title: currentT.menu.comm,
        icon: <Folder size={20} />, // تغيير الأيقونة الرئيسية لتناسب المجلدات والتواصل
        allowedRoles: ['super_admin', 'admin', 'project_manager', 'engineer'],
        items: [
          { label: currentT.menu.notif, href: '/dashboard/communication/notifications', icon: <Bell size={18} /> },
          { label: currentT.menu.meet, href: '/dashboard/communication/meetings', icon: <Video size={18} /> },
          { label: currentT.menu.vault, href: '/dashboard/communication/files', icon: <HardDrive size={18} /> },
        ]
      },
      // ----------------------------------------
      {
        title: currentT.menu.perf,
        icon: <TrendingUp size={20} />,
        allowedRoles: ['super_admin'],
        items: [
          { label: currentT.menu.prod, href: '/dashboard/reports/productivity', icon: <TrendingUp size={18} /> },
          { label: currentT.menu.kpi, href: '/dashboard/reports/kpi', icon: <Target size={18} /> },
          { label: currentT.menu.boards, href: '/dashboard/reports/dashboards', icon: <LayoutDashboard size={18} /> },
        ]
      },
      {
        title: currentT.menu.fin,
        icon: <DollarSign size={20} />,
        allowedRoles: ['super_admin', 'admin', 'accountant'],
        items: [
          { label: currentT.menu.fin_gl, href: '/dashboard/finance/general-ledger', icon: <BookOpen size={18} /> },
          { label: currentT.menu.fin_invoices, href: '/dashboard/finance/e-invoicing', icon: <ReceiptText size={18} /> },
          { label: currentT.menu.fin_expenses, href: '/dashboard/finance/expenses', icon: <Receipt size={18} /> },
          { label: currentT.menu.fin_payroll, href: '/dashboard/finance/payroll', icon: <Banknote size={18} /> },
        ]
      }
    ];

    return fullNavigation.filter(section => section.allowedRoles.includes(userRole));
  }, [user, lang, currentT]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isTechnicianPage = pathname?.includes('/technician');
  const bgMain = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const sidebarBg = 'bg-slate-900 border-slate-800';
  const headerBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200';

  if (loadingUser) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold text-sm">جاري التحقق من الصلاحيات...</p>
            </div>
        </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ isDark, lang, toggleTheme, toggleLang, t, user, loadingUser }}>
      {isTechnicianPage || user?.role === 'technician' ? (
         <div className={`min-h-screen font-sans ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {children}
         </div>
      ) : (
      <div className={`flex h-screen font-sans transition-colors duration-300 ${bgMain} ${textMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <aside className={`w-72 hidden md:flex flex-col shadow-2xl z-20 overflow-y-auto custom-scrollbar transition-colors duration-300 ${sidebarBg} text-white`}>
          <div className="p-6 border-b border-white/10 shrink-0 sticky top-0 bg-inherit z-10">
            <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">G</div>
              <div>
                <h1 className="font-bold text-lg tracking-wide">GMS System</h1>
                <p className="text-xs text-slate-400 group-hover:text-blue-200 transition-colors">ERP Platform</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((section, index) => (
              <SidebarGroup key={index} title={section.title} icon={section.icon} items={section.items} pathname={pathname} />
            ))}
          </nav>
          <div className="p-4 border-t border-white/10 shrink-0">
            <div className="mb-4 px-2">
                <div className="text-xs text-slate-400 mb-1">حساب:</div>
                <div className="font-bold text-sm text-blue-400 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:bg-white/5 w-full px-4 py-3 rounded-xl transition font-bold text-sm">
              <LogOut size={18} className={isRTL ? 'rotate-180' : ''} /> <span>{currentT.logout}</span>
            </button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className={`h-20 flex justify-between items-center px-8 shadow-sm flex-shrink-0 backdrop-blur-md border-b z-30 transition-colors duration-300 ${headerBg}`}>
            <h2 className={`text-xl font-bold ${textMain}`}>{currentT.headerTitle}</h2>
            <div className="flex items-center gap-4">
              <button onClick={toggleTheme} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {isDark ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
              <button onClick={toggleLang} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                <Globe size={16}/> {lang === 'ar' ? 'EN' : 'عربي'}
              </button>
              <div className={`w-px h-8 mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
              <div className={`flex items-center gap-3 pl-2 border-l ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="text-left hidden sm:block">
                      <div className={`text-sm font-bold ${textMain}`}>{user?.full_name}</div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.job_title || user?.role}</div>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full text-white flex items-center justify-center font-bold shadow-md uppercase border-2 border-white/20">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
              </div>
            </div>
          </header>
          <main className={`flex-1 overflow-y-auto p-8 custom-scrollbar transition-colors duration-300 ${bgMain}`}>
            {children}
          </main>
        </div>
      </div>
      )}
    </DashboardContext.Provider>
  );
}

function SidebarGroup({ title, icon, items, pathname }: any) {
  const isActiveGroup = items?.some((item: any) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(isActiveGroup);
  return (
    <div className="mb-2">
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isOpen ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
        <div className="flex items-center gap-3">{icon}<span className="font-bold text-sm">{title}</span></div>
        <ChevronLeft size={16} className={`transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="mr-4 pl-0 space-y-1 border-r-2 border-slate-800 pr-2">
          {items?.map((item: any, idx: number) => {
            const isActive = pathname === item.href;
            return (
              <Link key={idx} href={item.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {item.icon}{item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
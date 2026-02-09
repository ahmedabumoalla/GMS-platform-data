'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, ClipboardList, MapPin, DollarSign, FileText, LogOut, Bell, Shield, 
  ChevronLeft, LayoutDashboard, PlusCircle, Share2, ListChecks, 
  Calendar, Box, RefreshCw, GitPullRequest, Inbox, CheckSquare, 
  MessageCircle, Video, Folder, TrendingUp, Target, CreditCard, Banknote, PieChart, Receipt,
  Sun, Moon, Globe
} from 'lucide-react';

// --- 1. Context Definitions ---
type ThemeContextType = {
  isDark: boolean;
  lang: 'ar' | 'en';
  toggleTheme: () => void;
  toggleLang: () => void;
  t: any;
};

const DashboardContext = createContext<ThemeContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    return { 
      isDark: false, 
      lang: 'ar' as const, 
      toggleTheme: () => {}, 
      toggleLang: () => {}, 
      t: { ar: {}, en: {} } 
    }; 
  }
  return context;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  const toggleTheme = () => setIsDark(!isDark);
  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');
  const isRTL = lang === 'ar';

  // --- قاموس الترجمة للقائمة الجانبية والهيدر ---
  const t = {
    ar: { 
        logout: 'تسجيل الخروج', 
        headerTitle: 'لوحة التحكم والعمليات', 
        role: 'مدير النظام',
        menu: {
            sys: 'إدارة ومتابعة النظام',
            main: 'الرئيسية',
            users: 'المستخدمين والصلاحيات',
            track: 'التتبع المباشر',
            proj: 'إدارة المشاريع والمهام',
            new_task: 'إنشاء مهمة جديدة',
            assign: 'توزيع المهام',
            progress: 'متابعة الإنجاز',
            timeline: 'الجداول الزمنية',
            resources: 'إدارة الموارد',
            update: 'تحديث الحالة',
            team: 'فريق العمل',
            ops: 'إدارة العمليات والتشغيل',
            workflow: 'متابعة سير العمل',
            requests: 'إدارة الطلبات',
            quality: 'مراقبة الجودة',
            sops: 'الإجراءات التشغيلية',
            comm: 'إدارة التواصل والتعاون',
            chat: 'محادثات داخلية',
            meet: 'اجتماعات',
            files: 'مشاركة الملفات',
            notif: 'الإشعارات',
            perf: 'إدارة الأداء والتقارير',
            prod: 'تقارير الإنتاجية',
            kpi: 'مؤشرات الأداء KPI',
            boards: 'لوحات التحكم',
            fin: 'إدارة الموارد المالية',
            cost: 'تكلفة المشاريع',
            payroll: 'الرواتب',
            budget: 'ميزانيات الفرق',
            expense: 'متابعة المصروفات'
        }
    },
    en: { 
        logout: 'Logout', 
        headerTitle: 'Operations Dashboard', 
        role: 'System Admin',
        menu: {
            sys: 'System Management',
            main: 'Dashboard',
            users: 'Users & Permissions',
            track: 'Live Tracking',
            proj: 'Projects & Tasks',
            new_task: 'New Task',
            assign: 'Assign Tasks',
            progress: 'Progress Tracking',
            timeline: 'Timelines',
            resources: 'Resource Mgmt',
            update: 'Status Update',
            team: 'Team Workforce',
            ops: 'Operations',
            workflow: 'Workflow',
            requests: 'Requests',
            quality: 'Quality Control',
            sops: 'SOPs',
            comm: 'Communication',
            chat: 'Internal Chat',
            meet: 'Meetings',
            files: 'File Sharing',
            notif: 'Notifications',
            perf: 'Performance & Reports',
            prod: 'Productivity',
            kpi: 'KPIs',
            boards: 'Dashboards',
            fin: 'Financial Management',
            cost: 'Project Costs',
            payroll: 'Payroll',
            budget: 'Budgets',
            expense: 'Expenses'
        }
    }
  };

  const currentT = t[lang]; // النصوص الحالية

  // --- تعريف القائمة الجانبية (ديناميكي الآن) ---
  const navigation = [
    {
      title: currentT.menu.sys,
      icon: <LayoutDashboard size={20} />,
      items: [
        { label: currentT.menu.main, href: '/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: currentT.menu.users, href: '/dashboard/users', icon: <Shield size={18} /> },
        { label: currentT.menu.track, href: '/dashboard/map', icon: <MapPin size={18} /> },
      ]
    },
    {
      title: currentT.menu.proj,
      icon: <ClipboardList size={20} />,
      items: [
        { label: currentT.menu.new_task, href: '/dashboard/projects/create', icon: <PlusCircle size={18} /> },
        { label: currentT.menu.assign, href: '/dashboard/projects/assign', icon: <Share2 size={18} /> },
        { label: currentT.menu.progress, href: '/dashboard/projects/progress', icon: <ListChecks size={18} /> },
        { label: currentT.menu.timeline, href: '/dashboard/projects/timeline', icon: <Calendar size={18} /> },
        { label: currentT.menu.resources, href: '/dashboard/projects/resources', icon: <Box size={18} /> },
        { label: currentT.menu.update, href: '/dashboard/projects/update-status', icon: <RefreshCw size={18} /> },
        { label: currentT.menu.team, href: '/dashboard/projects/team', icon: <Users size={18} /> },
      ]
    },
    {
      title: currentT.menu.ops,
      icon: <GitPullRequest size={20} />,
      items: [
        { label: currentT.menu.workflow, href: '/dashboard/operations/workflow', icon: <GitPullRequest size={18} /> },
        { label: currentT.menu.requests, href: '/dashboard/operations/requests', icon: <Inbox size={18} /> },
        { label: currentT.menu.quality, href: '/dashboard/operations/quality', icon: <CheckSquare size={18} /> },
        { label: currentT.menu.sops, href: '/dashboard/operations/sops', icon: <FileText size={18} /> },
      ]
    },
    {
      title: currentT.menu.comm,
      icon: <MessageCircle size={20} />,
      items: [
        { label: currentT.menu.chat, href: '/dashboard/communication/chat', icon: <MessageCircle size={18} /> },
        { label: currentT.menu.meet, href: '/dashboard/communication/meetings', icon: <Video size={18} /> },
        { label: currentT.menu.files, href: '/dashboard/communication/files', icon: <Folder size={18} /> },
        { label: currentT.menu.notif, href: '/dashboard/communication/notifications', icon: <Bell size={18} /> },
      ]
    },
    {
      title: currentT.menu.perf,
      icon: <TrendingUp size={20} />,
      items: [
        { label: currentT.menu.prod, href: '/dashboard/reports/productivity', icon: <TrendingUp size={18} /> },
        { label: currentT.menu.kpi, href: '/dashboard/reports/kpi', icon: <Target size={18} /> },
        { label: currentT.menu.boards, href: '/dashboard/reports/dashboards', icon: <LayoutDashboard size={18} /> },
      ]
    },
    {
      title: currentT.menu.fin,
      icon: <DollarSign size={20} />,
      items: [
        { label: currentT.menu.cost, href: '/dashboard/finance/projects-cost', icon: <CreditCard size={18} /> },
        { label: currentT.menu.payroll, href: '/dashboard/finance/payroll', icon: <Banknote size={18} /> },
        { label: currentT.menu.budget, href: '/dashboard/finance/budgets', icon: <PieChart size={18} /> },
        { label: currentT.menu.expense, href: '/dashboard/finance/expenses', icon: <Receipt size={18} /> },
      ]
    }
  ];

  const handleLogout = () => {
    router.push('/login');
  };

  // ✅ شرط مهم: إذا كنا في صفحة الفني، نخفي القائمة الجانبية والهيدر
  const isTechnicianPage = pathname?.includes('/technician');

  const bgMain = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const sidebarBg = 'bg-slate-900 border-slate-800';
  const headerBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200';

  return (
    <DashboardContext.Provider value={{ isDark, lang, toggleTheme, toggleLang, t }}>
      
      {/* 🟢 حالة الفني: عرض المحتوى فقط (شاشة كاملة) */}
      {isTechnicianPage ? (
         <div className={`min-h-screen font-sans ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {children}
         </div>
      ) : (
        
      /* 🔵 حالة المدير: عرض القائمة الجانبية والهيدر */
      <div className={`flex h-screen font-sans transition-colors duration-300 ${bgMain} ${textMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Sidebar */}
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
              <SidebarGroup 
                key={index} 
                title={section.title} 
                icon={section.icon} 
                items={section.items} 
                pathname={pathname}
              />
            ))}
          </nav>

          <div className="p-4 border-t border-white/10 shrink-0">
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:bg-white/5 w-full px-4 py-3 rounded-xl transition font-bold text-sm">
              <LogOut size={18} className={isRTL ? 'rotate-180' : ''} /> <span>{currentT.logout}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Header */}
          <header className={`h-20 flex justify-between items-center px-8 shadow-sm flex-shrink-0 backdrop-blur-md border-b z-30 transition-colors duration-300 ${headerBg}`}>
            <h2 className={`text-xl font-bold ${textMain}`}>
               {currentT.headerTitle}
            </h2>
            
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
                      <div className={`text-sm font-bold ${textMain}`}>Ahmed Al-Ghamdi</div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentT.role}</div>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold shadow-md">A</div>
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

// Sidebar Group Component
function SidebarGroup({ title, icon, items, pathname }: any) {
  const isActiveGroup = items?.some((item: any) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(isActiveGroup);

  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isOpen ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-sm">{title}</span>
        </div>
        <ChevronLeft size={16} className={`transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="mr-4 pl-0 space-y-1 border-r-2 border-slate-800 pr-2">
          {items?.map((item: any, idx: number) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={idx}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
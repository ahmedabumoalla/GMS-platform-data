'use client';

import React, { useState, createContext, useContext, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, MapPin, DollarSign, LogOut, Bell, Shield, 
  ChevronLeft, LayoutDashboard, PlusCircle, Share2, ListChecks, 
  Calendar, Box, GitPullRequest, Inbox, CheckSquare, 
  Video, Folder, TrendingUp, Target, Receipt, Banknote, 
  Sun, Moon, Globe, Briefcase, Settings, 
  BookOpen, ReceiptText, ShieldCheck, Loader2, List,
  HardDrive, LayoutGrid, ChevronDown, CheckCircle2,
  LifeBuoy, Send, X, Building2, FileSignature, 
  ShoppingCart, PackageOpen, Truck, Landmark, CreditCard, 
  FilePlus, FileSpreadsheet, WalletCards,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type UserProfile = {
  id: string;
  full_name: string;
  role: string;
  job_title: string;
  email: string;
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
  if (!context) throw new Error("useDashboard must be used within DashboardContext");
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

  const [activePlugins, setActivePlugins] = useState<string[]>([]);
  const [currentApp, setCurrentApp] = useState<'all' | string>('all');
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [ticketData, setTicketData] = useState({ subject: '', message: '', urgency: 'Normal' });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) setShowAppSwitcher(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { router.push('/login'); return; }

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (profile) setUser(profile);

        const { data: plugins } = await supabase.from('system_plugins').select('plugin_key').eq('is_active', true);
        if (plugins) setActivePlugins(plugins.map(p => p.plugin_key));

        const { data: notifs } = await supabase
          .from('notifications')
          .select('id, title_ar, title_en, message_ar, message_en, created_at, status')
          .or(`user_id.eq.${authUser.id},user_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(10);
        if (notifs) setNotifications(notifs);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchCoreData();
  }, [router]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !ticketData.subject || !ticketData.message) return;
      setIsSubmittingTicket(true);
      
      try {
          const { error } = await supabase.from('support_tickets').insert({
              user_id: user.id,
              subject: ticketData.subject,
              message: ticketData.message,
              urgency: ticketData.urgency
          });
          
          if (error) throw error;
          
          alert(isRTL ? 'تم الإرسال بنجاح.' : 'Ticket submitted.');
          setShowHelpModal(false);
          setTicketData({ subject: '', message: '', urgency: 'Normal' });
      } catch (error: any) {
          alert('Error: ' + error.message);
      } finally {
          setIsSubmittingTicket(false);
      }
  };

  const t = {
    ar: { 
        logout: 'تسجيل الخروج', headerTitle: 'نظام إدارة الموارد GMS', allApps: 'كل التطبيقات',
        menu: {
            sys: 'إدارة النظام', main: 'الرئيسية', users: 'المستخدمين', track: 'التتبع المباشر',
            proj: 'المشاريع والمهام', proj_list: 'قائمة المشاريع', new_task: 'إنشاء مشروع جديد', assign: 'توزيع المهام', progress: 'الإنجاز', timeline: 'الجدول الزمني', team: 'فريق العمل',
            subcontractors: 'المقاولين الرئيسيين',
            ops: 'العمليات', workflow: 'سير العمل', requests: 'الطلبات', quality: 'الجودة',
            comm: 'التواصل والملفات', meet: 'الاجتماعات', vault: 'خزنة الملفات', notif: 'الإشعارات',
            perf: 'التقارير والأداء', prod: 'الإنتاجية', kpi: 'مؤشرات الأداء', boards: 'اللوحات', hr_actions: 'سجل القرارات والإجراءات',
            settings: 'الإعدادات', appManager: 'إدارة التطبيقات',
            // 🚀 القاموس المالي الذكي (ERP Finance) 🚀
            fin_sales: 'المبيعات', fin_sales_new: 'إنشاء فاتورة مبيعات', fin_sales_list: 'عرض فواتير المبيعات', fin_quotes_new: 'إنشاء عرض سعر', fin_quotes_list: 'مراجعة عروض الأسعار',
            fin_inventory: 'المخزون', fin_inv_mgr: 'إدارة المخزون', fin_inv_issue: 'طلب صرف إذن مخزني',
            fin_clients: 'العملاء', fin_client_bal: 'أرصدة العملاء', fin_client_list: 'قائمة العملاء',
            fin_purchases: 'المشتريات', fin_purch_new: 'إنشاء فاتورة مشتريات', fin_purch_list: 'عرض فواتير المشتريات',
            fin_suppliers: 'الموردين', fin_supp_bal: 'أرصدة الموردين', fin_supp_list: 'قائمة الموردين',
            fin_transactions: 'المعاملات المالية', fin_treasury: 'الخزينة والصندوق', fin_je_list: 'شجرة الحسابات', fin_je_new: 'إنشاء قيد يومية جديد', fin_voucher_out: 'سند صرف', fin_voucher_in: 'سند قبض', fin_payroll: 'مسيرات الرواتب', fin_clearances: 'المستخلصات المالية', fin_contracts: 'العقود الحالية',
            fin_expenses: 'المصروفات', fin_exp_new: 'إضافة مصروفات جديدة', fin_exp_list: 'عرض المصروفات', fin_exp_req: 'طلبات الصرف الجديدة'
        },
        apps: { all: 'الكل', ops: 'العمليات والمشاريع', fin: 'المالية والحسابات', comm: 'التواصل والمستندات', sys: 'النظام والإعدادات' },
        help: { title: 'مركز المساعدة', subject: 'العنوان', message: 'الوصف', urgency: 'الأهمية', low: 'عادية', normal: 'متوسطة', high: 'عاجلة', cancel: 'إلغاء', submit: 'إرسال' },
        notifications: { title: 'الإشعارات', empty: 'لا توجد إشعارات', viewAll: 'عرض الكل' }
    },
    en: { 
        logout: 'Logout', headerTitle: 'GMS ERP System', allApps: 'All Apps',
        menu: {
            sys: 'System Admin', main: 'Dashboard', users: 'Users', track: 'Live Tracking',
            proj: 'Projects', proj_list: 'Projects List', new_task: 'New Task', assign: 'Assign', progress: 'Progress', timeline: 'Timeline', team: 'Team',
            subcontractors: 'Subcontractors',
            ops: 'Operations', workflow: 'Workflow', requests: 'Requests', quality: 'Quality',
            comm: 'Comms & Files', meet: 'Meetings', vault: 'Data Vault', notif: 'Notifications',
            perf: 'Reports', prod: 'Productivity', kpi: 'KPIs', boards: 'Dashboards', hr_actions: 'HR Actions Log',
            settings: 'Settings', appManager: 'App Manager',
            // 🚀 ERP Finance Dictionary 🚀
            fin_sales: 'Sales', fin_sales_new: 'New Sales Invoice', fin_sales_list: 'Sales Invoices', fin_quotes_new: 'New Quotation', fin_quotes_list: 'Review Quotations',
            fin_inventory: 'Inventory', fin_inv_mgr: 'Inventory Management', fin_inv_issue: 'Stock Issue Request',
            fin_clients: 'Clients', fin_client_bal: 'Client Balances', fin_client_list: 'Clients List',
            fin_purchases: 'Purchases', fin_purch_new: 'New Purchase Invoice', fin_purch_list: 'Purchase Invoices',
            fin_suppliers: 'Suppliers', fin_supp_bal: 'Supplier Balances', fin_supp_list: 'Suppliers List',
            fin_transactions: 'Financial Transactions', fin_treasury: 'Treasury & Cash', fin_je_list: 'Journal Entries', fin_je_new: 'New Journal Entry', fin_voucher_out: 'Payment Voucher', fin_voucher_in: 'Receipt Voucher', fin_payroll: 'Payroll', fin_clearances: 'Financial Clearances', fin_contracts: 'Current Contracts',
            fin_expenses: 'Expenses', fin_exp_new: 'Add New Expense', fin_exp_list: 'View Expenses', fin_exp_req: 'New Expense Requests'
        },
        apps: { all: 'All Apps', ops: 'Operations & Projects', fin: 'Finance', comm: 'Comms & DMS', sys: 'System & Settings' },
        help: { title: 'Support', subject: 'Subject', message: 'Message', urgency: 'Urgency', low: 'Low', normal: 'Normal', high: 'High', cancel: 'Cancel', submit: 'Submit' },
        notifications: { title: 'Notifications', empty: 'No notifications', viewAll: 'View All' }
    }
  };
  const currentT = t[lang];

  const navigation = useMemo(() => {
    if (!user) return [];
    const userRole = user.role;
    const finRoles = ['super_admin', 'admin', 'accountant'];

    const fullNavigation = [
      {
        title: currentT.menu.sys, pluginKey: 'core', appKey: 'sys', icon: <Shield size={20} />, allowedRoles: ['super_admin'],
        items: [
          { label: currentT.menu.users, href: '/dashboard/users', icon: <Users size={18} /> },
          { label: currentT.menu.track, href: '/dashboard/map', icon: <MapPin size={18} /> },
        ]
      },
      {
        title: currentT.menu.proj, pluginKey: 'operations', appKey: 'ops', icon: <Briefcase size={20} />, allowedRoles: ['super_admin', 'admin', 'project_manager', 'engineer'],
        items: [
          { label: currentT.menu.main, href: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: currentT.menu.proj_list, href: '/dashboard/projects/list', icon: <List size={18} /> },
          ...( ['super_admin', 'admin'].includes(userRole) ? [{ label: currentT.menu.new_task, href: '/dashboard/projects/create', icon: <PlusCircle size={18} /> }] : [] ),
          { label: currentT.menu.subcontractors, href: '/dashboard/subcontractors', icon: <Building2 size={18} /> },
          { label: currentT.menu.assign, href: '/dashboard/projects/assign', icon: <Share2 size={18} /> },
          { label: currentT.menu.progress, href: '/dashboard/projects/progress', icon: <ListChecks size={18} /> },
          { label: currentT.menu.timeline, href: '/dashboard/projects/timeline', icon: <Calendar size={18} /> },
          { label: currentT.menu.team, href: '/dashboard/projects/team', icon: <Users size={18} /> },
        ]
      },
      {
        title: currentT.menu.ops, pluginKey: 'operations', appKey: 'ops', icon: <GitPullRequest size={20} />, allowedRoles: ['super_admin', 'admin', 'project_manager'],
        items: [
          { label: currentT.menu.workflow, href: '/dashboard/operations/workflow', icon: <GitPullRequest size={18} /> },
          { label: currentT.menu.requests, href: '/dashboard/operations/requests', icon: <Inbox size={18} /> },
          { label: currentT.menu.quality, href: '/dashboard/operations/quality', icon: <CheckSquare size={18} /> },
        ]
      },
      {
        title: currentT.menu.comm, pluginKey: 'comms', appKey: 'comm', icon: <Folder size={20} />, allowedRoles: ['super_admin', 'admin', 'project_manager', 'engineer'],
        items: [
          { label: currentT.menu.notif, href: '/dashboard/communication/notifications', icon: <Bell size={18} /> },
          { label: currentT.menu.meet, href: '/dashboard/communication/meetings', icon: <Video size={18} /> },
          { label: currentT.menu.vault, href: '/dashboard/communication/files', icon: <HardDrive size={18} /> },
        ]
      },
      {
        title: currentT.menu.perf, pluginKey: 'core', appKey: 'sys', icon: <TrendingUp size={20} />, allowedRoles: ['super_admin', 'admin', 'project_manager'],
        items: [
          { label: currentT.menu.prod, href: '/dashboard/reports/productivity', icon: <TrendingUp size={18} /> },
          { label: currentT.menu.kpi, href: '/dashboard/reports/kpi', icon: <Target size={18} /> },
          { label: currentT.menu.boards, href: '/dashboard/reports/dashboards', icon: <LayoutDashboard size={18} /> },
          { label: currentT.menu.hr_actions, href: '/dashboard/reports/hr-actions', icon: <FileSignature size={18} /> },
        ]
      },
      // 🚀 القائمة المالية الذكية (ERP Level) 🚀
      {
        title: currentT.menu.fin_sales, pluginKey: 'finance', appKey: 'fin', icon: <ShoppingCart size={20} />, allowedRoles: finRoles,
        items: [
          { label: currentT.menu.fin_sales_new, href: '/dashboard/finance/sales/new', icon: <FilePlus size={18} /> },
          { label: currentT.menu.fin_sales_list, href: '/dashboard/finance/sales/invoices', icon: <ReceiptText size={18} /> },
          { label: currentT.menu.fin_quotes_new, href: '/dashboard/finance/sales/quotes/new', icon: <FileSpreadsheet size={18} /> },
          { label: currentT.menu.fin_quotes_list, href: '/dashboard/finance/sales/quotes', icon: <ListChecks size={18} /> },
        ]
      },
      {
        title: currentT.menu.fin_inventory, pluginKey: 'finance', appKey: 'fin', icon: <PackageOpen size={20} />, allowedRoles: finRoles,
        items: [
          { label: currentT.menu.fin_inv_mgr, href: '/dashboard/finance/inventory/manage', icon: <Box size={18} /> },
          { label: currentT.menu.fin_inv_issue, href: '/dashboard/finance/inventory/issue', icon: <Share2 size={18} /> },
        ]
      },
      {
        title: currentT.menu.fin_clients, pluginKey: 'finance', appKey: 'fin', icon: <Users size={20} />, allowedRoles: finRoles,
        items: [
          { label: currentT.menu.fin_client_bal, href: '/dashboard/finance/clients/balances', icon: <WalletCards size={18} /> },
          { label: currentT.menu.fin_client_list, href: '/dashboard/finance/clients/list', icon: <List size={18} /> },
        ]
      },
      {
        title: currentT.menu.fin_purchases, pluginKey: 'finance', appKey: 'fin', icon: <Landmark size={20} />, allowedRoles: finRoles,
        items: [
          { label: currentT.menu.fin_purch_new, href: '/dashboard/finance/purchases/new', icon: <FilePlus size={18} /> },
          { label: currentT.menu.fin_purch_list, href: '/dashboard/finance/purchases/invoices', icon: <ReceiptText size={18} /> },
        ]
      },
      {
        title: currentT.menu.fin_suppliers, pluginKey: 'finance', appKey: 'fin', icon: <Truck size={20} />, allowedRoles: finRoles,
        items: [
          { label: currentT.menu.fin_supp_bal, href: '/dashboard/finance/suppliers/balances', icon: <WalletCards size={18} /> },
          { label: currentT.menu.fin_supp_list, href: '/dashboard/finance/suppliers/list', icon: <List size={18} /> },
        ]
      },
      {
        title: currentT.menu.fin_transactions, pluginKey: 'finance', appKey: 'fin', icon: <Banknote size={20} />, allowedRoles: finRoles,
        items: [
          { label: currentT.menu.fin_treasury, href: '/dashboard/finance/transactions/treasury', icon: <Landmark size={18} /> },
          { label: currentT.menu.fin_je_list, href: '/dashboard/finance/general-ledger', icon: <BookOpen size={18} /> },
          { label: currentT.menu.fin_je_new, href: '/dashboard/finance/transactions/journal/new', icon: <PlusCircle size={18} /> },
          { label: currentT.menu.fin_voucher_out, href: '/dashboard/finance/transactions/payment-voucher', icon: <ArrowRight size={18} /> },
          { label: currentT.menu.fin_voucher_in, href: '/dashboard/finance/transactions/receipt-voucher', icon: <ChevronLeft size={18} /> },
          { label: currentT.menu.fin_payroll, href: '/dashboard/finance/payroll', icon: <Users size={18} /> },
          { label: currentT.menu.fin_clearances, href: '/dashboard/finance/clearances', icon: <CheckSquare size={18} /> },
          { label: currentT.menu.fin_contracts, href: '/dashboard/finance/contracts', icon: <Briefcase size={18} /> },
        ]
      },
      {
        title: currentT.menu.fin_expenses, pluginKey: 'finance', appKey: 'fin', icon: <CreditCard size={20} />, allowedRoles: finRoles,
        items: [
          { label: currentT.menu.fin_exp_new, href: '/dashboard/finance/expenses/new', icon: <PlusCircle size={18} /> },
          { label: currentT.menu.fin_exp_list, href: '/dashboard/finance/expenses/list', icon: <Receipt size={18} /> },
          { label: currentT.menu.fin_exp_req, href: '/dashboard/finance/expenses/requests', icon: <Inbox size={18} /> },
        ]
      },
      {
        title: currentT.menu.settings, pluginKey: 'core', appKey: 'sys', icon: <Settings size={20} />, allowedRoles: ['super_admin', 'admin'],
        items: [
          { label: currentT.menu.appManager, href: '/dashboard/settings/plugins', icon: <Box size={18} /> },
        ]
      }
    ];

    return fullNavigation.filter(section => {
      const roleAllowed = section.allowedRoles.includes(userRole);
      const pluginActive = section.pluginKey === 'core' || activePlugins.includes(section.pluginKey);
      const appSelected = currentApp === 'all' || section.appKey === currentApp;
      return roleAllowed && pluginActive && appSelected;
    });

  }, [user, lang, currentT, activePlugins, currentApp]);

  const appOptions = [
      { id: 'all', label: currentT.apps.all, icon: <LayoutGrid size={18}/>, color: 'text-blue-500' },
      { id: 'ops', label: currentT.apps.ops, icon: <Briefcase size={18}/>, color: 'text-blue-500', reqPlugin: 'operations' },
      { id: 'fin', label: currentT.apps.fin, icon: <DollarSign size={18}/>, color: 'text-emerald-500', reqPlugin: 'finance' },
      { id: 'comm', label: currentT.apps.comm, icon: <Folder size={18}/>, color: 'text-purple-500', reqPlugin: 'comms' },
      { id: 'sys', label: currentT.apps.sys, icon: <Settings size={18}/>, color: 'text-slate-500', reqPlugin: 'core' },
  ].filter(app => !app.reqPlugin || app.reqPlugin === 'core' || activePlugins.includes(app.reqPlugin));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const bgMain = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const sidebarBg = 'bg-slate-900 border-slate-800';
  const headerBg = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200';
  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  if (loadingUser) return null;

  if (pathname?.includes('/technician') || user?.role === 'technician') {
      return (
          <DashboardContext.Provider value={{ isDark, lang, toggleTheme, toggleLang, t, user, loadingUser }}>
              <div className={`min-h-screen font-sans ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>{children}</div>
          </DashboardContext.Provider>
      );
  }

  return (
    <DashboardContext.Provider value={{ isDark, lang, toggleTheme, toggleLang, t, user, loadingUser }}>
      <div className={`flex h-screen font-sans transition-colors duration-300 ${bgMain} ${textMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        <aside className={`w-72 hidden md:flex flex-col shadow-2xl z-20 overflow-y-auto custom-scrollbar transition-colors duration-300 ${sidebarBg} text-white`}>
          <div className="p-6 border-b border-white/10 shrink-0 sticky top-0 bg-inherit z-20" ref={switcherRef}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">G</div>
              <div>
                <h1 className="font-bold text-lg tracking-wide">GMS System</h1>
                <p className="text-xs text-slate-400">ERP Platform</p>
              </div>
            </div>

            <button onClick={() => setShowAppSwitcher(!showAppSwitcher)} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-xl transition text-sm font-bold">
                <div className="flex items-center gap-2">
                    {appOptions.find(a => a.id === currentApp)?.icon}
                    <span>{appOptions.find(a => a.id === currentApp)?.label}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showAppSwitcher ? 'rotate-180' : ''}`}/>
            </button>

            <AnimatePresence>
                {showAppSwitcher && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-6 right-6 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                        {appOptions.map(app => (
                            <button key={app.id} onClick={() => { setCurrentApp(app.id); setShowAppSwitcher(false); }} className={`w-full flex items-center gap-3 p-3 text-sm font-bold transition hover:bg-slate-700 ${currentApp === app.id ? 'bg-slate-700' : ''}`}>
                                <span className={app.color}>{app.icon}</span><span>{app.label}</span>
                                {currentApp === app.id && <CheckCircle2 size={14} className="ml-auto rtl:mr-auto rtl:ml-0 text-blue-500"/>}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((section, index) => (
              <SidebarGroup key={index} title={section.title} icon={section.icon} items={section.items} pathname={pathname} />
            ))}
          </nav>

          <div className="p-4 border-t border-white/10 shrink-0">
            <div className="mb-4 px-2">
                <div className="text-xs text-slate-400 mb-1">{isRTL ? 'حساب:' : 'Account:'}</div>
                <div className="font-bold text-sm text-blue-400 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:bg-white/5 w-full px-4 py-3 rounded-xl transition font-bold text-sm">
              <LogOut size={18} className={isRTL ? 'rotate-180' : ''} /> <span>{currentT.logout}</span>
            </button>
          </div>
        </aside>
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <header className={`h-20 flex justify-between items-center px-8 shadow-sm flex-shrink-0 backdrop-blur-md border-b z-30 transition-colors duration-300 ${headerBg}`}>
            <h2 className={`text-xl font-bold hidden sm:block ${textMain}`}>{appOptions.find(a => a.id === currentApp)?.label}</h2>
            <div className="flex items-center gap-4 ml-auto rtl:mr-auto rtl:ml-0">
              
              <button onClick={() => setShowHelpModal(true)} className={`p-2.5 rounded-full transition flex items-center gap-2 ${isDark ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                <LifeBuoy size={18}/>
                <span className="text-xs font-bold hidden md:block">{isRTL ? 'المساعدة' : 'Help'}</span>
              </button>

              <div className="relative" ref={notifRef}>
                  <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Bell size={18}/>
                    {unreadCount > 0 && <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white dark:border-slate-800"></span>}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute top-full mt-3 w-80 rounded-2xl shadow-2xl border overflow-hidden ${isRTL ? 'left-0' : 'right-0'} ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                        >
                            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                                <h4 className={`font-bold text-sm ${textMain}`}>{currentT.notifications.title}</h4>
                                {unreadCount > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold">{unreadCount}</span>}
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className={`p-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{currentT.notifications.empty}</div>
                                ) : (
                                    <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                        {notifications.map(n => (
                                            <Link href="/dashboard/communication/notifications" onClick={() => setShowNotifications(false)} key={n.id} className={`block p-4 transition ${n.status === 'Unread' ? (isDark ? 'bg-slate-800/50' : 'bg-blue-50/50') : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h5 className={`text-sm font-bold truncate pr-4 ${textMain}`}>{isRTL ? n.title_ar : n.title_en}</h5>
                                                    {n.status === 'Unread' && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>}
                                                </div>
                                                <p className={`text-xs line-clamp-1 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? n.message_ar : n.message_en}</p>
                                                <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(n.created_at).toLocaleDateString()}</div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className={`p-2 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                                <Link href="/dashboard/communication/notifications" onClick={() => setShowNotifications(false)} className={`block text-center text-xs font-bold py-2 rounded-lg transition ${isDark ? 'text-blue-400 hover:bg-slate-800' : 'text-blue-600 hover:bg-slate-200'}`}>
                                    {currentT.notifications.viewAll}
                                </Link>
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
              </div>

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

      <AnimatePresence>
        {showHelpModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                    <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                        <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><LifeBuoy className="text-blue-500" /> {currentT.help.title}</h3>
                        <button onClick={() => setShowHelpModal(false)} className={`p-2 rounded-full transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                    </div>

                    <form onSubmit={handleSubmitTicket} className="p-6 space-y-5">
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentT.help.subject}</label>
                            <input required type="text" value={ticketData.subject} onChange={e => setTicketData({...ticketData, subject: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none transition text-sm font-bold border focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'}`} />
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentT.help.urgency}</label>
                            <select value={ticketData.urgency} onChange={e => setTicketData({...ticketData, urgency: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none transition text-sm font-bold border focus:ring-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'}`}>
                                <option value="Low">{currentT.help.low}</option><option value="Normal">{currentT.help.normal}</option><option value="High">{currentT.help.high}</option>
                            </select>
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentT.help.message}</label>
                            <textarea required value={ticketData.message} onChange={e => setTicketData({...ticketData, message: e.target.value})} className={`w-full rounded-xl px-4 py-3 outline-none transition text-sm border focus:ring-2 h-32 resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'}`} />
                        </div>

                        <div className={`pt-5 mt-2 border-t flex gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <button type="button" onClick={() => setShowHelpModal(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{currentT.help.cancel}</button>
                            <button type="submit" disabled={isSubmittingTicket} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSubmittingTicket ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>} {currentT.help.submit}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </DashboardContext.Provider>
  );
}

function SidebarGroup({ title, icon, items, pathname }: any) {
  const isActiveGroup = items?.some((item: any) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(isActiveGroup);
  useEffect(() => { setIsOpen(isActiveGroup); }, [isActiveGroup]);

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
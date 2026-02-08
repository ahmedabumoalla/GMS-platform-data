'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Users, ClipboardList, MapPin, DollarSign, FileText, LogOut, Bell, Shield, 
  ChevronDown, ChevronLeft, LayoutDashboard, PlusCircle, Share2, ListChecks, 
  Calendar, Box, RefreshCw, GitPullRequest, Inbox, CheckSquare, 
  MessageCircle, Video, Folder, TrendingUp, Target, CreditCard, Banknote, PieChart, Receipt
} from 'lucide-react';

// تعريف هيكل القائمة الجانبية
const navigation = [
  {
    title: 'إدارة ومتابعة النظام',
    icon: <LayoutDashboard size={20} />,
    items: [
      { label: 'الرئيسية', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'المستخدمين والصلاحيات', href: '/dashboard/users', icon: <Shield size={18} /> },
      { label: 'التتبع المباشر', href: '/dashboard/map', icon: <MapPin size={18} /> },
    ]
  },
  {
    title: 'إدارة المشاريع والمهام',
    icon: <ClipboardList size={20} />,
    items: [
      { label: 'إنشاء مهمة جديدة', href: '/dashboard/projects/create', icon: <PlusCircle size={18} /> }, // ادمن - ادارة
      { label: 'توزيع المهام', href: '/dashboard/projects/assign', icon: <Share2 size={18} /> }, // مشرف - ادارة - ادمن
      { label: 'متابعة الإنجاز', href: '/dashboard/projects/progress', icon: <ListChecks size={18} /> }, // مشرف - ادارة - ادمن
      { label: 'الجداول الزمنية', href: '/dashboard/projects/timeline', icon: <Calendar size={18} /> }, // مشرف - ادارة - ادمن
      { label: 'إدارة الموارد', href: '/dashboard/projects/resources', icon: <Box size={18} /> }, // ادمن - مشرف - ادارة
      { label: 'تحديث الحالة', href: '/dashboard/projects/update-status', icon: <RefreshCw size={18} /> }, // فنيين - مشرفين
      { label: 'فريق العمل', href: '/dashboard/projects/team', icon: <Users size={18} /> }, // مشرفين - ادارة - ادمن
    ]
  },
  {
    title: 'إدارة العمليات والتشغيل',
    icon: <GitPullRequest size={20} />,
    items: [
      { label: 'متابعة سير العمل', href: '/dashboard/operations/workflow', icon: <GitPullRequest size={18} /> }, // مشرف - ادمن - ادارة
      { label: 'إدارة الطلبات', href: '/dashboard/operations/requests', icon: <Inbox size={18} /> }, // مشرف - ادمن - ادارة
      { label: 'مراقبة الجودة', href: '/dashboard/operations/quality', icon: <CheckSquare size={18} /> }, // مشرف - ادمن - ادارة
      { label: 'الإجراءات التشغيلية', href: '/dashboard/operations/sops', icon: <FileText size={18} /> }, // مشرف - ادمن - ادارة
    ]
  },
  {
    title: 'إدارة التواصل والتعاون',
    icon: <MessageCircle size={20} />,
    items: [
      { label: 'محادثات داخلية', href: '/dashboard/communication/chat', icon: <MessageCircle size={18} /> }, // الجميع
      { label: 'اجتماعات', href: '/dashboard/communication/meetings', icon: <Video size={18} /> }, // الجميع
      { label: 'مشاركة الملفات', href: '/dashboard/communication/files', icon: <Folder size={18} /> }, // مشرف - ادمن - ادارة
      { label: 'الإشعارات', href: '/dashboard/communication/notifications', icon: <Bell size={18} /> }, // الجميع
    ]
  },
  {
    title: 'إدارة الأداء والتقارير',
    icon: <TrendingUp size={20} />,
    items: [
      { label: 'تقارير الإنتاجية', href: '/dashboard/reports/productivity', icon: <TrendingUp size={18} /> }, // ادمن - مشرف - ادارة - مالية
      { label: 'مؤشرات الأداء KPI', href: '/dashboard/reports/kpi', icon: <Target size={18} /> }, // ادمن - ادارة - مالية
      { label: 'لوحات التحكم', href: '/dashboard/reports/dashboards', icon: <LayoutDashboard size={18} /> }, // ادمن - ادارة
    ]
  },
  {
    title: 'إدارة الموارد المالية',
    icon: <DollarSign size={20} />,
    items: [
      { label: 'تكلفة المشاريع', href: '/dashboard/finance/projects-cost', icon: <CreditCard size={18} /> }, // ادمن - مالية
      { label: 'الرواتب', href: '/dashboard/finance/payroll', icon: <Banknote size={18} /> }, // ادمن - ادارة - مالية
      { label: 'ميزانيات الفرق', href: '/dashboard/finance/budgets', icon: <PieChart size={18} /> }, // ادمن - ادارة - مالية
      { label: 'متابعة المصروفات', href: '/dashboard/finance/expenses', icon: <Receipt size={18} /> }, // ادمن - ادارة - مالية
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      
      {/* القائمة الجانبية */}
      <aside className="w-72 bg-slate-900 text-white hidden md:flex flex-col shadow-2xl z-20 overflow-y-auto custom-scrollbar">
        
        {/* الشعار */}
        <div className="p-6 border-b border-slate-800 shrink-0 sticky top-0 bg-slate-900 z-10">
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">G</div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">نظام GMS</h1>
              <p className="text-xs text-slate-400 group-hover:text-blue-200 transition-colors">إدارة الموارد المتكاملة</p>
            </div>
          </Link>
        </div>

        {/* روابط التنقل */}
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

        {/* زر الخروج */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-red-400 hover:bg-slate-800 w-full px-4 py-3 rounded-xl transition font-bold text-sm"
          >
            <LogOut size={18} className="rotate-180" /> <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* الترويسة */}
        <header className="h-20 bg-white border-b border-slate-200 flex justify-between items-center px-8 shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
             لوحة التحكم والعمليات
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-slate-100 rounded-full hover:bg-blue-50 text-slate-600 relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 left-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="text-left hidden sm:block">
                    <div className="text-sm font-bold text-slate-800">أحمد الغامدي</div>
                    <div className="text-xs text-slate-500">مدير النظام</div>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold shadow-md">أ</div>
            </div>
          </div>
        </header>

        {/* محتوى الصفحة */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}

// مكون المجموعة (Dropdown)
function SidebarGroup({ title, icon, items, pathname }: any) {
  // فتح القائمة تلقائياً إذا كان الرابط الحالي بداخلها
  const isActiveGroup = items.some((item: any) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(isActiveGroup);

  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-sm">{title}</span>
        </div>
        <ChevronLeft size={16} className={`transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
      </button>

      {/* الروابط الفرعية */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <div className="mr-4 pl-0 space-y-1 border-r-2 border-slate-800 pr-2">
          {items.map((item: any, idx: number) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={idx}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
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
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, ClipboardList, MapPin, DollarSign, FileText, LogOut, Bell } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // يمكنك هنا إضافة منطق تسجيل الخروج من Supabase إذا أردت
    router.push('/login');
  };

  return (
    // تم تغيير dir="rtl" إلى dir="ltr" ليتناسب مع اللغة الإنجليزية
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900" dir="ltr">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">G</div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">Admin Panel</h1>
            <p className="text-xs text-slate-400">System Management</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem href="/admin" icon={<Users size={20} />} label="Employees" active={pathname === '/admin'} />
          <SidebarItem href="/admin/tasks" icon={<ClipboardList size={20} />} label="Task Management" active={pathname === '/admin/tasks'} />
          
          <div className="pt-4 pb-2 text-xs text-slate-500 font-bold px-4 uppercase tracking-wider">Super Admin Tools</div>
          <SidebarItem href="/admin/map" icon={<MapPin size={20} />} label="Live Tracking" active={pathname === '/admin/map'} />
          <SidebarItem href="/admin/finance" icon={<DollarSign size={20} />} label="Financial Audit" active={pathname === '/admin/finance'} />
          <SidebarItem href="/admin/contracts" icon={<FileText size={20} />} label="Contracts & Projects" active={pathname === '/admin/contracts'} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 text-red-400 hover:bg-slate-800 w-full px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex justify-between items-center px-8 shadow-sm flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-slate-100 rounded-full hover:bg-blue-50 text-slate-600 relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center font-bold shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}

// Sidebar Link Component
function SidebarItem({ href, icon, label, active }: any) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
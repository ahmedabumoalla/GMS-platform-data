'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Wallet, 
  Map, 
  CheckSquare, 
  Settings, 
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';

// تعريف الأدوار
type UserRole = 'super_admin' | 'project_manager' | 'financial_advisor' | 'technician';

export default function Sidebar() {
  const pathname = usePathname();
  
  // 🔴🔴 غير هذا المتغير يدوياً لتجربة شكل القائمة لكل موظف 🔴🔴
  const [currentRole, setCurrentRole] = useState<UserRole>('super_admin'); 
  // جرب: 'technician' | 'financial_advisor' | 'super_admin'

  // تعريف القائمة مع تحديد الصلاحيات لكل رابط
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['super_admin', 'project_manager', 'financial_advisor', 'technician'] // الجميع
    },
    {
      name: 'Projects & Contracts',
      href: '/dashboard/contracts',
      icon: FileText,
      allowedRoles: ['super_admin', 'project_manager'] // المدراء فقط
    },
    {
      name: 'Tasks Management',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      allowedRoles: ['super_admin', 'project_manager', 'technician'] // المدراء والموظفين
    },
    {
      name: 'Financials',
      href: '/dashboard/finance',
      icon: Wallet,
      allowedRoles: ['super_admin', 'financial_advisor'] // الادمن والمحاسب فقط
    },
    {
      name: 'Team & Users',
      href: '/dashboard/users',
      icon: Users,
      allowedRoles: ['super_admin'] // الادمن فقط
    },
    {
      name: 'Live Map',
      href: '/dashboard/map',
      icon: Map,
      allowedRoles: ['super_admin', 'project_manager'] // المدراء فقط
    }
  ];

  // تصفية الروابط بناءً على الدور الحالي
  const filteredMenu = menuItems.filter(item => item.allowedRoles.includes(currentRole));

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50">
      
      {/* 1. Logo Area */}
      <div className="p-8 pb-4">
        <div className="text-2xl font-black tracking-tighter text-white">
          GMS<span className="text-blue-500">Platform</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold flex items-center gap-1">
          <ShieldAlert size={10} className="text-blue-500" />
          {currentRole.replace('_', ' ')} View
        </div>
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredMenu.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* 3. Bottom Section (Settings & Logout) */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Settings is usually for everyone or admins */}
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all">
          <Settings size={20} />
          Settings
        </Link>
        
        <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
          <LogOut size={20} />
          Sign Out
        </Link>
      </div>

    </aside>
  );
}
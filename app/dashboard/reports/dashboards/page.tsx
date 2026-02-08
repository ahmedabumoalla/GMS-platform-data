'use client';

import { LayoutDashboard, PieChart, Activity, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function DashboardsPage() {
  const boards = [
    { title: 'اللوحة التنفيذية', desc: 'نظرة شاملة للإدارة العليا', icon: LayoutDashboard, color: 'blue', href: '/dashboard' },
    { title: 'لوحة المشاريع', desc: 'متابعة سير العمل والإنجاز', icon: Activity, color: 'purple', href: '/dashboard/projects/progress' },
    { title: 'اللوحة المالية', desc: 'الإيرادات والمصروفات', icon: DollarSign, color: 'emerald', href: '/dashboard/finance/projects-cost' },
    { title: 'لوحة الموارد البشرية', desc: 'الرواتب والأداء', icon: PieChart, color: 'amber', href: '/dashboard/finance/payroll' },
  ];

  return (
    <div className="space-y-8" dir="rtl">
        <h1 className="text-2xl font-bold text-slate-800">مكتبة لوحات التحكم</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {boards.map((board, idx) => (
                <Link key={idx} href={board.href} className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex items-start gap-6 cursor-pointer">
                    <div className={`p-5 rounded-2xl bg-${board.color}-50 text-${board.color}-600 group-hover:scale-110 transition-transform`}>
                        <board.icon size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition">{board.title}</h3>
                        <p className="text-slate-500 leading-relaxed">{board.desc}</p>
                    </div>
                </Link>
            ))}
        </div>
    </div>
  );
}
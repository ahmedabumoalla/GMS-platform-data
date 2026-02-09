'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Phone, Mail, MoreHorizontal, 
  Briefcase, Star, BrainCircuit, LayoutGrid, List,
  ShieldCheck, AlertTriangle, Zap, CheckCircle2, Trophy, Loader2
} from 'lucide-react';

// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout'; 

// --- Types & Interfaces ---
type AvailabilityStatus = 'Available' | 'Assigned' | 'Overloaded' | 'On Leave';
type Role = 'Project Manager' | 'Site Engineer' | 'Technician' | 'Safety Officer';

interface TeamMember {
  id: string;
  name: string;
  role: Role;
  specialization: string;
  status: AvailabilityStatus;
  performanceScore: number; // System calculated 0-100
  projects: string[];
  skills: string[];
  workload: number; // 0-100%
  safetyStatus: 'Valid' | 'Expired' | 'Pending';
}

export default function EnterpriseWorkforcePage() {
  // ✅ استخدام اللغة من النظام العام
  const { lang } = useDashboard();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true); // إعادة تفعيل اللودينج عند تغيير اللغة
    setTimeout(() => {
      setMembers([
        { 
          id: 'EMP-101', name: lang === 'ar' ? 'م. أحمد الغامدي' : 'Eng. Ahmed Al-Ghamdi', 
          role: 'Project Manager', specialization: 'Electrical Infrastructure', 
          status: 'Assigned', performanceScore: 94, workload: 75,
          projects: [lang === 'ar' ? 'مشروع الورود' : 'Al-Wurud Project'],
          skills: ['PMP', 'Risk Mgmt', 'Primavera'],
          safetyStatus: 'Valid'
        },
        { 
          id: 'EMP-102', name: lang === 'ar' ? 'سعيد القحطاني' : 'Saeed Al-Qahtani', 
          role: 'Technician', specialization: 'HV Cables', 
          status: 'Overloaded', performanceScore: 88, workload: 95,
          projects: [lang === 'ar' ? 'مشروع المياه' : 'Water Project', lang === 'ar' ? 'صيانة طارئة' : 'Emergency Fix'],
          skills: ['Cable Jointing', 'Testing', 'Safety L2'],
          safetyStatus: 'Pending'
        },
        { 
          id: 'EMP-103', name: lang === 'ar' ? 'عمر فاروق' : 'Omar Farouk', 
          role: 'Site Engineer', specialization: 'Civil Works', 
          status: 'Available', performanceScore: 91, workload: 20,
          projects: [],
          skills: ['AutoCAD', 'Site Supervision', 'QA/QC'],
          safetyStatus: 'Valid'
        },
        { 
          id: 'EMP-104', name: lang === 'ar' ? 'ياسر الحربي' : 'Yasser Al-Harbi', 
          role: 'Safety Officer', specialization: 'HSE', 
          status: 'On Leave', performanceScore: 85, workload: 0,
          projects: [lang === 'ar' ? 'مشروع الكهرباء' : 'Power Project'],
          skills: ['OSHA', 'First Aid', 'Audit'],
          safetyStatus: 'Expired'
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]); // ✅ التحديث عند تغيير اللغة

  // --- Handlers ---
  const runAiOptimization = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiInsight(lang === 'ar' 
        ? 'تحليل القوى العاملة: "سعيد القحطاني" يواجه خطر الإجهاد (95% عبء عمل). يُنصح بنقل بعض مهامه إلى "عمر فاروق" المتوفر حالياً.' 
        : 'Workforce Analysis: "Saeed" is at burnout risk (95% load). Suggest reallocating tasks to "Omar" who is currently available.');
    }, 2000);
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Team Overview Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Users className="text-blue-600" />
              {lang === 'ar' ? 'إدارة القوى العاملة والفرق' : 'Workforce & Team Management'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'نظرة شاملة على الكفاءة، التوفر، والأداء التشغيلي' : 'Overview of capacity, availability, and operational performance'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             <button className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200" onClick={() => setViewMode('grid')}>
                <LayoutGrid size={18} className={viewMode === 'grid' ? 'text-blue-600' : ''} />
             </button>
             <button className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200" onClick={() => setViewMode('list')}>
                <List size={18} className={viewMode === 'list' ? 'text-blue-600' : ''} />
             </button>
             
             {/* زر التحليل الذكي */}
             <button 
                onClick={runAiOptimization}
                disabled={isAiAnalyzing}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 transition flex items-center gap-2"
             >
                {isAiAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16} />} 
                {isAiAnalyzing ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...') : (lang === 'ar' ? 'تحليل التوزيع الذكي' : 'AI Optimization')}
             </button>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'إجمالي الفريق' : 'Total Workforce'} value={members.length} sub={lang === 'ar' ? 'عضو' : 'Members'} color="blue" icon={Users} />
            <StatCard label={lang === 'ar' ? 'متاح حالياً' : 'Available Now'} value={members.filter(m => m.status === 'Available').length} sub={lang === 'ar' ? 'جاهز' : 'Ready'} color="green" icon={CheckCircle2} />
            <StatCard label={lang === 'ar' ? 'تحت ضغط' : 'Overloaded'} value={members.filter(m => m.status === 'Overloaded').length} sub={lang === 'ar' ? 'خطر' : 'Risk'} color="red" icon={Zap} />
            <StatCard label={lang === 'ar' ? 'متوسط الأداء' : 'Avg. Performance'} value="91%" sub={lang === 'ar' ? 'نقاط' : 'Score'} color="purple" icon={Trophy} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4" />
                <input type="text" placeholder={lang === 'ar' ? 'بحث بالاسم، المهارة، أو الدور...' : 'Search name, skill, role...'} className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-blue-500 transition" />
            </div>
            <FilterSelect label={lang === 'ar' ? 'الدور الوظيفي' : 'Role'} />
            <FilterSelect label={lang === 'ar' ? 'حالة التوفر' : 'Availability'} />
            <FilterSelect label={lang === 'ar' ? 'المهارات' : 'Skills'} />
        </div>

        {/* AI Insight Box */}
        {aiInsight && (
            <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm"><AlertTriangle size={18}/></div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">{aiInsight}</p>
            </div>
        )}
      </div>

      {/* --- Section 2 & 3: Enhanced Team Cards --- */}
      <div className="p-6">
        {loading ? (
            <div className="text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل بيانات الفريق...' : 'Loading workforce data...'}</div>
        ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {members.map(member => (
                    <div key={member.id} className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                        
                        {/* Status Stripe */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${getStatusColor(member.status)}`}></div>

                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center font-bold text-2xl text-slate-600">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-sm ${getStatusBadge(member.status)}`}>
                                            {member.status}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition">{member.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{member.role}</p>
                                        <p className="text-xs text-blue-600 mt-0.5">{member.specialization}</p>
                                    </div>
                                </div>
                                
                                {/* Performance Score (System Calculated) */}
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500"/>
                                        <span className="text-sm font-black text-slate-800">{member.performanceScore}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">{lang === 'ar' ? 'تقييم النظام' : 'System Score'}</span>
                                </div>
                            </div>

                            {/* Workload & Projects */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>{lang === 'ar' ? 'عبء العمل الحالي' : 'Current Workload'}</span>
                                        <span className={member.workload > 80 ? 'text-red-600' : 'text-slate-700'}>{member.workload}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${getWorkloadColor(member.workload)}`} style={{ width: `${member.workload}%` }}></div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {member.projects.length > 0 ? member.projects.map((prj, idx) => (
                                        <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded text-[10px] text-slate-600">
                                            <Briefcase size={10} className="text-slate-400"/> {prj}
                                        </div>
                                    )) : (
                                        <span className="text-xs text-slate-400 italic">{lang === 'ar' ? 'لا توجد مشاريع نشطة' : 'No active projects'}</span>
                                    )}
                                </div>
                            </div>

                            {/* Skills & Certs */}
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {member.skills.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                                        {skill}
                                    </span>
                                ))}
                                {member.safetyStatus === 'Expired' && (
                                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10px] font-bold border border-red-100 flex items-center gap-1">
                                        <ShieldCheck size={10}/> Expired Safety
                                    </span>
                                )}
                            </div>

                            {/* Actions Footer */}
                            <div className="pt-4 border-t border-slate-50 flex gap-2">
                                <button className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-300 transition flex items-center justify-center gap-2">
                                    <Briefcase size={14}/> {lang === 'ar' ? 'تعيين' : 'Assign'}
                                </button>
                                <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition">
                                    <Phone size={16}/>
                                </button>
                                <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition">
                                    <Mail size={16}/>
                                </button>
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}

// --- Helper Components & Functions ---

function StatCard({ label, value, sub, color, icon: Icon }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{value}</span>
                    <span className="text-xs text-slate-400 font-bold">{sub}</span>
                </div>
                <div className="text-xs font-bold text-slate-400">{label}</div>
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function FilterSelect({ label }: { label: string }) {
    return (
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            {label} <MoreHorizontal size={14} />
        </button>
    );
}

function getStatusColor(status: AvailabilityStatus) {
    switch (status) {
        case 'Available': return 'bg-emerald-500';
        case 'Assigned': return 'bg-blue-500';
        case 'Overloaded': return 'bg-red-500';
        case 'On Leave': return 'bg-slate-400';
    }
}

function getStatusBadge(status: AvailabilityStatus) {
    switch (status) {
        case 'Available': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Overloaded': return 'bg-red-100 text-red-700 border-red-200';
        case 'On Leave': return 'bg-slate-100 text-slate-600 border-slate-300';
    }
}

function getWorkloadColor(load: number) {
    if (load > 90) return 'bg-red-500';
    if (load > 70) return 'bg-amber-500';
    return 'bg-emerald-500';
}
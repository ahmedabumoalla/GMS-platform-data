'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Filter, Phone, Mail, MoreHorizontal, 
  Briefcase, Star, BrainCircuit, LayoutGrid, List,
  ShieldCheck, AlertTriangle, Zap, CheckCircle2, Trophy, Loader2,
  X, MessageSquare, ChevronDown, TrendingDown, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ استيراد الكونتكست العام
import { useDashboard } from '../../layout'; 

// --- Types & Interfaces ---
type AvailabilityStatus = 'Available' | 'Assigned' | 'Overloaded' | 'On Leave';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  job_title: string;
  specialization: string;
  status: AvailabilityStatus;
  performanceScore: number; 
  projects: string[];
  skills: string[];
  workload: number; // 0-100%
  safetyStatus: 'Valid' | 'Expired' | 'Pending';
  email: string;
  completedTasks: number;
  rejectedTasks: number;
  totalTasks: number;
}

export default function EnterpriseWorkforcePage() {
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // 🚀 حالة فتح نافذة تفاصيل الأداء
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);

  // --- 1. Fetch Real Data ---
  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      try {
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['technician', 'engineer']);
        
        if (profError) throw profError;

        if (profiles) {
            // جلب المهام لحساب الأداء والعبء
            const { data: assignments } = await supabase
                .from('task_assignments')
                .select('tech_id, status, projects(title)');

            const formattedMembers: TeamMember[] = profiles.map(profile => {
                const empTasks = assignments?.filter(a => a.tech_id === profile.id) || [];
                
                // حساب المهام النشطة
                const activeTasks = empTasks.filter(a => ['Pending', 'Accepted'].includes(a.status));
                const activeProjects = Array.from(new Set(activeTasks.map((t: any) => t.projects?.title).filter(Boolean)));
                
                // إحصائيات الأداء الحقيقية
                const totalTasks = empTasks.length;
                const completedTasks = empTasks.filter(a => a.status === 'Completed').length;
                const rejectedTasks = empTasks.filter(a => a.status === 'Rejected').length;

                // 🚀 معادلة ذكية لحساب تقييم الأداء من 100
                // يبدأ الموظف بـ 80 كنقطة أساس. الإنجاز يرفعها، والرفض ينزلها.
                let calculatedScore = 80; 
                if (totalTasks > 0) {
                    calculatedScore = Math.round(((completedTasks * 1.2) - (rejectedTasks * 0.5) / totalTasks) * 100);
                    // التأكد أن النسبة لا تتجاوز 100 ولا تقل عن 0
                    calculatedScore = Math.max(10, Math.min(100, calculatedScore)); 
                } else if (profile.completion_rate) {
                    calculatedScore = profile.completion_rate;
                } else {
                    calculatedScore = 100; // موظف جديد ليس لديه مهام
                }

                // حساب عبء العمل
                let workload = Math.min(activeTasks.length * 25, 100);
                
                let status: AvailabilityStatus = 'Available';
                if (workload >= 80) status = 'Overloaded';
                else if (workload > 0) status = 'Assigned';

                return {
                    id: profile.id,
                    name: profile.full_name || 'Unknown',
                    role: profile.role,
                    job_title: profile.job_title || (isRTL ? 'غير محدد' : 'N/A'),
                    specialization: profile.specialization || (isRTL ? 'عام' : 'General'),
                    status,
                    performanceScore: calculatedScore,
                    projects: activeProjects,
                    skills: profile.skills || ['Safety First', 'Technical Expert'],
                    workload,
                    safetyStatus: 'Valid', 
                    email: profile.email || '',
                    completedTasks,
                    rejectedTasks,
                    totalTasks
                };
            });

            // ترتيب بحيث يظهر المتاحون أولاً ثم المشغولين
            formattedMembers.sort((a, b) => a.workload - b.workload);

            setMembers(formattedMembers);
            setFilteredMembers(formattedMembers);
        }
      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user]);

  // --- 2. Search & Filter ---
  useEffect(() => {
      if (!searchQuery.trim()) {
          setFilteredMembers(members);
      } else {
          const q = searchQuery.toLowerCase();
          setFilteredMembers(members.filter(m => 
              m.name.toLowerCase().includes(q) || 
              m.job_title.toLowerCase().includes(q) ||
              m.specialization.toLowerCase().includes(q)
          ));
      }
  }, [searchQuery, members]);

  // --- 3. Handlers ---
  const runAiOptimization = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      
      const overloaded = members.filter(m => m.status === 'Overloaded');
      const lowPerformance = members.filter(m => m.performanceScore < 60);

      if (overloaded.length > 0) {
          setAiInsight(isRTL 
            ? `تحليل القوى العاملة: "${overloaded[0].name}" يواجه خطر الإجهاد (${overloaded[0].workload}% عبء عمل). يُنصح بنقل بعض مهامه.` 
            : `Workforce Analysis: "${overloaded[0].name}" is at burnout risk (${overloaded[0].workload}% load). Suggest reallocating tasks.`);
      } else if (lowPerformance.length > 0) {
          setAiInsight(isRTL 
            ? `تنبيه أداء: الموظف "${lowPerformance[0].name}" لديه نسبة أداء منخفضة (${lowPerformance[0].performanceScore}%). يرجى مراجعة المهام المرفوضة.` 
            : `Performance Alert: "${lowPerformance[0].name}" has low performance (${lowPerformance[0].performanceScore}%). Review rejected tasks.`);
      } else {
          setAiInsight(isRTL ? `توزيع الموارد ومعدل الأداء مثالي ومستقر حالياً.` : `Resource allocation and performance are currently optimal and stable.`);
      }
    }, 2000);
  };

  const handleMessage = (empName: string) => {
      router.push(`/dashboard/communication/chat?user=${encodeURIComponent(empName)}`);
  };

  // 🚀 حساب المتوسط الحقيقي
  const averagePerformance = members.length > 0 
      ? Math.round(members.reduce((acc, curr) => acc + curr.performanceScore, 0) / members.length)
      : 0;

  // --- Styles ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Team Overview Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="w-full md:w-auto">
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Users className="text-blue-600" />
              {isRTL ? 'إدارة القوى العاملة والفرق' : 'Workforce & Team Management'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
              {isRTL ? 'نظرة شاملة على الكفاءة، التوفر، والأداء التشغيلي' : 'Overview of capacity, availability, and operational performance'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className={`h-8 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
             <button className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600') : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200')}`} onClick={() => setViewMode('grid')}>
                <LayoutGrid size={18} />
             </button>
             <button className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? (isDark ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 text-blue-600') : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200')}`} onClick={() => setViewMode('list')}>
                <List size={18} />
             </button>
             
             {/* زر التحليل الذكي */}
             <button 
                onClick={runAiOptimization}
                disabled={isAiAnalyzing || members.length === 0}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 flex-1 md:flex-none"
             >
                {isAiAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16} />} 
                {isAiAnalyzing ? (isRTL ? 'جاري التحليل...' : 'Analyzing...') : (isRTL ? 'تحليل التوزيع الذكي' : 'AI Optimization')}
             </button>
          </div>
        </div>

        {/* 🚀 Global Summary Stats (مع تفعيل زر النقر لمعرفة تفاصيل الأداء) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard isDark={isDark} label={isRTL ? 'إجمالي الفريق' : 'Total Workforce'} value={filteredMembers.length} sub={isRTL ? 'عضو' : 'Members'} color="blue" icon={Users} />
            <StatCard isDark={isDark} label={isRTL ? 'متاح حالياً' : 'Available Now'} value={filteredMembers.filter(m => m.status === 'Available').length} sub={isRTL ? 'جاهز' : 'Ready'} color="green" icon={CheckCircle2} />
            <StatCard isDark={isDark} label={isRTL ? 'تحت ضغط' : 'Overloaded'} value={filteredMembers.filter(m => m.status === 'Overloaded').length} sub={isRTL ? 'خطر' : 'Risk'} color="red" icon={Zap} />
            
            {/* 🚀 هذه البطاقة أصبحت قابلة للنقر لتفتح تفاصيل الخلل */}
            <StatCard 
                isDark={isDark} 
                label={isRTL ? 'متوسط الأداء (انقر للتفاصيل)' : 'Avg. Performance (Click)'} 
                value={`${averagePerformance}%`} 
                sub={isRTL ? 'حقيقي' : 'Real'} 
                color="purple" 
                icon={Trophy} 
                onClick={() => setIsPerformanceModalOpen(true)}
            />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-2.5 text-slate-400 w-4 h-4`} />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRTL ? 'بحث بالاسم، التخصص، أو الدور...' : 'Search name, skill, role...'} 
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'}`} 
                />
            </div>
            <FilterSelect isDark={isDark} label={isRTL ? 'الدور الوظيفي' : 'Role'} />
            <FilterSelect isDark={isDark} label={isRTL ? 'حالة التوفر' : 'Availability'} />
        </div>

        {/* AI Insight Box */}
        <AnimatePresence>
            {aiInsight && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                    <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-sm shrink-0"><AlertTriangle size={18}/></div>
                    <p className={`text-sm font-medium leading-relaxed mt-1 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>{aiInsight}</p>
                    <button onClick={() => setAiInsight(null)} className={`mr-auto p-1 rounded-full ${isDark ? 'text-indigo-400 hover:bg-indigo-900/50' : 'text-indigo-400 hover:bg-indigo-100'}`}>
                        <X size={16}/>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* --- Section 2: Enhanced Team Cards --- */}
      <div className="p-6">
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : filteredMembers.length === 0 ? (
            <div className={`text-center py-20 font-medium ${textSub}`}>
                {isRTL ? 'لا يوجد أعضاء مطابقين للبحث.' : 'No team members found.'}
            </div>
        ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredMembers.map(member => (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} key={member.id} className={`group rounded-2xl border transition-all duration-300 relative overflow-hidden ${cardBg} ${viewMode === 'list' ? 'flex flex-row items-center p-0' : 'hover:-translate-y-1 hover:shadow-xl'}`}>
                        
                        {/* Status Stripe */}
                        <div className={`absolute ${viewMode === 'list' ? 'left-0 top-0 bottom-0 w-1.5' : 'top-0 left-0 right-0 h-1.5'} ${getStatusColor(member.status)}`}></div>

                        <div className={`p-6 ${viewMode === 'list' ? 'flex-1 flex items-center justify-between border-b-0 border-l border-slate-200 dark:border-slate-800' : ''}`}>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={`w-14 h-14 rounded-2xl border-2 shadow-sm flex items-center justify-center font-black text-xl uppercase ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-white text-slate-600'}`}>
                                            {member.name.charAt(0)}
                                        </div>
                                        <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-sm ${getStatusBadge(member.status, isDark)}`}>
                                            {isRTL && member.status === 'Available' ? 'متاح' : 
                                             isRTL && member.status === 'Assigned' ? 'مشغول جزئياً' :
                                             isRTL && member.status === 'Overloaded' ? 'مضغوط' : 
                                             member.status}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-bold leading-tight group-hover:text-blue-500 transition ${textMain}`}>{member.name}</h3>
                                        <p className={`text-xs font-medium uppercase tracking-wide mt-1 ${textSub}`}>{member.job_title}</p>
                                        <p className="text-xs text-blue-500 font-bold mt-0.5">{member.specialization}</p>
                                    </div>
                                </div>
                                
                                {/* Performance Score */}
                                <div className="flex flex-col items-end">
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                                        member.performanceScore >= 80 ? (isDark ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-100') :
                                        member.performanceScore >= 50 ? (isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-100') :
                                        (isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100')
                                    }`}>
                                        <Star size={14} className={member.performanceScore >= 80 ? 'text-emerald-500 fill-emerald-500' : member.performanceScore >= 50 ? 'text-amber-500 fill-amber-500' : 'text-red-500 fill-red-500'}/>
                                        <span className={`text-sm font-black ${
                                            member.performanceScore >= 80 ? 'text-emerald-700 dark:text-emerald-400' :
                                            member.performanceScore >= 50 ? 'text-amber-700 dark:text-amber-400' :
                                            'text-red-700 dark:text-red-400'
                                        }`}>{member.performanceScore}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Workload & Projects */}
                            <div className="space-y-4 mb-5">
                                <div>
                                    <div className={`flex justify-between text-xs font-bold mb-1 ${textSub}`}>
                                        <span>{isRTL ? 'عبء العمل' : 'Workload'}</span>
                                        <span className={member.workload >= 80 ? 'text-red-500' : textMain}>{member.workload}%</span>
                                    </div>
                                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <div className={`h-full rounded-full transition-all duration-1000 ${getWorkloadColor(member.workload)}`} style={{ width: `${member.workload}%` }}></div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {member.projects.length > 0 ? member.projects.map((prj, idx) => (
                                        <div key={idx} className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[10px] font-bold ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <Briefcase size={12} className="text-blue-500"/> {prj}
                                        </div>
                                    )) : (
                                        <span className={`text-xs italic ${textSub}`}>{isRTL ? 'لا توجد مشاريع نشطة' : 'No active projects'}</span>
                                    )}
                                </div>
                            </div>

                            {/* Skills & Certs */}
                            <div className="flex flex-wrap gap-1.5 mb-6">
                                {member.skills.map((skill, idx) => (
                                    <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${isDark ? 'bg-blue-900/20 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            {/* Actions Footer */}
                            <div className={`pt-4 border-t flex gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                                <button onClick={() => router.push('/dashboard/projects/assign')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600'}`}>
                                    <Briefcase size={14}/> {isRTL ? 'إسناد لمشروع' : 'Assign'}
                                </button>
                                <button onClick={() => handleMessage(member.name)} className={`p-2.5 rounded-xl transition flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>
                                    <MessageSquare size={16}/>
                                </button>
                            </div>

                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>

      {/* 🚀 Modal: تفاصيل الأداء لمعرفة الضعف والخلل */}
      <AnimatePresence>
        {isPerformanceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                    
                    <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div>
                            <h3 className={`text-xl font-black flex items-center gap-2 ${textMain}`}><Trophy className="text-purple-500"/> {isRTL ? 'تفاصيل أداء الفريق' : 'Team Performance Details'}</h3>
                            <p className={`text-xs mt-1 ${textSub}`}>{isRTL ? 'تحليل مبني على المهام المنجزة والمرفوضة' : 'Analysis based on completed and rejected tasks'}</p>
                        </div>
                        <button onClick={() => setIsPerformanceModalOpen(false)} className={`p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {/* 🚀 نرتب الموظفين من الأسوأ للأفضل لمعرفة الخلل فوراً */}
                        {[...members].sort((a, b) => a.performanceScore - b.performanceScore).map(member => (
                            <div key={member.id} className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-inner ${member.performanceScore >= 80 ? 'bg-emerald-100 text-emerald-600' : member.performanceScore >= 50 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                            {member.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${textMain}`}>{member.name}</h4>
                                        <div className={`text-xs mt-1 font-medium ${member.performanceScore < 60 ? 'text-red-500' : textSub}`}>
                                            {member.performanceScore < 60 ? (isRTL ? 'يوجد خلل وضعف في الإنجاز!' : 'Poor performance detected!') : member.job_title}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="flex gap-4 text-center">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'مكتملة' : 'Done'}</div>
                                            <div className="font-black text-emerald-500">{member.completedTasks}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'مرفوضة' : 'Rejected'}</div>
                                            <div className={`font-black ${member.rejectedTasks > 0 ? 'text-red-500' : textMain}`}>{member.rejectedTasks}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'الإجمالي' : 'Total'}</div>
                                            <div className={`font-black ${textMain}`}>{member.totalTasks}</div>
                                        </div>
                                    </div>

                                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${
                                        member.performanceScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' :
                                        member.performanceScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                    }`}>
                                        {member.performanceScore >= 80 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                        <span className="font-black text-lg">{member.performanceScore}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Helper Components & Functions ---

function StatCard({ label, value, sub, color, icon: Icon, isDark, onClick }: any) {
    const colors: any = {
        blue: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100',
        green: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-100',
        red: isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100',
        purple: isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-pointer hover:shadow-lg hover:-translate-y-1' : 'bg-purple-50 text-purple-600 border-purple-100 cursor-pointer hover:shadow-md hover:-translate-y-1',
    };

    return (
        <div 
            onClick={onClick}
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} ${onClick ? (isDark ? 'hover:border-purple-500 cursor-pointer' : 'hover:border-purple-300 cursor-pointer shadow-sm hover:shadow-md') : ''}`}
        >
            <div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{value}</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</span>
                </div>
                <div className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
            </div>
            <div className={`p-3 rounded-xl border ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

function FilterSelect({ label, isDark }: { label: string, isDark: boolean }) {
    return (
        <button className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {label} <ChevronDown size={14} />
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

function getStatusBadge(status: AvailabilityStatus, isDark: boolean) {
    switch (status) {
        case 'Available': return isDark ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Assigned': return isDark ? 'bg-blue-900/40 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Overloaded': return isDark ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200';
        case 'On Leave': return isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-300';
    }
}

function getWorkloadColor(load: number) {
    if (load >= 80) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    if (load >= 50) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
    if (load > 0) return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
    return 'bg-emerald-500';
}
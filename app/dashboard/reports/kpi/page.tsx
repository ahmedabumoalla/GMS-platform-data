'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Search, Filter, Download, Star, TrendingUp, TrendingDown,
  Clock, CheckCircle2, AlertTriangle, ShieldCheck, Calendar,
  Loader2, X, FileText, Target, Activity, Award, UserCheck
} from 'lucide-react';
import { useDashboard } from '../../layout'; // مسار صحيح من مجلد reports/kpi

// --- Types ---
type RatingLevel = 'Excellent' | 'Good' | 'Average' | 'Poor';

interface EmployeePerformance {
  id: string;
  name: string;
  role: string;
  rawRole: string;
  department: string;
  
  // Field Metrics (From Tasks)
  totalTasksAssigned: number;
  tasksCompleted: number;
  onTimeRate: number; // %
  fieldQualityScore: number; // out of 10
  
  // HR/Admin Metrics (From Evaluations)
  technicalScore: number; // out of 10
  behaviorScore: number; // out of 10
  attendanceScore: number; // out of 10
  
  // Overall
  overallScore: number; // out of 10
  ratingLevel: RatingLevel;
}

export default function KPIPage() {
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [period, setPeriod] = useState(new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' }));
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformance | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // --- Translations ---
  const t = {
    ar: {
      title: 'مؤشرات أداء الموظفين (KPIs)',
      subtitle: 'مراقبة الكفاءة الميدانية، الالتزام بالوقت، والتقييم الإداري الشامل',
      search: 'بحث باسم الموظف أو المسمى...',
      export: 'تصدير التقارير',
      loading: 'جاري جلب وتحليل بيانات الأداء...',
      kpis: {
        totalStaff: 'إجمالي الموظفين',
        topPerformers: 'المتميزين (ممتاز)',
        needsTraining: 'بحاجة لتدريب',
        avgScore: 'متوسط الأداء العام'
      },
      table: {
        employee: 'الموظف',
        tasks: 'إنجاز المهام',
        onTime: 'الالتزام بالوقت',
        fieldQA: 'الجودة الميدانية',
        overall: 'التقييم العام',
        rating: 'التصنيف',
        actions: 'التفاصيل'
      },
      drawer: {
        title: 'الملف الشامل لأداء الموظف',
        close: 'إغلاق',
        fieldStats: 'الإحصائيات الميدانية',
        hrStats: 'التقييم الإداري (HR)',
        tech: 'المهارة الفنية',
        behavior: 'السلوك والتعاون',
        attendance: 'الالتزام والحضور',
        outOf10: 'من 10'
      },
      ratings: {
        Excellent: 'ممتاز',
        Good: 'جيد جداً',
        Average: 'متوسط',
        Poor: 'ضعيف'
      }
    },
    en: {
      title: 'Employee Performance KPIs',
      subtitle: 'Monitor field efficiency, time adherence, and comprehensive admin evaluations',
      search: 'Search by name or role...',
      export: 'Export Reports',
      loading: 'Fetching and analyzing performance data...',
      kpis: {
        totalStaff: 'Total Staff',
        topPerformers: 'Top Performers',
        needsTraining: 'Needs Training',
        avgScore: 'Company Avg Score'
      },
      table: {
        employee: 'Employee',
        tasks: 'Task Completion',
        onTime: 'On-Time Rate',
        fieldQA: 'Field QA',
        overall: 'Overall Score',
        rating: 'Rating',
        actions: 'Details'
      },
      drawer: {
        title: 'Comprehensive Performance Profile',
        close: 'Close',
        fieldStats: 'Field Statistics',
        hrStats: 'HR Evaluation',
        tech: 'Technical Skill',
        behavior: 'Behavior & Teamwork',
        attendance: 'Attendance',
        outOf10: 'out of 10'
      },
      ratings: {
        Excellent: 'Excellent',
        Good: 'Very Good',
        Average: 'Average',
        Poor: 'Poor'
      }
    }
  }[(lang as 'ar' | 'en') || 'ar'];

  // --- 1. Fetch & Compute Data (Fault-Tolerant) ---
  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        // 🚀 جلب كل جدول بشكل منفصل تماماً حتى لو فشل أحدهم لا تتعطل الصفحة
        
        // 1. جلب الموظفين (الأساس)
        const { data: profData, error: profError } = await supabase.from('profiles').select('*');
        if (profError) console.error("Profiles error:", profError.message);
        let dbProfiles = profData || [];

        // إخفاء الإدارة العليا من التقييم
        dbProfiles = dbProfiles.filter(p => p.role !== 'admin' && p.role !== 'super_admin');

        // 2. جلب المهام
        const { data: taskData, error: taskError } = await supabase.from('task_assignments').select('*');
        if (taskError) console.error("Tasks error:", taskError.message);
        const dbTasks = taskData || [];

        // 3. جلب التقييمات
        const { data: evalData, error: evalError } = await supabase.from('employee_evaluations').select('*').eq('period', period);
        if (evalError) console.error("Evals error:", evalError.message);
        const dbEvals = evalData || [];

        // حساب الأداء لكل موظف
        const computedData: EmployeePerformance[] = dbProfiles.map(prof => {
          // 1. حساب الإحصائيات من المهام (إن وجدت)
          const userTasks = dbTasks.filter(t => t.tech_id === prof.id);
          const totalTasksAssigned = userTasks.length;
          const completedTasks = userTasks.filter(t => t.status === 'Completed' || t.status === 'Approved');
          const tasksCompleted = completedTasks.length;
          
          const onTimeTasks = completedTasks.filter(t => !t.due_date || new Date(t.completed_at || t.created_at || new Date()) <= new Date(t.due_date));
          const onTimeRate = tasksCompleted > 0 ? Math.round((onTimeTasks.length / tasksCompleted) * 100) : 100;
          
          const qaSum = userTasks.reduce((acc, t) => acc + (Number(t.qa_score) || 10), 0);
          const fieldQualityScore = totalTasksAssigned > 0 ? Number((qaSum / totalTasksAssigned).toFixed(1)) : 10;

          // 2. جلب التقييم الإداري (أو وضع 10 كافتراضي إذا لم يتم تقييمه بعد)
          const userEval = dbEvals.find(e => e.employee_id === prof.id);
          const technicalScore = userEval ? Number(userEval.technical_score) : 10;
          const behaviorScore = userEval ? Number(userEval.behavior_score) : 10;
          const attendanceScore = userEval ? Number(userEval.attendance_score) : 10;

          // 3. الحساب النهائي
          const hrAverage = (technicalScore + behaviorScore + attendanceScore) / 3;
          const fieldAverage = ((onTimeRate / 10) + fieldQualityScore) / 2; 
          
          let overallScore = Number(((hrAverage + fieldAverage) / 2).toFixed(1));
          
          if (totalTasksAssigned === 0) overallScore = Number(hrAverage.toFixed(1));

          let ratingLevel: RatingLevel = 'Excellent';
          if (overallScore < 6) ratingLevel = 'Poor';
          else if (overallScore < 8) ratingLevel = 'Average';
          else if (overallScore < 9) ratingLevel = 'Good';

          return {
            id: prof.id,
            name: prof.full_name || (isRTL ? 'مستخدم مجهول' : 'Unknown User'),
            role: prof.job_title || (isRTL ? (prof.role === 'technician' ? 'فني' : prof.role === 'engineer' ? 'مهندس' : 'موظف') : prof.role),
            rawRole: prof.role || 'user',
            department: prof.department || (isRTL ? 'عام' : 'General'),
            totalTasksAssigned,
            tasksCompleted,
            onTimeRate,
            fieldQualityScore,
            technicalScore,
            behaviorScore,
            attendanceScore,
            overallScore,
            ratingLevel
          };
        });

        setEmployees(computedData.sort((a, b) => b.overallScore - a.overallScore));

      } catch (error: any) {
        console.error("Critical error in fetch:", error.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [period, isRTL]);

  // --- Handlers ---
  const handleOpenDrawer = (emp: EmployeePerformance) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'All' || emp.rawRole.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  // --- Metrics ---
  const totalStaff = employees.length;
  const topPerformersCount = employees.filter(e => e.ratingLevel === 'Excellent').length;
  const needsTrainingCount = employees.filter(e => e.ratingLevel === 'Poor' || e.ratingLevel === 'Average').length;
  const avgCompanyScore = employees.length > 0 ? (employees.reduce((acc, e) => acc + e.overallScore, 0) / employees.length).toFixed(1) : '0.0';

  // --- Styling Helpers ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  const getRatingBadge = (rating: RatingLevel) => {
    const config = {
      'Excellent': { color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800', icon: Award },
      'Good': { color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800', icon: Star },
      'Average': { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800', icon: Activity },
      'Poor': { color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800', icon: AlertTriangle }
    };
    const { color, icon: Icon } = config[rating];
    const label = t.ratings[rating];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${color}`}>
        <Icon size={14}/> {label}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-emerald-500';
    if (score >= 7.5) return 'text-blue-500';
    if (score >= 6) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Target className="text-blue-600" /> {t.title}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>{t.subtitle}</p>
          </div>
          
          <div className="flex gap-2">
             <div className={`rounded-xl px-3 py-1.5 flex items-center gap-2 border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                <Calendar size={14} className="text-slate-500"/>
                <span className="text-xs font-bold">{period}</span>
             </div>
             <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 shadow-lg flex items-center gap-2 transition active:scale-95">
                <Download size={16} /> {t.export}
             </button>
          </div>
        </div>

        {/* --- Top Level KPIs --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard isDark={isDark} label={t.kpis.totalStaff} value={totalStaff} icon={Users} color="blue" />
          <StatCard isDark={isDark} label={t.kpis.topPerformers} value={topPerformersCount} icon={Award} color="emerald" />
          <StatCard isDark={isDark} label={t.kpis.needsTraining} value={needsTrainingCount} icon={AlertTriangle} color="amber" />
          <StatCard isDark={isDark} label={t.kpis.avgScore} value={`${avgCompanyScore} / 10`} icon={Activity} color="purple" highlight />
        </div>

        {/* --- Filters & Search --- */}
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar items-center">
            <div className="relative min-w-[250px]">
                <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                    type="text" placeholder={t.search} 
                    className={`w-full rounded-xl py-2 text-xs outline-none transition border ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className={`h-6 w-px mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            {['All', 'technician', 'engineer'].map(role => {
                const label = role === 'All' ? (isRTL ? 'الكل' : 'All') : role === 'technician' ? (isRTL ? 'الفنيين' : 'Technicians') : (isRTL ? 'المهندسين' : 'Engineers');
                return (
                    <button 
                        key={role} onClick={() => setRoleFilter(role)} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${roleFilter === role ? (isDark ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700') : (isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')}`}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
      </div>

      {/* --- Main Table: Employee Performance List --- */}
      <div className="p-6">
        <div className={`rounded-3xl border shadow-sm overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
              <thead className={`text-xs font-bold border-b uppercase tracking-wider ${isDark ? 'bg-slate-900/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                <tr>
                  <th className="p-4 px-6">{t.table.employee}</th>
                  <th className="p-4 text-center">{t.table.tasks}</th>
                  <th className="p-4 text-center">{t.table.onTime}</th>
                  <th className="p-4 text-center">{t.table.fieldQA}</th>
                  <th className="p-4 text-center">{t.table.overall}</th>
                  <th className="p-4">{t.table.rating}</th>
                  <th className={`p-4 px-6 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.actions}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-50'}`}>
                {loading ? (
                    <tr><td colSpan={7} className="p-16 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto mb-2" size={30}/> <span className={textSub}>{t.loading}</span></td></tr>
                ) : filteredEmployees.length === 0 ? (
                    <tr><td colSpan={7} className={`p-10 text-center font-medium ${textSub}`}>لا توجد بيانات مطابقة للموظفين</td></tr>
                ) : filteredEmployees.map((emp) => (
                  <tr key={emp.id} className={`transition group ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border shadow-inner ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-white'}`}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className={`font-bold ${textMain}`}>{emp.name}</div>
                          <div className={`text-[10px] mt-0.5 ${textSub}`}>{emp.role} • {emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`font-bold ${textMain}`}>{emp.tasksCompleted} <span className={`text-[10px] font-normal ${textSub}`}>/ {emp.totalTasksAssigned}</span></div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`font-black ${emp.onTimeRate >= 90 ? 'text-emerald-500' : emp.onTimeRate >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{emp.onTimeRate}%</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`font-black ${getScoreColor(emp.fieldQualityScore)}`}>{emp.fieldQualityScore}</div>
                    </td>
                    <td className="p-4 text-center">
                       <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-4 font-black text-lg shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white'} ${getScoreColor(emp.overallScore)} ${emp.overallScore >= 9 ? 'border-emerald-100 dark:border-emerald-900/50' : emp.overallScore >= 7.5 ? 'border-blue-100 dark:border-blue-900/50' : emp.overallScore >= 6 ? 'border-amber-100 dark:border-amber-900/50' : 'border-red-100 dark:border-red-900/50'}`}>
                           {emp.overallScore}
                       </div>
                    </td>
                    <td className="p-4">
                      {getRatingBadge(emp.ratingLevel)}
                    </td>
                    <td className={`p-4 px-6 ${isRTL ? 'text-left' : 'text-right'}`}>
                      <button 
                        onClick={() => handleOpenDrawer(emp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto border ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-blue-600 hover:bg-blue-50'}`}
                      >
                        <FileText size={14}/> {t.table.actions}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Detail Drawer (Deep Dive into Employee Performance) --- */}
      {isDrawerOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm p-4">
            <div className={`w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            {getRatingBadge(selectedEmployee.ratingLevel)}
                        </div>
                        <h2 className={`text-xl font-black ${textMain}`}>{selectedEmployee.name}</h2>
                        <div className={`text-xs mt-1 font-medium ${textSub}`}>{selectedEmployee.role} • {selectedEmployee.department}</div>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className={`p-2 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-200 text-slate-500 shadow-sm border border-slate-100'}`}><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Big Score Card */}
                    <div className="flex items-center gap-6 justify-center">
                        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center border-[8px] shadow-inner ${selectedEmployee.overallScore >= 9 ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : selectedEmployee.overallScore >= 7.5 ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : selectedEmployee.overallScore >= 6 ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-red-400 bg-red-50 dark:bg-red-900/20'}`}>
                            <div className="text-center">
                                <div className={`text-4xl font-black leading-none ${getScoreColor(selectedEmployee.overallScore)}`}>{selectedEmployee.overallScore}</div>
                                <div className={`text-[10px] font-bold mt-1 ${textSub}`}>{t.drawer.outOf10}</div>
                            </div>
                        </div>
                    </div>

                    {/* Field Stats Section */}
                    <div>
                        <h4 className={`font-black mb-4 text-sm flex items-center gap-2 ${textMain}`}>
                            <Target size={16} className="text-blue-500"/> {t.drawer.fieldStats}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-xs font-bold mb-1 ${textSub}`}>{t.table.tasks}</div>
                                <div className={`text-2xl font-black ${textMain}`}>{selectedEmployee.tasksCompleted} <span className="text-sm font-normal text-slate-400">/ {selectedEmployee.totalTasksAssigned}</span></div>
                            </div>
                            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-xs font-bold mb-1 ${textSub}`}>{t.table.onTime}</div>
                                <div className={`text-2xl font-black ${selectedEmployee.onTimeRate >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedEmployee.onTimeRate}%</div>
                            </div>
                            <div className={`col-span-2 p-4 rounded-2xl border flex justify-between items-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div className={`text-xs font-bold ${textSub}`}>{t.table.fieldQA}</div>
                                <div className={`text-xl font-black ${getScoreColor(selectedEmployee.fieldQualityScore)}`}>{selectedEmployee.fieldQualityScore} <span className="text-xs text-slate-400">/ 10</span></div>
                            </div>
                        </div>
                    </div>

                    {/* HR Evaluations Section */}
                    <div>
                        <h4 className={`font-black mb-4 text-sm flex items-center gap-2 ${textMain}`}>
                            <UserCheck size={16} className="text-purple-500"/> {t.drawer.hrStats}
                        </h4>
                        <div className="space-y-3">
                            {/* Technical */}
                            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <span className={`text-sm font-bold ${textSub}`}>{t.drawer.tech}</span>
                                <div className="flex items-center gap-3">
                                    <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(selectedEmployee.technicalScore / 10) * 100}%` }}></div>
                                    </div>
                                    <span className={`font-black text-sm w-6 text-center ${textMain}`}>{selectedEmployee.technicalScore}</span>
                                </div>
                            </div>
                            {/* Behavior */}
                            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <span className={`text-sm font-bold ${textSub}`}>{t.drawer.behavior}</span>
                                <div className="flex items-center gap-3">
                                    <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(selectedEmployee.behaviorScore / 10) * 100}%` }}></div>
                                    </div>
                                    <span className={`font-black text-sm w-6 text-center ${textMain}`}>{selectedEmployee.behaviorScore}</span>
                                </div>
                            </div>
                            {/* Attendance */}
                            <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <span className={`text-sm font-bold ${textSub}`}>{t.drawer.attendance}</span>
                                <div className="flex items-center gap-3">
                                    <div className={`w-24 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(selectedEmployee.attendanceScore / 10) * 100}%` }}></div>
                                    </div>
                                    <span className={`font-black text-sm w-6 text-center ${textMain}`}>{selectedEmployee.attendanceScore}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className={`p-5 border-t ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                    <button onClick={() => setIsDrawerOpen(false)} className={`w-full py-3 rounded-xl font-bold text-sm transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                        {t.drawer.close}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function StatCard({ label, value, color, icon: Icon, highlight, isDark }: any) {
    const colors: any = {
        blue: isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: isDark ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-50 text-amber-600 border-amber-100',
        purple: isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-100',
    };
    return (
        <div className={`p-4 rounded-2xl border flex flex-col justify-between h-28 transition-all ${highlight ? (isDark ? 'bg-slate-800 border-slate-700 shadow-lg' : 'bg-slate-900 text-white border-slate-900 shadow-xl') : (isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100')}`}>
            <div className="flex justify-between items-start mb-2">
                <div className={`text-xs font-bold ${highlight ? (isDark ? 'text-slate-300' : 'text-slate-400') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{label}</div>
                <div className={`p-2 rounded-xl border ${highlight ? (isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800 border-slate-700 text-white') : colors[color]}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className={`text-2xl font-black ${highlight ? 'text-white' : (isDark ? 'text-white' : 'text-slate-900')}`}>{value}</div>
        </div>
    );
}
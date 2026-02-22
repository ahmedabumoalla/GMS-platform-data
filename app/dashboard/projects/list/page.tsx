'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Briefcase, Users, DollarSign, MapPin, Loader2, Calendar, 
  ChevronDown, ChevronUp, Box, Receipt, Wallet, Activity, UserCheck 
} from 'lucide-react';
import { useDashboard } from '../../layout';
import { motion, AnimatePresence } from 'framer-motion';

interface SpendingBreakdown {
  custody: number;
  expense: number;
  material: number;
  other: number;
}

interface EnrichedProject {
  id: string;
  title: string;
  status: string;
  manager_name: string;
  location_name: string;
  start_date: string;
  budget: number;
  teamCount: number;
  totalSpent: number;
  spendingBreakdown: SpendingBreakdown;
}

export default function ProjectsListPage() {
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';

  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectsAndStats = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 1. جلب جميع المشاريع
        let query = supabase
          .from('projects')
          .select('id, title, status, manager_name, location_name, start_date, budget')
          .order('created_at', { ascending: false });

        const { data: allProjects, error: projError } = await query;
        if (projError) throw projError;

        if (!allProjects) {
          setProjects([]);
          return;
        }

        // 2. جلب الإسنادات التي يكون المستخدم مسندة له المهام
        const { data: myAssignments, error: assignError } = await supabase
          .from('task_assignments')
          .select('project_id')
          .eq('tech_id', user.id);

        if (assignError) throw assignError;

        const myProjectIds = myAssignments?.map(a => a.project_id) || [];

        // 3. تصفية المشاريع بناءً على الصلاحيات
        let filteredProjects = allProjects;

        if (user.role === 'project_manager') {
          // مدير المشروع يرى:
          // أ. مشاريعه التي يدير فيها (manager_name)
          // ب. المشاريع التي تم تسجيله كفني فيها (أقل شيوعاً لكن ممكن)
          filteredProjects = allProjects.filter(p => 
            p.manager_name?.toLowerCase().includes(user.full_name?.toLowerCase() || '') ||
            myProjectIds.includes(p.id)
          );
        } else if (user.role === 'technician' || user.role === 'engineer') {
          // الفني يرى فقط المشاريع المسندة له
          filteredProjects = allProjects.filter(p => myProjectIds.includes(p.id));
        }
        
        // 4. جلب طلبات الفنيين المرتبطة بالمشاريع
        const { data: techRequests, error: reqError } = await supabase
          .from('technician_requests')
          .select('project_id, request_type, amount, status');

        if (reqError) throw reqError;

        // 5. دمج البيانات
        const formattedData: EnrichedProject[] = filteredProjects.map((p: any) => {
          let totalSpent = 0;
          let breakdown: SpendingBreakdown = { custody: 0, expense: 0, material: 0, other: 0 };

          // حساب المصروفات المرتبطة بهذا المشروع
          const projectRequests = techRequests?.filter(r => r.project_id === p.id) || [];
          projectRequests.forEach((req: any) => {
            if (req.status !== 'rejected') {
              const amt = Number(req.amount) || 0;
              totalSpent += amt;
              if (req.request_type === 'custody') breakdown.custody += amt;
              else if (req.request_type === 'expense') breakdown.expense += amt;
              else if (req.request_type === 'material') breakdown.material += amt;
              else breakdown.other += amt;
            }
          });

          return {
            id: p.id,
            title: p.title,
            status: p.status,
            manager_name: p.manager_name || (isRTL ? 'غير محدد' : 'Not Set'),
            location_name: p.location_name || '',
            start_date: p.start_date || '',
            budget: Number(p.budget) || 0,
            teamCount: 0, // سيتم حسابه من task_assignments لاحقاً
            totalSpent,
            spendingBreakdown: breakdown
          };
        });

        // 6. حساب عدد الفريق لكل مشروع
        if (myAssignments) {
          const { data: allAssignments } = await supabase
            .from('task_assignments')
            .select('project_id');

          formattedData.forEach(proj => {
            proj.teamCount = (allAssignments?.filter(a => a.project_id === proj.id) || []).length;
          });
        }

        setProjects(formattedData);
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        if (error?.message) {
          console.error('Error message:', error.message);
        }
        if (error?.hint) {
          console.error('Error hint:', error.hint);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAndStats();
  }, [user, isRTL]);

  const toggleExpand = (id: string) => {
      setExpandedRow(expandedRow === id ? null : id);
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div>;
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className={`text-3xl font-black flex items-center gap-3 ${textMain}`}>
                    <Briefcase className="text-blue-500" size={28} />
                    {isRTL ? 'قائمة ومتابعة المشاريع' : 'Projects Overview'}
                </h1>
                <p className={`text-sm mt-2 font-medium ${textSub}`}>
                    {isRTL ? 'مراقبة الميزانيات، المصروفات، وأعداد الفريق لكل مشروع.' : 'Monitor budgets, expenses, and team sizes per project.'}
                </p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                {isRTL ? `إجمالي المشاريع: ${projects.length}` : `Total Projects: ${projects.length}`}
            </div>
        </div>

        {/* Projects List */}
        <div className="grid grid-cols-1 gap-4">
            {projects.length === 0 ? (
                <div className={`p-10 text-center rounded-3xl border border-dashed ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
                    {isRTL ? 'لا توجد مشاريع مسندة لك حتى الآن.' : 'No projects assigned to you yet.'}
                </div>
            ) : projects.map(project => {
                const percentSpent = project.budget > 0 ? Math.min((project.totalSpent / project.budget) * 100, 100).toFixed(1) : 0;
                const isOverBudget = project.totalSpent > project.budget && project.budget > 0;

                return (
                <div key={project.id} className={`rounded-3xl border overflow-hidden transition-all ${cardBg} ${expandedRow === project.id ? 'shadow-xl ring-1 ring-blue-500/20' : 'hover:shadow-md'}`}>
                    {/* Main Row */}
                    <div onClick={() => toggleExpand(project.id)} className="p-6 cursor-pointer flex flex-col lg:flex-row gap-6 items-center justify-between">
                        
                        {/* Title & Info */}
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{project.status}</span>
                                <span className={`text-[10px] font-mono ${textSub}`}>ID: {project.id.substring(0,8)}</span>
                            </div>
                            <h3 className={`text-xl font-black mb-2 ${textMain}`}>{project.title}</h3>
                            <div className={`flex flex-wrap gap-4 text-xs font-medium ${textSub}`}>
                                <span className="flex items-center gap-1.5"><UserCheck size={14}/> {project.manager_name}</span>
                                <span className="flex items-center gap-1.5"><MapPin size={14}/> {project.location_name}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14}/> {project.start_date || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Stats Widgets */}
                        <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 w-full lg:w-auto">
                            {/* Team */}
                            <div className={`p-3 rounded-2xl flex items-center gap-3 min-w-[120px] ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Users size={18}/></div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'الفريق' : 'Team'}</div>
                                    <div className={`font-black ${textMain}`}>{project.teamCount}</div>
                                </div>
                            </div>
                            
                            {/* Budget & Spend */}
                            <div className={`p-3 rounded-2xl min-w-[200px] flex-1 lg:flex-none ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'المنصرف / الميزانية' : 'Spent / Budget'}</div>
                                        <div className={`font-black ${isOverBudget ? 'text-red-500' : textMain}`}>
                                            {project.totalSpent.toLocaleString()} <span className="text-xs font-medium text-slate-400">/ {project.budget.toLocaleString()} SAR</span>
                                        </div>
                                    </div>
                                    <div className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>{percentSpent}%</div>
                                </div>
                                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percentSpent}%` }}></div>
                                </div>
                            </div>

                            <button className={`p-2 rounded-full ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}>
                                {expandedRow === project.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                            </button>
                        </div>
                    </div>

                    {/* Expandable Details (Spending Breakdown) */}
                    <AnimatePresence>
                        {expandedRow === project.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className={`p-6 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 ${isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-slate-50/80 border-slate-100'}`}>
                                    
                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 mb-2 text-purple-500">
                                            <Box size={16}/> <span className="text-xs font-bold">{isRTL ? 'تكلفة المواد' : 'Materials Cost'}</span>
                                        </div>
                                        <div className={`text-lg font-black ${textMain}`}>{project.spendingBreakdown.material.toLocaleString()} <span className="text-[10px] text-slate-400">SAR</span></div>
                                    </div>

                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 mb-2 text-amber-500">
                                            <Wallet size={16}/> <span className="text-xs font-bold">{isRTL ? 'العهد المصروفة' : 'Custody Disbursed'}</span>
                                        </div>
                                        <div className={`text-lg font-black ${textMain}`}>{project.spendingBreakdown.custody.toLocaleString()} <span className="text-[10px] text-slate-400">SAR</span></div>
                                    </div>

                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 mb-2 text-rose-500">
                                            <Receipt size={16}/> <span className="text-xs font-bold">{isRTL ? 'المصاريف الشخصية' : 'Personal Expenses'}</span>
                                        </div>
                                        <div className={`text-lg font-black ${textMain}`}>{project.spendingBreakdown.expense.toLocaleString()} <span className="text-[10px] text-slate-400">SAR</span></div>
                                    </div>

                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 mb-2 text-slate-500">
                                            <Activity size={16}/> <span className="text-xs font-bold">{isRTL ? 'طلبات أخرى' : 'Other Requests'}</span>
                                        </div>
                                        <div className={`text-lg font-black ${textMain}`}>{project.spendingBreakdown.other.toLocaleString()} <span className="text-[10px] text-slate-400">SAR</span></div>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )})}
        </div>
    </div>
  );
}
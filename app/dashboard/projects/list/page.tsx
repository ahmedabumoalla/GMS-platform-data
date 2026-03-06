'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Briefcase, Users, DollarSign, MapPin, Loader2, Calendar, Download,
  Box, Receipt, Wallet, Activity, UserCheck, Search, Edit2, Archive, 
  X, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Percent, Building2, Wrench, FileText, ExternalLink
} from 'lucide-react';
import { useDashboard } from '../../layout';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface SpendingBreakdown { custody: number; expense: number; material: number; other: number; }
interface PersonSpending { id: string; name: string; role: string; spent: number; }

interface EnrichedProject {
  id: string; title: string; status: string; category: string; contract_type: string;
  manager_name: string; manager_id: string; location_name: string; start_date: string; end_date: string;
  budget: number; contract_value: number; expected_profit: number;
  totalSpent: number; spendingBreakdown: SpendingBreakdown;
  teamCount: number; completionRate: number;
  assigned_techs: string[]; techDetails: PersonSpending[];
  work_zones: any[]; client_entities: any[]; required_tools: string; project_notes: string; contract_urls: string[];
}

export default function ProjectsListPage() {
  const router = useRouter();
  const { lang, isDark, user } = useDashboard();
  const isRTL = lang === 'ar';

  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [selectedProject, setSelectedProject] = useState<EnrichedProject | null>(null);
  const [projectToArchive, setProjectToArchive] = useState<EnrichedProject | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchProjectsAndStats = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 1. جلب جميع المشاريع بكل تفاصيلها
        const { data: allProjects, error: projError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (projError) throw projError;
        if (!allProjects) { setProjects([]); return; }

        // 2. جلب جميع المستخدمين (لمعرفة أسماء الفنيين ومطابقتها مع الـ IDs)
        const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, role');

        // 3. جلب جميع المهام والإسنادات لحساب الإنجاز
        const { data: allAssignments } = await supabase.from('task_assignments').select('project_id, tech_id, status');

        // 4. جلب جميع طلبات الصرف
        const { data: techRequests } = await supabase.from('technician_requests').select('project_id, user_id, request_type, amount, status');

        // 5. فلترة المشاريع حسب صلاحية المستخدم
        let filteredProjects = allProjects;
        if (user.role === 'project_manager') {
            filteredProjects = allProjects.filter(p => p.manager_name?.includes(user.full_name) || (p.assigned_techs || []).includes(user.id));
        } else if (user.role === 'technician' || user.role === 'engineer') {
            filteredProjects = allProjects.filter(p => (p.assigned_techs || []).includes(user.id));
        }

        // 6. دمج وبناء البيانات الذكية (Enrichment)
        const formattedData: EnrichedProject[] = filteredProjects.map((p: any) => {
            let totalSpent = 0;
            let breakdown: SpendingBreakdown = { custody: 0, expense: 0, material: 0, other: 0 };
            let spendersMap: Record<string, number> = {};

            // حساب المصروفات وتوزيعها على الأشخاص
            const projectRequests = techRequests?.filter(r => r.project_id === p.id && r.status === 'Approved') || [];
            projectRequests.forEach((req: any) => {
                const amt = Number(req.amount) || 0;
                totalSpent += amt;
                
                // نوع المصروف
                if (req.request_type === 'custody') breakdown.custody += amt;
                else if (req.request_type === 'expense') breakdown.expense += amt;
                else if (req.request_type === 'material') breakdown.material += amt;
                else breakdown.other += amt;

                // من صرف المبلغ؟
                spendersMap[req.user_id] = (spendersMap[req.user_id] || 0) + amt;
            });

            // بناء تفاصيل الفريق ومصروفاتهم
            let techDetails: PersonSpending[] = [];
            // إضافة المدير أولاً
            techDetails.push({
                id: p.manager_id,
                name: p.manager_name,
                role: 'مدير المشروع',
                spent: spendersMap[p.manager_id] || 0
            });
            // إضافة الفنيين
            (p.assigned_techs || []).forEach((techId: string) => {
                const profile = allProfiles?.find(pr => pr.id === techId);
                if (profile) {
                    techDetails.push({
                        id: techId,
                        name: profile.full_name,
                        role: 'فني / مهندس',
                        spent: spendersMap[techId] || 0
                    });
                }
            });

            // حساب نسبة الإنجاز
            const projAssignments = allAssignments?.filter(a => a.project_id === p.id) || [];
            const completedCount = projAssignments.filter(a => a.status === 'Completed').length;
            const completionRate = projAssignments.length > 0 ? Math.round((completedCount / projAssignments.length) * 100) : 0;

            return {
                id: p.id, title: p.title, status: p.status, category: p.category, contract_type: p.contract_type,
                manager_name: p.manager_name || 'غير محدد', manager_id: p.manager_id,
                location_name: p.location_name || '', start_date: p.start_date || '', end_date: p.end_date || '',
                budget: Number(p.budget) || 0, contract_value: Number(p.contract_value) || 0, expected_profit: Number(p.expected_profit) || 0,
                totalSpent, spendingBreakdown: breakdown, teamCount: projAssignments.length, completionRate,
                assigned_techs: p.assigned_techs || [], techDetails,
                work_zones: p.work_zones || [], client_entities: p.client_entities || [], required_tools: p.required_tools || '',
                project_notes: p.project_notes || '', contract_urls: p.contract_urls || []
            };
        });

        setProjects(formattedData);
      } catch (error) { console.error('Error fetching projects:', error); } 
      finally { setLoading(false); }
  };

  useEffect(() => { fetchProjectsAndStats(); }, [user]);

  // --- Handlers ---
  const handleArchive = async () => {
      if (!projectToArchive) return;
      setIsArchiving(true);
      try {
          const { error } = await supabase.from('projects').update({ status: 'Archived' }).eq('id', projectToArchive.id);
          if (error) throw error;
          alert(isRTL ? 'تم إيقاف وأرشفة المشروع بنجاح' : 'Project archived successfully');
          setProjectToArchive(null);
          fetchProjectsAndStats();
      } catch (error: any) { alert(error.message); } 
      finally { setIsArchiving(false); }
  };

  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.location_name.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- UI Helpers ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`space-y-6 pb-24 ${isRTL ? 'dir-rtl' : 'dir-ltr'}`}>
        
        {/* Header & Search */}
        <div className={`p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${cardBg}`}>
            <div>
                <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                    <Briefcase className="text-blue-600" size={24} /> {isRTL ? 'إدارة ومتابعة المشاريع' : 'Projects Management'}
                </h1>
                <p className={`text-sm mt-1 font-medium ${textSub}`}>{isRTL ? 'مراقبة مالية وفنية شاملة لكل العقود والمشاريع.' : 'Comprehensive financial and technical monitoring.'}</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                    <Search className={`absolute top-3 ${isRTL ? 'right-4' : 'left-4'} text-slate-400`} size={18} />
                    <input type="text" placeholder={isRTL ? 'بحث في المشاريع...' : 'Search projects...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full py-2.5 rounded-xl outline-none font-bold text-sm transition-all ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} ${isDark ? 'bg-slate-950 border border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-500'}`} />
                </div>
            </div>
        </div>

        {/* Projects List */}
        {loading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
        ) : filteredProjects.length === 0 ? (
            <div className={`p-10 text-center rounded-3xl border border-dashed ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>{isRTL ? 'لا توجد مشاريع مسندة لك حتى الآن.' : 'No projects found.'}</div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {filteredProjects.map(project => {
                    const percentSpent = project.budget > 0 ? Math.min((project.totalSpent / project.budget) * 100, 100).toFixed(1) : 0;
                    const isOverBudget = project.totalSpent > project.budget && project.budget > 0;

                    return (
                    <div key={project.id} className={`rounded-3xl border overflow-hidden transition-all hover:shadow-lg group ${cardBg} ${project.status === 'Archived' ? 'opacity-70 grayscale-[50%]' : ''}`}>
                        <div className="p-6 flex flex-col lg:flex-row gap-6 items-center justify-between">
                            
                            {/* Info */}
                            <div className="flex-1 w-full cursor-pointer" onClick={() => setSelectedProject(project)}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : project.status === 'Archived' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{project.status === 'Archived' ? (isRTL?'مؤرشف':'Archived') : project.status}</span>
                                    <span className={`text-[10px] font-mono ${textSub}`}>PRJ-{project.id.substring(0,6)}</span>
                                </div>
                                <h3 className={`text-xl font-black mb-2 ${textMain} group-hover:text-blue-500 transition-colors`}>{project.title}</h3>
                                <div className={`flex flex-wrap gap-4 text-xs font-medium ${textSub}`}>
                                    <span className="flex items-center gap-1.5"><UserCheck size={14}/> {project.manager_name}</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={14}/> {project.location_name || isRTL?'متعدد':'Multi'}</span>
                                </div>
                            </div>

                            {/* Mini Stats */}
                            <div className="flex items-center gap-4 w-full lg:w-auto" onClick={() => setSelectedProject(project)}>
                                <div className={`p-3 rounded-2xl flex items-center gap-3 min-w-[100px] ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Activity size={18}/></div>
                                    <div><div className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'الإنجاز' : 'Done'}</div><div className={`font-black ${textMain}`}>{project.completionRate}%</div></div>
                                </div>
                                <div className={`p-3 rounded-2xl min-w-[180px] ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                    <div className="flex justify-between items-end mb-2">
                                        <div><div className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'المنصرف / الميزانية' : 'Spent / Budget'}</div><div className={`font-black ${isOverBudget ? 'text-red-500' : textMain}`}>{project.totalSpent.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">/ {project.budget.toLocaleString()}</span></div></div>
                                        <div className={`text-[10px] font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>{percentSpent}%</div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percentSpent}%` }}></div></div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className={`flex lg:flex-col gap-2 p-3 rounded-2xl ${isDark ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                                <button onClick={() => router.push(`/dashboard/projects/edit/${project.id}`)} title={isRTL ? 'تعديل' : 'Edit'} className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl shadow-sm transition"><Edit2 size={16}/></button>
                                {project.status !== 'Archived' && (
                                    <button onClick={() => setProjectToArchive(project)} title={isRTL ? 'إيقاف / أرشفة' : 'Archive'} className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl shadow-sm transition"><Archive size={16}/></button>
                                )}
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        )}

        {/* --- Massive Project Details Modal --- */}
        <AnimatePresence>
            {selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] ${cardBg}`}>
                        
                        {/* Modal Header */}
                        <div className={`px-8 py-5 border-b flex justify-between items-center z-10 shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                            <div>
                                <h3 className={`font-black text-2xl tracking-tight ${textMain}`}>{selectedProject.title}</h3>
                                <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-500">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{selectedProject.category}</span>
                                    <span>{selectedProject.contract_type === 'Direct' ? (isRTL?'مباشر':'Direct') : (isRTL?'باطن':'Subcontract')}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => {router.push(`/dashboard/projects/edit/${selectedProject.id}`); setSelectedProject(null);}} className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-bold text-xs transition flex items-center gap-2"><Edit2 size={14}/> {isRTL?'تعديل':'Edit'}</button>
                                <button onClick={() => setSelectedProject(null)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-xl transition"><X size={20}/></button>
                            </div>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className={`flex-1 overflow-y-auto p-8 space-y-8 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                            
                            {/* 1. Financial Dashboard (The Core) */}
                            <div>
                                <h4 className={`text-lg font-black mb-4 flex items-center gap-2 ${textMain}`}><DollarSign className="text-emerald-500"/> {isRTL ? 'اللوحة المالية للمشروع' : 'Financial Dashboard'}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatCard title={isRTL?'قيمة العقد (الإيراد)':'Contract Value'} value={selectedProject.contract_value} isDark={isDark} color="blue" />
                                    <StatCard title={isRTL?'الميزانية المعتمدة':'Budget'} value={selectedProject.budget} isDark={isDark} color="slate" />
                                    <StatCard title={isRTL?'إجمالي المصروفات':'Total Spent'} value={selectedProject.totalSpent} isDark={isDark} color={selectedProject.totalSpent > selectedProject.budget ? 'red' : 'amber'} />
                                    <StatCard title={isRTL?'المتبقي من الميزانية':'Remaining Budget'} value={selectedProject.budget - selectedProject.totalSpent} isDark={isDark} color={selectedProject.budget - selectedProject.totalSpent < 0 ? 'red' : 'emerald'} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className={`p-5 rounded-3xl border flex items-center justify-between ${isDark ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
                                        <div>
                                            <div className="text-xs font-bold text-emerald-600 mb-1">{isRTL ? 'صافي الربح المتبقي (مبدئي)' : 'Remaining Profit'}</div>
                                            <div className={`text-2xl font-black ${selectedProject.contract_value - selectedProject.totalSpent < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{(selectedProject.contract_value - selectedProject.totalSpent).toLocaleString()} <span className="text-xs font-medium">SAR</span></div>
                                            <div className="text-[10px] text-slate-500 mt-1">{isRTL ? '(قيمة العقد - إجمالي ما تم صرفه)' : '(Value - Spent)'}</div>
                                        </div>
                                        <TrendingUp size={32} className="text-emerald-200"/>
                                    </div>
                                    {/* Placeholders for Future Finance Modules */}
                                    <div className={`p-5 rounded-3xl border opacity-60 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className="text-xs font-bold text-slate-500 mb-1 flex justify-between"><span>{isRTL ? 'إجمالي الرواتب المصروفة' : 'Paid Salaries'}</span> <span className="bg-slate-200 text-slate-500 text-[8px] px-2 rounded-full">{isRTL?'قريباً':'Soon'}</span></div>
                                        <div className={`text-2xl font-black ${textMain}`}>0 <span className="text-xs font-medium">SAR</span></div>
                                        <div className="text-[10px] text-slate-400 mt-1">{isRTL ? 'سيتم ربطها بنظام الرواتب' : 'Will link to HR Payroll'}</div>
                                    </div>
                                    <div className={`p-5 rounded-3xl border opacity-60 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className="text-xs font-bold text-slate-500 mb-1 flex justify-between"><span>{isRTL ? 'المستخلصات المفوترة' : 'Invoiced Claims'}</span> <span className="bg-slate-200 text-slate-500 text-[8px] px-2 rounded-full">{isRTL?'قريباً':'Soon'}</span></div>
                                        <div className={`text-2xl font-black ${textMain}`}>0 <span className="text-xs font-medium">SAR</span></div>
                                        <div className="text-[10px] text-slate-400 mt-1">{isRTL ? 'سيتم ربطها بالفوترة الإلكترونية' : 'Will link to Invoicing'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Progress & Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${textMain}`}><Activity className="text-blue-500" size={18}/> {isRTL ? 'نسبة إنجاز المهام' : 'Task Progress'}</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-20 h-20 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                                <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="226.2" strokeDashoffset={226.2 - (226.2 * selectedProject.completionRate) / 100} className="text-blue-500 transition-all duration-1000" />
                                            </svg>
                                            <span className={`absolute text-lg font-black ${textMain}`}>{selectedProject.completionRate}%</span>
                                        </div>
                                        <div>
                                            <div className={`font-bold ${textMain}`}>{isRTL ? 'المهام الميدانية' : 'Field Tasks'}</div>
                                            <div className="text-xs text-slate-500">{isRTL ? 'مبني على إغلاق المهام من تطبيق الفنيين' : 'Based on tech app closures'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${textMain}`}><Calendar className="text-amber-500" size={18}/> {isRTL ? 'الجدول الزمني' : 'Timeline'}</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="text-xs font-bold text-slate-500">{isRTL ? 'تاريخ البدء' : 'Start'}</span>
                                            <span className={`text-sm font-bold ${textMain}`}>{selectedProject.start_date || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">{isRTL ? 'تاريخ الانتهاء' : 'End'}</span>
                                            <span className={`text-sm font-bold ${textMain}`}>{selectedProject.end_date || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Team & Personal Spending */}
                            <div>
                                <h4 className={`text-lg font-black mb-4 flex items-center gap-2 ${textMain}`}><Users className="text-indigo-500"/> {isRTL ? 'فريق العمل ومصروفاتهم' : 'Team & Individual Spending'}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedProject.techDetails.map((person, idx) => (
                                        <div key={idx} className={`p-4 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${person.role === 'مدير المشروع' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {person.name ? person.name.charAt(0) : (isRTL ? '؟' : 'U')}
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-sm ${textMain}`}>{person.name}</div>
                                                    {person.name || (isRTL ? 'اسم غير مسجل' : 'Unknown Name')}
                                                    <div className={`text-[10px] font-bold ${person.role === 'مدير المشروع' ? 'text-indigo-500' : 'text-slate-500'}`}>{person.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end pt-1">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase">{isRTL ? 'إجمالي ما صرفه' : 'Total Spent'}</div>
                                                <div className={`font-black text-base ${person.spent > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{person.spent.toLocaleString()} <span className="text-[10px]">SAR</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Setup Details (Zones, Entities, Tools) */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Entities */}
                                {selectedProject.client_entities && selectedProject.client_entities.length > 0 && (
                                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${textMain}`}><Building2 className="text-purple-500" size={18}/> {isRTL ? 'الجهات المالكة للمشروع' : 'Client Entities'}</h4>
                                        <div className="space-y-3">
                                            {selectedProject.client_entities.map((ent:any, i:number) => (
                                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div className="font-bold text-sm text-slate-800 dark:text-white mb-1">{ent.name} <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 ml-2">{ent.type}</span></div>
                                                    <div className="text-xs text-slate-500 flex gap-4"><span className="flex items-center gap-1"><UserCheck size={12}/> {ent.contactPerson || '-'}</span> <span dir="ltr">{ent.phone}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Zones */}
                                {selectedProject.work_zones && selectedProject.work_zones.length > 0 && (
                                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${textMain}`}><MapPin className="text-amber-500" size={18}/> {isRTL ? 'نطاقات العمل المعتمدة' : 'Work Zones'}</h4>
                                        <div className="space-y-3">
                                            {selectedProject.work_zones.map((zone:any, i:number) => (
                                                <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                                    <div className="font-bold text-sm text-amber-800 dark:text-amber-400 mb-1">{zone.region}</div>
                                                    <div className="text-xs text-amber-600/80 dark:text-amber-500/70 leading-snug">{zone.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 5. Tools & Notes */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${textMain}`}><Wrench className="text-slate-500" size={18}/> {isRTL ? 'المعدات المطلوبة' : 'Required Tools'}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProject.required_tools ? selectedProject.required_tools.split('،').map((tool, i) => (
                                            <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">{tool.trim()}</span>
                                        )) : <span className="text-xs text-slate-400">{isRTL ? 'لم يتم تحديد معدات' : 'No tools specified'}</span>}
                                    </div>
                                </div>
                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${textMain}`}><FileText className="text-slate-500" size={18}/> {isRTL ? 'الملاحظات' : 'Notes'}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{selectedProject.project_notes || (isRTL ? 'لا توجد ملاحظات' : 'No notes')}</p>
                                </div>
                            </div>

                            {/* 6. Documents */}
                            {selectedProject.contract_urls && selectedProject.contract_urls.length > 0 && (
                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <h4 className={`text-sm font-black mb-4 flex items-center gap-2 ${textMain}`}><Download className="text-blue-500" size={18}/> {isRTL ? 'مرفقات العقد' : 'Documents'}</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedProject.contract_urls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                                                <ExternalLink size={14}/> {isRTL ? `مرفق ${i+1}` : `Document ${i+1}`}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* --- Archive Confirmation Modal --- */}
        <AnimatePresence>
            {projectToArchive && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 ${cardBg}`}>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-sm"><AlertTriangle size={32} /></div>
                        <h3 className={`text-xl font-black text-center mb-2 ${textMain}`}>{isRTL ? 'هل أنت متأكد من الإيقاف؟' : 'Are you sure?'}</h3>
                        <p className={`text-center text-sm mb-6 ${textSub}`}>{isRTL ? `سيتم تحويل المشروع "${projectToArchive.title}" إلى الأرشيف. يمكنك دائماً رؤية تفاصيله، لكن لن يظهر كنشط.` : `Archiving will hide it from active lists.`}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setProjectToArchive(null)} disabled={isArchiving} className={`flex-1 py-3 rounded-xl font-bold transition ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{isRTL ? 'إلغاء' : 'Cancel'}</button>
                            <button onClick={handleArchive} disabled={isArchiving} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition disabled:opacity-50">
                                {isArchiving ? <Loader2 size={18} className="animate-spin"/> : <Archive size={18}/>} {isRTL ? 'نعم، أرشفة' : 'Yes, Archive'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
}

// --- Helper Component ---
function StatCard({ title, value, isDark, color }: { title: string, value: number, isDark: boolean, color: string }) {
    const colorClasses: Record<string, string> = {
        blue: isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-100',
        emerald: isDark ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100',
        amber: isDark ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100',
        red: isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100',
        slate: isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200',
    };
    const textClasses: Record<string, string> = {
        blue: 'text-blue-600 dark:text-blue-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
        red: 'text-red-500',
        slate: isDark ? 'text-white' : 'text-slate-900',
    };

    return (
        <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{title}</div>
            <div className={`text-xl font-black ${textClasses[color]}`}>{value.toLocaleString()} <span className="text-[10px] font-medium opacity-70">SAR</span></div>
        </div>
    );
}
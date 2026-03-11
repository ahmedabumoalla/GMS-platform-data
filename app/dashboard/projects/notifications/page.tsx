'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Bell, CheckCircle2, Info, AlertTriangle, X, Search, 
  Trash2, Eye, Check, Clock, FileText, User, 
  ArrowRight, ShieldAlert, Activity, Globe, RefreshCw,
  CheckSquare, Loader2, BrainCircuit, Users, Building2,
  DollarSign
} from 'lucide-react';
import { useDashboard } from '../../layout';

// --- Types ---
interface AIAlert {
  id: string;
  type: 'Conflict' | 'Risk' | 'Performance';
  title: string;
  description: string;
  severity: 'Critical' | 'Warning';
  relatedEntity: string;
  timestamp: string;
}

interface UnderperformingStaff {
  id: string;
  name: string;
  role: string;
  reason: string;
  score: number;
}

interface ProjectRisk {
  id: string;
  name: string;
  manager: string;
  issueCount: number;
  financialAlerts: number;
}

export default function AIAnalyticsCenter() {
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [riskyProjects, setRiskyProjects] = useState<ProjectRisk[]>([]);
  const [staffWatchlist, setStaffWatchlist] = useState<UnderperformingStaff[]>([]);
  const [activeTab, setActiveTab] = useState<'Alerts' | 'Projects' | 'Staff'>('Alerts');

  // --- Real Data Fetching & AI Analysis Logic ---
  const runAIAnalysis = async () => {
    setLoading(true);
    try {
      // 1. جلب البيانات الضخمة بشكل متوازي (Parallel Fetching for speed)
      const [resTasks, resComments, resEvals, resProjects, resProfiles] = await Promise.all([
        supabase.from('task_assignments').select('id, project_id, tech_id, status, is_rework, qa_score, updated_at'),
        supabase.from('task_comments').select('id, task_id, user_id, department, comment_text, is_alert, created_at'),
        supabase.from('employee_evaluations').select('employee_id, technical_score, behavior_score'),
        supabase.from('projects').select('id, title, manager_name'),
        supabase.from('profiles').select('id, full_name, role')
      ]);

      const tasks = resTasks.data || [];
      const comments = resComments.data || [];
      const evals = resEvals.data || [];
      const projects = resProjects.data || [];
      const profiles = resProfiles.data || [];

      const generatedAlerts: AIAlert[] = [];
      const projectRisksMap = new Map<string, ProjectRisk>();
      const staffWatchlistMap = new Map<string, UnderperformingStaff>();

      // --- 🧠 خوارزمية تحليل البيانات (AI Logic Simulation) ---

      // 1. تحليل تعارضات المهام والتعليقات الميدانية والمالية
      tasks.forEach(task => {
          const taskComments = comments.filter(c => c.task_id === task.id);
          const hasFinancialAlert = taskComments.some(c => c.department === 'Finance' && c.is_alert);
          const hasTechAlert = taskComments.some(c => c.department === 'Technical' && c.is_alert);
          const proj = projects.find(p => p.id === task.project_id);
          const tech = profiles.find(p => p.id === task.tech_id);

          // رصد تعارض: المهمة مكتملة ولكن الجودة سيئة أو يوجد رفض مالي
          if (task.status === 'Completed' && (task.qa_score < 7 || hasFinancialAlert || task.is_rework)) {
              generatedAlerts.push({
                  id: `alt-con-${task.id}`,
                  type: 'Conflict',
                  title: isRTL ? 'تعارض في الإغلاق' : 'Closure Conflict',
                  description: isRTL 
                      ? `تم إغلاق مهمة في "${proj?.title}" بواسطة "${tech?.full_name}" مع وجود ملاحظات جودة أو مالية غير محلولة.` 
                      : `Task closed in "${proj?.title}" by "${tech?.full_name}" with unresolved QA or Financial issues.`,
                  severity: 'Critical',
                  relatedEntity: `Task #${task.id.slice(0,6)}`,
                  timestamp: new Date(task.updated_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')
              });
          }

          // تجميع مخاطر المشاريع
          if (hasTechAlert || hasFinancialAlert || task.is_rework) {
              if (proj) {
                  const existing = projectRisksMap.get(proj.id) || { id: proj.id, name: proj.title, manager: proj.manager_name, issueCount: 0, financialAlerts: 0 };
                  existing.issueCount += (hasTechAlert || task.is_rework ? 1 : 0);
                  existing.financialAlerts += (hasFinancialAlert ? 1 : 0);
                  projectRisksMap.set(proj.id, existing);
              }
          }
      });

      // 2. تحليل أداء الموظفين (التقييمات المتدنية أو كثرة الأخطاء)
      profiles.forEach(prof => {
          const empTasks = tasks.filter(t => t.tech_id === prof.id);
          const reworkCount = empTasks.filter(t => t.is_rework).length;
          const empEval = evals.find(e => e.employee_id === prof.id);
          
          let score = 10;
          let reason = '';

          if (empEval && (Number(empEval.technical_score) < 6 || Number(empEval.behavior_score) < 6)) {
              score = Math.min(Number(empEval.technical_score), Number(empEval.behavior_score));
              reason = isRTL ? 'تقييم إداري ضعيف' : 'Poor admin evaluation';
          } else if (empTasks.length > 0 && reworkCount / empTasks.length > 0.3) {
              score = 5; // نتيجة افتراضية سيئة بسبب الأخطاء
              reason = isRTL ? `كثرة إعادة العمل (${reworkCount} مهام)` : `High rework rate (${reworkCount} tasks)`;
          }

          if (score <= 6) {
              staffWatchlistMap.set(prof.id, {
                  id: prof.id,
                  name: prof.full_name || 'Unknown',
                  role: prof.role || 'Staff',
                  reason: reason,
                  score: score
              });

              generatedAlerts.push({
                  id: `alt-perf-${prof.id}`,
                  type: 'Performance',
                  title: isRTL ? 'انخفاض في الأداء' : 'Performance Drop',
                  description: isRTL ? `الموظف "${prof.full_name}" يحتاج إلى مراجعة بسبب: ${reason}` : `Employee "${prof.full_name}" needs review due to: ${reason}`,
                  severity: 'Warning',
                  relatedEntity: `Emp: ${prof.full_name}`,
                  timestamp: new Date().toLocaleString(isRTL ? 'ar-SA' : 'en-US')
              });
          }
      });

      setAlerts(generatedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setRiskyProjects(Array.from(projectRisksMap.values()).filter(p => p.issueCount > 0 || p.financialAlerts > 0).sort((a, b) => (b.issueCount + b.financialAlerts) - (a.issueCount + a.financialAlerts)));
      setStaffWatchlist(Array.from(staffWatchlistMap.values()).sort((a, b) => a.score - b.score));

    } catch (error: any) {
      console.error('Error in AI Analysis:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAIAnalysis();
  }, [user, isRTL]);

  // --- UI Helpers ---
  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <BrainCircuit className="text-purple-600" />
              {isRTL ? 'المركز الذكي لتحليل العمليات' : 'AI Operations Analytics Center'}
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
              {isRTL ? 'اكتشاف التعارضات، تحليل تعليقات الفنيين والمالية، ومراقبة الأداء' : 'Detect conflicts, analyze tech/finance comments, and monitor performance'}
            </p>
          </div>
          <div className="flex gap-2">
             <button onClick={runAIAnalysis} className={`p-2.5 rounded-xl transition ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} title="Run Analysis">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
            {[
                { id: 'Alerts', ar: `تنبيهات النظام (${alerts.length})`, en: `System Alerts (${alerts.length})`, icon: AlertTriangle },
                { id: 'Projects', ar: `مشاريع بها ملاحظات (${riskyProjects.length})`, en: `Risky Projects (${riskyProjects.length})`, icon: Building2 },
                { id: 'Staff', ar: `موظفين تحت المراقبة (${staffWatchlist.length})`, en: `Staff Watchlist (${staffWatchlist.length})`, icon: Users },
            ].map(t => (
                <button 
                    key={t.id} 
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 whitespace-nowrap ${
                        activeTab === t.id 
                        ? (isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200')
                        : (isDark ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')
                    }`}
                >
                    <t.icon size={14}/> {isRTL ? t.ar : t.en}
                </button>
            ))}
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {loading ? (
            <div className={`text-center py-32 flex flex-col items-center justify-center gap-4 ${textSub}`}>
                <div className="relative">
                    <BrainCircuit size={48} className="text-purple-500 opacity-20"/>
                    <Loader2 size={48} className="absolute inset-0 animate-spin text-purple-600"/>
                </div>
                <span className="font-bold text-lg">{isRTL ? 'الذكاء الاصطناعي يقوم بتحليل قواعد البيانات...' : 'AI is analyzing database...'}</span>
            </div>
        ) : (
            <div className="space-y-6">
                
                {/* --- 1. System Alerts Tab --- */}
                {activeTab === 'Alerts' && (
                    <div className="space-y-4">
                        {alerts.length === 0 ? (
                            <div className={`text-center py-20 rounded-3xl border border-dashed ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>لا توجد تعارضات حالياً. النظام مستقر.</div>
                        ) : alerts.map(alert => (
                            <div key={alert.id} className={`p-5 rounded-2xl border flex gap-4 items-start ${alert.severity === 'Critical' ? (isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100') : (isDark ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100')}`}>
                                <div className="mt-1">
                                    {alert.severity === 'Critical' ? <ShieldAlert size={24} className="text-red-500"/> : <AlertTriangle size={24} className="text-amber-500"/>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-black text-sm ${alert.severity === 'Critical' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>{alert.title}</h3>
                                        <span className={`text-[10px] font-mono ${textSub}`}>{alert.timestamp}</span>
                                    </div>
                                    <p className={`text-sm leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{alert.description}</p>
                                    <div className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500 shadow-sm border border-slate-100'}`}>
                                        {alert.relatedEntity}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- 2. Risky Projects Tab --- */}
                {activeTab === 'Projects' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {riskyProjects.length === 0 ? (
                            <div className={`col-span-full text-center py-20 rounded-3xl border border-dashed ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>جميع المشاريع تسير بشكل ممتاز.</div>
                        ) : riskyProjects.map(proj => (
                            <div key={proj.id} className={`p-5 rounded-2xl border ${cardBg}`}>
                                <div className="flex justify-between items-start border-b pb-4 mb-4 border-inherit">
                                    <div>
                                        <h3 className={`font-bold text-lg mb-1 ${textMain}`}>{proj.name}</h3>
                                        <div className={`text-xs flex items-center gap-1 ${textSub}`}><User size={12}/> {isRTL ? 'المدير:' : 'Manager:'} {proj.manager}</div>
                                    </div>
                                    <div className={`p-2 rounded-xl ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                        <Activity size={20}/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`text-xs font-bold mb-1 flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}><AlertTriangle size={14}/> {isRTL ? 'ملاحظات فنية' : 'Tech Issues'}</div>
                                        <div className={`text-2xl font-black ${textMain}`}>{proj.issueCount}</div>
                                    </div>
                                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`text-xs font-bold mb-1 flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}><DollarSign size={14}/> {isRTL ? 'تعارضات مالية' : 'Finance Alerts'}</div>
                                        <div className={`text-2xl font-black ${textMain}`}>{proj.financialAlerts}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- 3. Staff Watchlist Tab --- */}
                {activeTab === 'Staff' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {staffWatchlist.length === 0 ? (
                            <div className={`col-span-full text-center py-20 rounded-3xl border border-dashed ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>لا يوجد موظفين تحت المراقبة حالياً.</div>
                        ) : staffWatchlist.map(staff => (
                            <div key={staff.id} className={`p-5 rounded-2xl border flex items-center gap-4 ${cardBg}`}>
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl border-4 ${staff.score < 5 ? 'border-red-100 text-red-500 bg-white dark:border-red-900/30 dark:bg-slate-800' : 'border-amber-100 text-amber-500 bg-white dark:border-amber-900/30 dark:bg-slate-800'}`}>
                                    {staff.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className={`font-bold text-base ${textMain}`}>{staff.name}</h3>
                                            <div className={`text-[10px] uppercase font-bold mb-2 ${textSub}`}>{staff.role}</div>
                                        </div>
                                        <div className={`font-black text-lg ${staff.score < 5 ? 'text-red-500' : 'text-amber-500'}`}>{staff.score} <span className="text-xs text-slate-400">/ 10</span></div>
                                    </div>
                                    <div className={`text-xs p-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        <span className="font-bold text-red-500 mr-1">{isRTL ? 'السبب:' : 'Reason:'}</span> {staff.reason}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        )}
      </div>

    </div>
  );
}
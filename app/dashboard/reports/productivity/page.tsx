'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, Clock, CheckCircle2, TrendingUp, Users, 
  Filter, Download, Share2, Info, ChevronDown, 
  ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck, 
  Calendar, Search, Loader2, BrainCircuit, X, User
} from 'lucide-react';

// --- Types ---
interface KPI {
  id: string;
  label: string;
  value: string;
  trend: number;
  insight: string;
  details: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface Team {
  id: string;
  name: string;
  efficiency: number;
  completed: number;
  total: number;
  onTimeRate: number;
  qaPassRate: number;
  workload: 'Under' | 'Optimal' | 'Overloaded';
  risk?: string;
  members: TeamMember[]; // ✅ تمت إضافة قائمة الأعضاء
}

interface Performer {
  id: string;
  name: string;
  role: string;
  team: string;
  tasksCompleted: number;
  qualityScore: number; // out of 10
  onTimeRate: number;
  workload: 'Balanced' | 'High';
}

export default function ProductivityPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [period, setPeriod] = useState('Feb 2026');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [performers, setPerformers] = useState<Performer[]>([]);
  
  // Drawer States
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'KPI' | 'Team' | 'Performer' | null>(null);

  // Filters
  const [teamFilter, setTeamFilter] = useState('All');

  // --- Mock Data Loading ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setKpis([
        { id: 'kpi-1', label: lang === 'ar' ? 'المهام المنجزة' : 'Completed Tasks', value: '142', trend: 12, insight: 'Increased due to Sector 4 rush', details: 'Total tasks marked as Done across all projects.' },
        { id: 'kpi-2', label: lang === 'ar' ? 'متوسط زمن الإنجاز' : 'Avg. Cycle Time', value: '3.5h', trend: -5, insight: 'Faster approvals noted', details: 'Average time from In Progress to Completed.' },
        { id: 'kpi-3', label: lang === 'ar' ? 'استغلال الموارد' : 'Resource Utilization', value: '88%', trend: 2, insight: 'Optimal range', details: 'Active hours vs available capacity.' },
        { id: 'kpi-4', label: lang === 'ar' ? 'الالتزام بالوقت' : 'On-Time Delivery', value: '94%', trend: 4, insight: 'Improvement in electrical team', details: 'Tasks completed on or before due date.' },
        { id: 'kpi-5', label: lang === 'ar' ? 'معدل فشل الجودة' : 'QA Failure Rate', value: '3.2%', trend: -1, insight: 'Lower defect rate', details: 'Percentage of tasks rejected by QC.' },
        { id: 'kpi-6', label: lang === 'ar' ? 'الحمل الحالي' : 'Active Workload', value: '450h', trend: 8, insight: 'High load expected next week', details: 'Total estimated hours for active tasks.' },
      ]);

      setTeams([
        { 
            id: 'T-Elec', name: lang === 'ar' ? 'فريق الكهرباء' : 'Electrical Team', efficiency: 92, completed: 45, total: 50, onTimeRate: 95, qaPassRate: 98, workload: 'Optimal',
            members: [
                { id: 'M1', name: 'Saeed Al-Qahtani', role: 'Senior Tech', avatar: 'S' },
                { id: 'M2', name: 'Ali Ahmed', role: 'Technician', avatar: 'A' },
                { id: 'M3', name: 'Fahad Salem', role: 'Junior Tech', avatar: 'F' }
            ]
        },
        { 
            id: 'T-Plumb', name: lang === 'ar' ? 'فريق السباكة' : 'Plumbing Team', efficiency: 75, completed: 30, total: 40, onTimeRate: 80, qaPassRate: 85, workload: 'Under', risk: 'Material Delay',
            members: [
                { id: 'M4', name: 'Yasser Al-Harbi', role: 'Supervisor', avatar: 'Y' },
                { id: 'M5', name: 'Khalid Omar', role: 'Plumber', avatar: 'K' }
            ]
        },
        { 
            id: 'T-Civil', name: lang === 'ar' ? 'فريق المدني' : 'Civil Team', efficiency: 80, completed: 20, total: 25, onTimeRate: 88, qaPassRate: 90, workload: 'Overloaded', risk: 'High Fatigue',
            members: [
                { id: 'M6', name: 'Omar Farouk', role: 'Site Engineer', avatar: 'O' },
                { id: 'M7', name: 'Mahmoud Hassan', role: 'Worker', avatar: 'M' },
                { id: 'M8', name: 'Tariq Aziz', role: 'Worker', avatar: 'T' },
                { id: 'M9', name: 'Rami Said', role: 'Foreman', avatar: 'R' }
            ]
        },
      ]);

      setPerformers([
        { id: 'P-1', name: 'Saeed Al-Qahtani', role: 'Senior Tech', team: 'Electrical', tasksCompleted: 18, qualityScore: 9.9, onTimeRate: 100, workload: 'Balanced' },
        { id: 'P-2', name: 'Omar Farouk', role: 'Site Eng.', team: 'Civil', tasksCompleted: 15, qualityScore: 9.5, onTimeRate: 92, workload: 'High' },
        { id: 'P-3', name: 'Yasser Al-Harbi', role: 'Supervisor', team: 'Plumbing', tasksCompleted: 12, qualityScore: 9.2, onTimeRate: 88, workload: 'Balanced' },
      ]);
      setLoading(false);
    }, 800);
  }, [lang, period]);

  // --- Handlers ---
  const handleOpenDrawer = (type: 'KPI' | 'Team' | 'Performer', data: any) => {
    setDrawerType(type);
    if (type === 'KPI') setSelectedKPI(data);
    if (type === 'Team') setSelectedTeam(data);
    if (type === 'Performer') setSelectedPerformer(data);
    setIsDrawerOpen(true);
  };

  const handleExport = () => {
    alert(lang === 'ar' ? 'جاري تصدير التقرير (PDF)...' : 'Exporting Report (PDF)...');
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const filteredTeams = teamFilter === 'All' ? teams : teams.filter(t => t.name.includes(teamFilter));

  // --- Helper Components ---
  const TrendIndicator = ({ value }: { value: number }) => (
    <span className={`flex items-center text-xs font-bold ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
      {Math.abs(value)}%
    </span>
  );

  const WorkloadBadge = ({ level }: { level: string }) => {
      const colors: any = { 'Under': 'bg-blue-100 text-blue-700', 'Optimal': 'bg-green-100 text-green-700', 'Overloaded': 'bg-red-100 text-red-700' };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[level] || 'bg-slate-100'}`}>{level}</span>;
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Command Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-blue-600" />
              {lang === 'ar' ? 'استخبارات الإنتاجية والأداء' : 'Productivity & Performance Intelligence'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'تحليل شامل لكفاءة الفرق، المشاريع، والموارد التشغيلية' : 'Comprehensive analysis of team efficiency, projects, and operational resources'}
            </p>
          </div>
          
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <div className="bg-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-slate-200">
                <Calendar size={14} className="text-slate-500"/>
                <span className="text-xs font-bold text-slate-700">{period}</span>
                <ChevronDown size={14} className="text-slate-400 cursor-pointer"/>
             </div>
             <button onClick={handleExport} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95">
                <Download size={16} /> {lang === 'ar' ? 'تصدير التقرير' : 'Export Report'}
             </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 overflow-x-auto pb-1">
            {['All', 'Electricity', 'Plumbing', 'Civil', 'Safety'].map(f => (
                <button 
                    key={f} 
                    onClick={() => setTeamFilter(f === 'Electricity' ? 'الكهرباء' : f === 'Plumbing' ? 'السباكة' : f === 'Civil' ? 'المدني' : f)} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition whitespace-nowrap ${teamFilter === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* --- Section 2: Executive KPI Grid --- */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
            <div className="col-span-full text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحليل البيانات...' : 'Analyzing data...'}</div>
        ) : kpis.map(kpi => (
            <div 
                key={kpi.id} 
                onClick={() => handleOpenDrawer('KPI', kpi)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition group"
            >
                <div className="text-xs text-slate-500 font-bold mb-2 truncate" title={kpi.label}>{kpi.label}</div>
                <div className="flex justify-between items-end">
                    <div className="text-2xl font-black text-slate-800">{kpi.value}</div>
                    <TrendIndicator value={kpi.trend} />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-400 flex items-center gap-1">
                    <Info size={10}/> {kpi.insight}
                </div>
            </div>
        ))}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- Section 3: Team Efficiency --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Users className="text-blue-600" size={20}/> {lang === 'ar' ? 'كفاءة الفرق الميدانية' : 'Field Team Efficiency'}
                </h3>
                <button className="text-xs text-blue-600 font-bold hover:underline">{lang === 'ar' ? 'عرض الكل' : 'View All'}</button>
            </div>
            <div className="divide-y divide-slate-50">
                {filteredTeams.map(team => (
                    <div 
                        key={team.id} 
                        onClick={() => handleOpenDrawer('Team', team)}
                        className="p-5 hover:bg-slate-50 transition cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="font-bold text-slate-800">{team.name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{team.completed} / {team.total} {lang === 'ar' ? 'مهمة' : 'Tasks'}</div>
                            </div>
                            <div className="text-right">
                                <WorkloadBadge level={team.workload} />
                                {team.risk && <div className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1 justify-end"><AlertTriangle size={10}/> {team.risk}</div>}
                            </div>
                        </div>
                        
                        {/* Efficiency Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>{lang === 'ar' ? 'الكفاءة العامة' : 'Overall Efficiency'}</span>
                                <span>{team.efficiency}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${team.efficiency >= 90 ? 'bg-green-500' : team.efficiency >= 75 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${team.efficiency}%` }}></div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-50">
                            <div className="text-xs text-slate-500">
                                <span className="block font-bold text-slate-400 mb-0.5">{lang === 'ar' ? 'الالتزام بالوقت' : 'On-Time'}</span>
                                <span className="font-bold text-slate-700">{team.onTimeRate}%</span>
                            </div>
                            <div className="text-xs text-slate-500">
                                <span className="block font-bold text-slate-400 mb-0.5">{lang === 'ar' ? 'جودة التنفيذ' : 'QA Pass'}</span>
                                <span className="font-bold text-slate-700">{team.qaPassRate}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- Section 4: Performance Leaders --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="text-green-600" size={20}/> {lang === 'ar' ? 'قادة الأداء والتميز' : 'Performance Leaders'}
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {performers.map((user, idx) => (
                    <div 
                        key={user.id} 
                        onClick={() => handleOpenDrawer('Performer', user)}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition cursor-pointer group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${idx === 0 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-slate-600 border-slate-200'}`}>
                                {idx + 1}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition">{user.name}</div>
                                <div className="text-xs text-slate-500">{user.role} • {user.team}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black text-green-600">{user.qualityScore}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'ar' ? 'نقاط الجودة' : 'QA Score'}</div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* AI Insight Box */}
            <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase mb-2">
                    <BrainCircuit size={16}/> {lang === 'ar' ? 'تحليل الذكاء الاصطناعي' : 'AI Insight'}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                    {lang === 'ar' 
                        ? 'لوحظ ارتفاع في أداء فريق الكهرباء بنسبة 12% مقارنة بالشهر الماضي. يوصى بتكريم "سعيد القحطاني" لتميزه في تقليل نسبة الإعادة.'
                        : 'Electrical team performance increased by 12% vs last month. Recommendation: Recognize "Saeed" for rework reduction.'}
                </p>
            </div>
        </div>

      </div>

      {/* --- Section 6: Details Drawer (Unified) --- */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">
                        {drawerType === 'KPI' && (lang === 'ar' ? 'تفاصيل المؤشر' : 'KPI Details')}
                        {drawerType === 'Team' && (lang === 'ar' ? 'تحليل أداء الفريق' : 'Team Performance Analysis')}
                        {drawerType === 'Performer' && (lang === 'ar' ? 'سجل أداء الموظف' : 'Employee Performance Log')}
                    </h3>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {/* KPI Details */}
                    {drawerType === 'KPI' && selectedKPI && (
                        <div className="space-y-6">
                            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-sm text-slate-500 font-bold mb-2">{selectedKPI.label}</div>
                                <div className="text-4xl font-black text-slate-900 mb-2">{selectedKPI.value}</div>
                                <div className="inline-block bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm"><TrendIndicator value={selectedKPI.trend}/></div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2 text-sm">{lang === 'ar' ? 'تعريف المؤشر' : 'Definition'}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed bg-blue-50 p-3 rounded-xl border border-blue-100">{selectedKPI.details}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-2 text-sm">{lang === 'ar' ? 'التحليل' : 'Analysis'}</h4>
                                <div className="flex gap-3 items-start p-3 rounded-xl border border-slate-200">
                                    <Activity size={18} className="text-blue-500 mt-0.5"/>
                                    <p className="text-sm text-slate-600">{selectedKPI.insight}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Team Details */}
                    {drawerType === 'Team' && selectedTeam && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-blue-600 text-xl border border-slate-200">
                                    {selectedTeam.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900">{selectedTeam.name}</div>
                                    <WorkloadBadge level={selectedTeam.workload}/>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-slate-200 text-center">
                                    <div className="text-2xl font-black text-slate-800">{selectedTeam.efficiency}%</div>
                                    <div className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'الكفاءة' : 'Efficiency'}</div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 text-center">
                                    <div className="text-2xl font-black text-slate-800">{selectedTeam.qaPassRate}%</div>
                                    <div className="text-xs text-slate-400 font-bold">{lang === 'ar' ? 'الجودة' : 'Quality'}</div>
                                </div>
                            </div>

                            {/* ✅ قائمة أعضاء الفريق المضافة */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                                    <Users size={16}/> {lang === 'ar' ? 'أعضاء الفريق' : 'Team Members'}
                                </h4>
                                <div className="space-y-2">
                                    {selectedTeam.members.map((member, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
                                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-xs">
                                                {member.avatar}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedTeam.risk && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 items-start">
                                    <AlertTriangle size={20} className="text-red-600 shrink-0"/>
                                    <div>
                                        <div className="font-bold text-red-800 text-sm mb-1">{lang === 'ar' ? 'مخاطر محتملة' : 'Identified Risk'}</div>
                                        <p className="text-xs text-red-700">{selectedTeam.risk}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Performer Details */}
                    {drawerType === 'Performer' && selectedPerformer && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center font-black text-2xl text-slate-400 mx-auto mb-3 border-2 border-white shadow-md">
                                    {selectedPerformer.name.charAt(0)}
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">{selectedPerformer.name}</h3>
                                <p className="text-sm text-slate-500">{selectedPerformer.role}</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-sm text-slate-600">{lang === 'ar' ? 'المهام المنجزة' : 'Tasks Done'}</span>
                                    <span className="font-bold text-slate-900">{selectedPerformer.tasksCompleted}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="text-sm text-slate-600">{lang === 'ar' ? 'تقييم الجودة' : 'Quality Score'}</span>
                                    <span className="font-bold text-green-600">{selectedPerformer.qualityScore} / 10</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">{lang === 'ar' ? 'عبء العمل' : 'Workload'}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedPerformer.workload === 'High' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{selectedPerformer.workload}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => setIsDrawerOpen(false)} className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100">
                        {lang === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Icons ---
function Globe({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}

function Activity({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}
'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, AlertTriangle, TrendingUp, TrendingDown, 
  Filter, Download, ChevronDown, Calendar, Search, 
  BarChart3, PieChart, FileText, CheckCircle2, DollarSign,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, X, Globe,
  Activity, Wallet, ShieldAlert
} from 'lucide-react';

// --- Types ---
type ProjectStatus = 'Healthy' | 'Watch' | 'At Risk' | 'Overrun';
type CostCategory = 'Labor' | 'Material' | 'Equipment' | 'Subcontractor' | 'Overhead';

interface CostBreakdown {
  category: CostCategory;
  budget: number;
  actual: number;
  committed: number;
  variance: number;
}

interface Transaction {
  id: string;
  type: 'Invoice' | 'PO' | 'Expense';
  vendor: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Approved';
}

interface ProjectCost {
  id: string;
  name: string;
  code: string;
  client: string;
  type: string;
  budget: number;
  actual: number;
  committed: number;
  remaining: number;
  progress: number; // Financial Progress
  physicalProgress: number;
  eac: number; // Estimate at Completion
  status: ProjectStatus;
  burnRate: number; // Daily
  lastUpdated: string;
  breakdown: CostBreakdown[];
  transactions: Transaction[];
}

export default function ProjectsCostPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [period, setPeriod] = useState('Feb 2026');
  const [projects, setProjects] = useState<ProjectCost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer States
  const [selectedProject, setSelectedProject] = useState<ProjectCost | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Breakdown' | 'Transactions' | 'Risks'>('Overview');

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setProjects([
        { 
          id: 'PRJ-001', name: lang === 'ar' ? 'مشروع الورود' : 'Al-Wurud Project', code: 'P-101', client: 'Ministry of Housing', type: 'Lump Sum',
          budget: 500000, actual: 320000, committed: 50000, remaining: 130000, 
          progress: 64, physicalProgress: 70, eac: 480000, status: 'Healthy', burnRate: 2500, lastUpdated: 'Today',
          breakdown: [
            { category: 'Material', budget: 200000, actual: 150000, committed: 20000, variance: 30000 },
            { category: 'Labor', budget: 150000, actual: 100000, committed: 10000, variance: 40000 },
          ],
          transactions: [
            { id: 'INV-001', type: 'Invoice', vendor: 'Saudi Cement', amount: 50000, date: '2024-02-01', status: 'Paid' },
            { id: 'PO-002', type: 'PO', vendor: 'Equipment Co.', amount: 20000, date: '2024-02-05', status: 'Approved' }
          ]
        },
        { 
          id: 'PRJ-002', name: lang === 'ar' ? 'صيانة المولدات' : 'Generator Maintenance', code: 'P-102', client: 'SEC', type: 'Unit Rate',
          budget: 150000, actual: 145000, committed: 10000, remaining: -5000, 
          progress: 96, physicalProgress: 90, eac: 160000, status: 'Overrun', burnRate: 1200, lastUpdated: 'Yesterday',
          breakdown: [
            { category: 'Equipment', budget: 100000, actual: 110000, committed: 5000, variance: -15000 },
          ],
          transactions: []
        },
        { 
          id: 'PRJ-003', name: lang === 'ar' ? 'تمديد الألياف' : 'Fiber Optic Extension', code: 'P-103', client: 'STC', type: 'BOQ',
          budget: 300000, actual: 100000, committed: 50000, remaining: 150000, 
          progress: 33, physicalProgress: 35, eac: 290000, status: 'Healthy', burnRate: 1500, lastUpdated: '2 days ago',
          breakdown: [],
          transactions: []
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  // --- Actions ---
  const handleOpenDrawer = (project: ProjectCost) => {
    setSelectedProject(project);
    setActiveTab('Overview');
    setIsDrawerOpen(true);
  };

  const handleExport = () => {
    alert(lang === 'ar' ? 'جاري تصدير التقرير المالي (PDF)...' : 'Exporting Financial Report (PDF)...');
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // --- Helpers ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch(status) {
        case 'Healthy': return 'bg-green-100 text-green-700 border-green-200';
        case 'Watch': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'At Risk': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Overrun': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Summary Stats
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalActual = projects.reduce((acc, p) => acc + p.actual, 0);
  const totalCommitted = projects.reduce((acc, p) => acc + p.committed, 0);
  const totalRemaining = totalBudget - totalActual - totalCommitted;

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Financial Command Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="text-emerald-600" />
              {lang === 'ar' ? 'التحكم المالي وتكلفة المشاريع' : 'Project Financial Control'}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {lang === 'ar' ? 'مراقبة الميزانيات، المصروفات، والالتزامات عبر المشاريع' : 'Monitor budgets, actuals, and commitments across projects'}
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
                <Download size={16} /> {lang === 'ar' ? 'تقرير التكاليف' : 'Cost Report'}
             </button>
          </div>
        </div>

        {/* Global Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'إجمالي الميزانيات' : 'Total Budgets'} value={formatCurrency(totalBudget)} color="blue" icon={Wallet} />
            <StatCard label={lang === 'ar' ? 'المصروف الفعلي' : 'Actual Spend'} value={formatCurrency(totalActual)} color="emerald" icon={CheckCircle2} />
            <StatCard label={lang === 'ar' ? 'الالتزامات' : 'Committed'} value={formatCurrency(totalCommitted)} color="amber" icon={FileText} />
            <StatCard label={lang === 'ar' ? 'المتبقي' : 'Remaining'} value={formatCurrency(totalRemaining)} color={totalRemaining < 0 ? 'red' : 'green'} icon={Activity} />
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 rtl:right-3 ltr:left-3" />
                <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'بحث باسم المشروع أو الكود...' : 'Search project name or code...'} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-blue-500 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            {['All', 'Healthy', 'Watch', 'At Risk', 'Overrun'].map(status => (
                <button 
                    key={status} 
                    onClick={() => setFilterStatus(status)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap ${filterStatus === status ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                    {status}
                </button>
            ))}
        </div>
      </div>

      {/* --- Section 2: Project Cost Cards --- */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحليل البيانات المالية...' : 'Analyzing financial data...'}</div>
        ) : filteredProjects.map(proj => (
            <div 
                key={proj.id} 
                onClick={() => handleOpenDrawer(proj)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-300 cursor-pointer transition group relative overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{proj.code}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(proj.status)}`}>{proj.status}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition line-clamp-1">{proj.name}</h3>
                        <p className="text-xs text-slate-400">{proj.client} • {proj.type}</p>
                    </div>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition"><MoreHorizontal size={16}/></button>
                </div>

                {/* Financial Summary */}
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-500">{lang === 'ar' ? 'الميزانية المعتمدة' : 'Approved Budget'}</div>
                        <div className="font-black text-slate-900 text-lg">{formatCurrency(proj.budget)}</div>
                    </div>
                    
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {/* Actual */}
                        <div className="h-full bg-emerald-500" style={{ width: `${(proj.actual / proj.budget) * 100}%` }} title={`Actual: ${formatCurrency(proj.actual)}`}></div>
                        {/* Committed */}
                        <div className="h-full bg-amber-400" style={{ width: `${(proj.committed / proj.budget) * 100}%` }} title={`Committed: ${formatCurrency(proj.committed)}`}></div>
                    </div>
                    
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Actual {Math.round((proj.actual / proj.budget) * 100)}%</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Committed {Math.round((proj.committed / proj.budget) * 100)}%</span>
                        <span>{lang === 'ar' ? 'المتبقي' : 'Remaining'}: {formatCurrency(proj.remaining)}</span>
                    </div>
                </div>

                {/* EAC & Variance */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">{lang === 'ar' ? 'التوقع عند الإغلاق (EAC)' : 'Forecast (EAC)'}</div>
                        <div className="font-bold text-slate-800">{formatCurrency(proj.eac)}</div>
                    </div>
                    <div className={`text-right ${proj.eac > proj.budget ? 'text-red-600' : 'text-green-600'}`}>
                        <div className="text-[10px] font-bold uppercase mb-0.5">{lang === 'ar' ? 'الانحراف' : 'Variance'}</div>
                        <div className="font-bold flex items-center gap-1 justify-end">
                            {proj.eac > proj.budget ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                            {formatCurrency(Math.abs(proj.budget - proj.eac))}
                        </div>
                    </div>
                </div>

            </div>
        ))}
      </div>

      {/* --- Section 3: Detail Drawer --- */}
      {isDrawerOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(selectedProject.status)}`}>{selectedProject.status}</span>
                            <span className="text-xs text-slate-500 font-mono">{selectedProject.code}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedProject.name}</h2>
                        <div className="text-xs text-slate-500 mt-1">{selectedProject.client} • {selectedProject.type}</div>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6">
                    {['Overview', 'Breakdown', 'Transactions', 'Risks'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-3 text-xs font-bold border-b-2 transition ${activeTab === tab ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Overview Tab */}
                    {activeTab === 'Overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'المصروف الفعلي' : 'Actual Spend'}</div>
                                    <div className="text-2xl font-black text-slate-900">{formatCurrency(selectedProject.actual)}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                    <div className="text-xs text-slate-400 font-bold uppercase mb-1">{lang === 'ar' ? 'الالتزامات' : 'Committed'}</div>
                                    <div className="text-2xl font-black text-slate-900">{formatCurrency(selectedProject.committed)}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 text-sm">{lang === 'ar' ? 'ملخص الأداء المالي' : 'Financial Performance Summary'}</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                                        <span className="text-sm text-slate-600">{lang === 'ar' ? 'التقدم المالي' : 'Financial Progress'}</span>
                                        <span className="font-bold text-slate-900">{selectedProject.progress}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                                        <span className="text-sm text-slate-600">{lang === 'ar' ? 'التقدم الفعلي (ميداني)' : 'Physical Progress'}</span>
                                        <span className="font-bold text-slate-900">{selectedProject.physicalProgress}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                                        <span className="text-sm text-slate-600">{lang === 'ar' ? 'معدل الحرق اليومي' : 'Daily Burn Rate'}</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(selectedProject.burnRate)} / day</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Breakdown Tab */}
                    {activeTab === 'Breakdown' && (
                        <div>
                            <h4 className="font-bold text-slate-800 mb-3 text-sm">{lang === 'ar' ? 'تحليل التكلفة حسب الفئة' : 'Cost Breakdown by Category'}</h4>
                            {selectedProject.breakdown.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedProject.breakdown.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-300 transition">
                                            <div className="flex justify-between font-bold text-sm mb-2">
                                                <span>{item.category}</span>
                                                <span>{formatCurrency(item.budget)}</span>
                                            </div>
                                            <div className="flex text-xs gap-4 text-slate-500">
                                                <span>Actual: {formatCurrency(item.actual)}</span>
                                                <span className={item.variance < 0 ? 'text-red-500' : 'text-green-500'}>Var: {formatCurrency(item.variance)}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${(item.actual / item.budget) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-center p-6 text-slate-400 italic">No breakdown data available.</div>}
                        </div>
                    )}

                    {/* Transactions Tab */}
                    {activeTab === 'Transactions' && (
                        <div>
                            <h4 className="font-bold text-slate-800 mb-3 text-sm">{lang === 'ar' ? 'سجل المعاملات' : 'Transaction Log'}</h4>
                            {selectedProject.transactions.length > 0 ? (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left rtl:text-right">
                                        <thead className="bg-slate-50 font-bold text-slate-500">
                                            <tr>
                                                <th className="p-3">Ref</th>
                                                <th className="p-3">Type</th>
                                                <th className="p-3">Vendor</th>
                                                <th className="p-3">Amount</th>
                                                <th className="p-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedProject.transactions.map((tx) => (
                                                <tr key={tx.id}>
                                                    <td className="p-3 font-mono text-xs">{tx.id}</td>
                                                    <td className="p-3">{tx.type}</td>
                                                    <td className="p-3">{tx.vendor}</td>
                                                    <td className="p-3 font-bold">{formatCurrency(tx.amount)}</td>
                                                    <td className="p-3"><span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs border border-green-100">{tx.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <div className="text-center p-6 text-slate-400 italic">No transactions recorded.</div>}
                        </div>
                    )}

                    {/* Risks Tab */}
                    {activeTab === 'Risks' && (
                        <div className="space-y-4">
                            {selectedProject.status === 'Overrun' && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 items-start">
                                    <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5"/>
                                    <div>
                                        <div className="font-bold text-red-800 text-sm">{lang === 'ar' ? 'تجاوز الميزانية' : 'Budget Overrun Detected'}</div>
                                        <p className="text-xs text-red-600 mt-1">Actual spend plus commitments exceed the approved budget by {formatCurrency(Math.abs(selectedProject.remaining))}. Immediate review required.</p>
                                    </div>
                                </div>
                            )}
                            {selectedProject.burnRate > 2000 && (
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                                    <Activity size={20} className="text-amber-600 shrink-0 mt-0.5"/>
                                    <div>
                                        <div className="font-bold text-amber-800 text-sm">{lang === 'ar' ? 'معدل حرق مرتفع' : 'High Burn Rate Warning'}</div>
                                        <p className="text-xs text-amber-600 mt-1">Daily spend is averaging {formatCurrency(selectedProject.burnRate)}, which is 15% above plan.</p>
                                    </div>
                                </div>
                            )}
                            {selectedProject.status === 'Healthy' && (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3 items-center text-green-700 font-bold text-sm">
                                    <CheckCircle2 size={20}/> {lang === 'ar' ? 'لا توجد مخاطر مالية حالياً' : 'No financial risks detected'}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2">
                        <Download size={16}/> {lang === 'ar' ? 'تصدير التفاصيل' : 'Export Details'}
                    </button>
                    {selectedProject.status === 'Overrun' && (
                        <button className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-lg flex items-center justify-center gap-2">
                            <ShieldAlert size={16}/> {lang === 'ar' ? 'طلب موافقة طارئة' : 'Request Override'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function StatCard({ label, value, color, icon: Icon }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };
    return (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div>
                <div className="text-xl font-black text-slate-900">{value}</div>
                <div className="text-xs font-bold text-slate-400">{label}</div>
            </div>
            <div className={`p-3 rounded-xl ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}
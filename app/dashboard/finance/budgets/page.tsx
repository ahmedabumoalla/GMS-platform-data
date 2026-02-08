'use client';

import { useState, useEffect } from 'react';
import { 
  PieChart, DollarSign, Filter, Download, ChevronDown, Calendar, 
  Search, BarChart3, TrendingUp, TrendingDown, ArrowRightLeft, 
  FileText, CheckCircle2, AlertTriangle, ShieldCheck, X, Activity,
  Globe, Lock, RefreshCw, MoreHorizontal, Plus
} from 'lucide-react';

// --- Types ---
type BudgetStatus = 'Draft' | 'Under Review' | 'Approved' | 'Locked';
type DepartmentStatus = 'Healthy' | 'Watch' | 'Risk';

interface BudgetLine {
  id: string;
  costCenter: string;
  planned: number;
  committed: number;
  spent: number;
  remaining: number;
  owner: string;
  notes: string;
}

interface DepartmentBudget {
  id: string;
  name: string;
  totalBudget: number;
  allocationPercent: number;
  spent: number;
  committed: number;
  remaining: number;
  forecast: number;
  variance: number;
  status: DepartmentStatus;
  lines: BudgetLine[];
}

export default function BudgetsPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [year, setYear] = useState('2026');
  const [version, setVersion] = useState('Approved v1');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [departments, setDepartments] = useState<DepartmentBudget[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentBudget | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Breakdown' | 'Projects' | 'Audit'>('Breakdown');

  // Filter States
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setDepartments([
        { 
          id: 'DEP-001', name: lang === 'ar' ? 'العمليات والتشغيل' : 'Operations', totalBudget: 500000, allocationPercent: 60,
          spent: 250000, committed: 100000, remaining: 150000, forecast: 480000, variance: 20000, status: 'Healthy',
          lines: [
            { id: 'L1', costCenter: 'Materials', planned: 200000, spent: 100000, committed: 50000, remaining: 50000, owner: 'Eng. Ahmed', notes: 'Within limits' },
            { id: 'L2', costCenter: 'Labor', planned: 300000, spent: 150000, committed: 50000, remaining: 100000, owner: 'HR Dept', notes: 'Stable' }
          ]
        },
        { 
          id: 'DEP-002', name: lang === 'ar' ? 'الموارد البشرية' : 'Human Resources', totalBudget: 200000, allocationPercent: 25,
          spent: 180000, committed: 10000, remaining: 10000, forecast: 210000, variance: -10000, status: 'Risk',
          lines: [
            { id: 'L3', costCenter: 'Recruitment', planned: 50000, spent: 60000, committed: 5000, remaining: -15000, owner: 'HR Manager', notes: 'Overspent due to urgent hiring' }
          ]
        },
        { 
          id: 'DEP-003', name: lang === 'ar' ? 'التسويق والمبيعات' : 'Marketing & Sales', totalBudget: 100000, allocationPercent: 15,
          spent: 40000, committed: 20000, remaining: 40000, forecast: 95000, variance: 5000, status: 'Watch',
          lines: []
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  // --- Calculations ---
  const grandTotal = departments.reduce((acc, d) => acc + d.totalBudget, 0);
  const totalSpent = departments.reduce((acc, d) => acc + d.spent, 0);
  const totalCommitted = departments.reduce((acc, d) => acc + d.committed, 0);
  const totalRemaining = grandTotal - totalSpent - totalCommitted;
  const totalForecast = departments.reduce((acc, d) => acc + d.forecast, 0);

  // --- Handlers ---
  const handleOpenDrawer = (dept: DepartmentBudget) => {
    setSelectedDept(dept);
    setActiveTab('Breakdown');
    setIsDrawerOpen(true);
  };

  const handleExport = () => {
    alert(lang === 'ar' ? 'جاري تصدير الميزانية (Excel)...' : 'Exporting Budget (Excel)...');
  };

  const handleLockBudget = () => {
    if(confirm(lang === 'ar' ? 'هل أنت متأكد من قفل الميزانية؟ لا يمكن إجراء تعديلات بعد ذلك.' : 'Lock Budget? No further edits allowed.')) {
        alert(lang === 'ar' ? 'تم قفل الميزانية بنجاح' : 'Budget Locked Successfully');
    }
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const filteredDepartments = departments.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
  });

  // --- Helpers ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: DepartmentStatus) => {
    switch(status) {
        case 'Healthy': return 'bg-green-100 text-green-700 border-green-200';
        case 'Watch': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Risk': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Budget Year Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <PieChart className="text-emerald-600" />
              {lang === 'ar' ? 'الميزانيات السنوية' : 'Annual Budgets'}
            </h1>
            <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-200 transition">
                    <Calendar size={12}/> {year} <ChevronDown size={10}/>
                </div>
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-xs font-bold text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100 transition">
                    <RefreshCw size={12}/> {version} <ChevronDown size={10}/>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">Approved</span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <button onClick={handleLockBudget} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-50 flex items-center gap-2 transition">
                <Lock size={16} /> {lang === 'ar' ? 'قفل الميزانية' : 'Lock Budget'}
             </button>
             <button onClick={handleExport} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95">
                <Download size={16} /> {lang === 'ar' ? 'تصدير Excel' : 'Export Excel'}
             </button>
          </div>
        </div>

        {/* Global Totals Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'إجمالي الميزانية' : 'Total Budget'} value={formatCurrency(grandTotal)} color="blue" icon={DollarSign} />
            <StatCard label={lang === 'ar' ? 'المصروف الفعلي' : 'Spent YTD'} value={formatCurrency(totalSpent)} color="emerald" icon={CheckCircle2} />
            <StatCard label={lang === 'ar' ? 'الالتزامات' : 'Committed'} value={formatCurrency(totalCommitted)} color="amber" icon={FileText} />
            <StatCard label={lang === 'ar' ? 'المتبقي' : 'Remaining'} value={formatCurrency(totalRemaining)} color={totalRemaining < 0 ? 'red' : 'green'} icon={Activity} />
            <StatCard label={lang === 'ar' ? 'التوقعات' : 'Forecast'} value={formatCurrency(totalForecast)} color="slate" icon={TrendingUp} highlight />
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 rtl:right-3 ltr:left-3" />
                <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'بحث بالأقسام...' : 'Search departments...'} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-blue-500 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            {['All', 'Healthy', 'Watch', 'Risk'].map(status => (
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

      {/* --- Section 2: Department Allocation Cards --- */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full text-center py-20 text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل الميزانيات...' : 'Loading budgets...'}</div>
        ) : filteredDepartments.map(dept => (
            <div 
                key={dept.id} 
                onClick={() => handleOpenDrawer(dept)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-300 cursor-pointer transition group relative overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{dept.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(dept.status)}`}>{dept.status}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition">{dept.name}</h3>
                    </div>
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition"><MoreHorizontal size={16}/></button>
                </div>

                {/* Financial Summary */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-500">{lang === 'ar' ? 'الميزانية المخصصة' : 'Allocated Budget'}</div>
                        <div className="font-black text-slate-900 text-xl">{formatCurrency(dept.totalBudget)}</div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">{lang === 'ar' ? 'المصروف' : 'Spent'}</span>
                            <span className="font-bold text-slate-800">{formatCurrency(dept.spent)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">{lang === 'ar' ? 'الالتزامات' : 'Committed'}</span>
                            <span className="font-bold text-slate-800">{formatCurrency(dept.committed)}</span>
                        </div>
                        <div className="h-px bg-slate-200 my-1"></div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className={dept.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}>{lang === 'ar' ? 'المتبقي' : 'Remaining'}</span>
                            <span className={dept.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(dept.remaining)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>{lang === 'ar' ? 'نسبة التخصيص' : 'Allocation'}: {dept.allocationPercent}%</span>
                        <div className="flex items-center gap-1">
                            {dept.variance > 0 ? <TrendingUp size={12} className="text-emerald-500"/> : <TrendingDown size={12} className="text-red-500"/>}
                            <span className={dept.variance > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{formatCurrency(Math.abs(dept.variance))}</span>
                        </div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* --- Section 3: Detail Drawer --- */}
      {isDrawerOpen && selectedDept && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusColor(selectedDept.status)}`}>{selectedDept.status}</span>
                            <span className="text-xs text-slate-500 font-mono">{selectedDept.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">{selectedDept.name}</h2>
                        <div className="text-xs text-slate-500 mt-1">{year} • {version}</div>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6">
                    {['Breakdown', 'Projects', 'Audit'].map(tab => (
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
                    
                    {/* Breakdown Tab */}
                    {activeTab === 'Breakdown' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-slate-800 text-sm">{lang === 'ar' ? 'تفاصيل مراكز التكلفة' : 'Cost Center Breakdown'}</h4>
                                <button className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"><Plus size={12}/> {lang === 'ar' ? 'إضافة بند' : 'Add Line'}</button>
                            </div>
                            
                            {selectedDept.lines.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedDept.lines.map((line) => (
                                        <div key={line.id} className="p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-300 transition">
                                            <div className="flex justify-between font-bold text-sm mb-2">
                                                <span>{line.costCenter}</span>
                                                <span>{formatCurrency(line.planned)}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mb-2">
                                                <div>Spent: <span className="text-slate-800 font-bold">{formatCurrency(line.spent)}</span></div>
                                                <div>Commit: <span className="text-slate-800 font-bold">{formatCurrency(line.committed)}</span></div>
                                                <div>Rem: <span className={`${line.remaining < 0 ? 'text-red-600' : 'text-emerald-600'} font-bold`}>{formatCurrency(line.remaining)}</span></div>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${line.remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((line.spent / line.planned) * 100, 100)}%` }}></div>
                                            </div>
                                            <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                                                <span>Owner: {line.owner}</span>
                                                <span className="italic">{line.notes}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-center p-6 text-slate-400 italic">No breakdown lines available.</div>}
                        </div>
                    )}

                    {/* Projects Tab Placeholder */}
                    {activeTab === 'Projects' && (
                        <div className="text-center p-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            {lang === 'ar' ? 'لا توجد مشاريع مرتبطة حالياً' : 'No linked projects currently'}
                        </div>
                    )}

                    {/* Audit Tab Placeholder */}
                    {activeTab === 'Audit' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm">{lang === 'ar' ? 'سجل التغييرات' : 'Change Log'}</h4>
                            <div className="pl-3 border-l-2 border-slate-200 space-y-4">
                                <div className="text-xs text-slate-600">
                                    <span className="font-bold">System</span> created V1 baseline <span className="text-slate-400">- Jan 01, 2026</span>
                                </div>
                                <div className="text-xs text-slate-600">
                                    <span className="font-bold">Finance Mgr</span> approved budget <span className="text-slate-400">- Jan 15, 2026</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2">
                        <Download size={16}/> {lang === 'ar' ? 'تصدير التفاصيل' : 'Export Details'}
                    </button>
                    <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
                        <ArrowRightLeft size={16}/> {lang === 'ar' ? 'طلب مناقلة' : 'Request Transfer'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function StatCard({ label, value, color, icon: Icon, highlight }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        slate: 'bg-slate-100 text-slate-600',
    };
    return (
        <div className={`p-4 rounded-2xl border flex flex-col justify-between h-24 ${highlight ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start">
                <div className={`text-xs font-bold ${highlight ? 'text-slate-400' : 'text-slate-400'}`}>{label}</div>
                <div className={`p-1.5 rounded-lg ${highlight ? 'bg-slate-800 text-emerald-400' : colors[color]}`}>
                    <Icon size={14} />
                </div>
            </div>
            <div className={`text-xl font-black ${highlight ? 'text-white' : 'text-slate-900'}`}>{value}</div>
        </div>
    );
}
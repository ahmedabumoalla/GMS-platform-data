'use client';

import { useState, useEffect } from 'react';
import { 
  Banknote, Download, Search, Filter, ChevronDown, FileText, 
  CheckCircle2, AlertTriangle, X, Printer, User, Building2, 
  Calendar, RefreshCw, ShieldCheck, ArrowRightLeft, DollarSign,
  Globe, LayoutList, MoreHorizontal
} from 'lucide-react';

// --- Types ---
type PayrollStatus = 'Draft' | 'Under Review' | 'Approved' | 'Paid' | 'Failed';
type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';

interface Earnings {
  basic: number;
  housing: number;
  transport: number;
  overtime: number;
  bonus: number;
}

interface Deductions {
  absence: number;
  gosi: number; // Social Insurance
  loans: number;
  other: number;
}

interface EmployeePayroll {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  project?: string;
  iban: string;
  earnings: Earnings;
  deductions: Deductions;
  netPay: number;
  status: PayrollStatus;
  lastUpdated: string;
  hasAnomaly?: boolean;
  anomalyReason?: string;
}

export default function PayrollPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [period, setPeriod] = useState('Feb 2026');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [payrolls, setPayrolls] = useState<EmployeePayroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<EmployeePayroll | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPayrolls([
        { 
          id: 'PY-101', employeeId: 'EMP-001', name: lang === 'ar' ? 'أحمد الغامدي' : 'Ahmed Al-Ghamdi', role: 'Project Manager', department: 'Operations', project: 'Al-Wurud',
          iban: 'SA55****************01', earnings: { basic: 15000, housing: 3750, transport: 1000, overtime: 500, bonus: 0 },
          deductions: { absence: 0, gosi: 1500, loans: 0, other: 0 }, netPay: 18750, status: 'Paid', lastUpdated: '2024-02-01'
        },
        { 
          id: 'PY-102', employeeId: 'EMP-002', name: lang === 'ar' ? 'سعيد القحطاني' : 'Saeed Al-Qahtani', role: 'Technician', department: 'Maintenance', project: 'Site B',
          iban: 'SA44****************02', earnings: { basic: 6000, housing: 1500, transport: 500, overtime: 1200, bonus: 200 },
          deductions: { absence: 300, gosi: 600, loans: 500, other: 0 }, netPay: 8000, status: 'Under Review', lastUpdated: 'Yesterday',
          hasAnomaly: true, anomalyReason: 'High Overtime'
        },
        { 
          id: 'PY-103', employeeId: 'EMP-003', name: lang === 'ar' ? 'ياسر الحربي' : 'Yasser Al-Harbi', role: 'Supervisor', department: 'Operations', project: 'Main HQ',
          iban: 'SA33****************03', earnings: { basic: 8500, housing: 2125, transport: 800, overtime: 0, bonus: 0 },
          deductions: { absence: 0, gosi: 850, loans: 0, other: 0 }, netPay: 10575, status: 'Draft', lastUpdated: 'Today'
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  // --- Calculations ---
  const totalBasic = payrolls.reduce((acc, p) => acc + p.earnings.basic, 0);
  const totalAllowances = payrolls.reduce((acc, p) => acc + p.earnings.housing + p.earnings.transport + p.earnings.overtime + p.earnings.bonus, 0);
  const totalDeductions = payrolls.reduce((acc, p) => acc + p.deductions.absence + p.deductions.gosi + p.deductions.loans + p.deductions.other, 0);
  const totalNet = payrolls.reduce((acc, p) => acc + p.netPay, 0);

  // --- Handlers ---
  const handleOpenDrawer = (payroll: EmployeePayroll) => {
    setSelectedPayroll(payroll);
    setIsDrawerOpen(true);
  };

  const handleExport = (type: 'Excel' | 'Bank') => {
    alert(lang === 'ar' ? `جاري تصدير ملف ${type}...` : `Exporting ${type} File...`);
  };

  const handleApprove = (id: string) => {
    if(confirm(lang === 'ar' ? 'هل أنت متأكد من اعتماد هذا الراتب؟' : 'Approve this payroll record?')) {
        setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
        if(selectedPayroll?.id === id) setSelectedPayroll(prev => prev ? {...prev, status: 'Approved'} : null);
    }
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const filteredPayrolls = payrolls.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'All' || p.status === filterStatus;
      return matchesSearch && matchesFilter;
  });

  // --- Helper Components ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: PayrollStatus) => {
    const styles = {
        'Paid': 'bg-green-100 text-green-700 border-green-200',
        'Approved': 'bg-blue-100 text-blue-700 border-blue-200',
        'Under Review': 'bg-amber-100 text-amber-700 border-amber-200',
        'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
        'Failed': 'bg-red-100 text-red-700 border-red-200'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Payroll Cycle Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Banknote className="text-green-600" />
              {lang === 'ar' ? 'مسير الرواتب' : 'Payroll Run'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500 font-medium">{lang === 'ar' ? 'دورة الرواتب:' : 'Payroll Cycle:'}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-700 flex items-center gap-1"><Calendar size={12}/> {period}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <button onClick={() => handleExport('Bank')} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-50 flex items-center gap-2 transition">
                <ArrowRightLeft size={16} /> {lang === 'ar' ? 'ملف البنك (WPS)' : 'Bank File'}
             </button>
             <button onClick={() => handleExport('Excel')} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-slate-800 shadow-lg flex items-center gap-2 transition active:scale-95">
                <Download size={16} /> {lang === 'ar' ? 'تصدير Excel' : 'Export Excel'}
             </button>
          </div>
        </div>

        {/* Global Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'الموظفين' : 'Employees'} value={payrolls.length} color="slate" icon={User} />
            <StatCard label={lang === 'ar' ? 'إجمالي الأساسي' : 'Total Basic'} value={formatCurrency(totalBasic)} color="blue" icon={DollarSign} />
            <StatCard label={lang === 'ar' ? 'إجمالي البدلات' : 'Total Allowances'} value={formatCurrency(totalAllowances)} color="green" icon={TrendingUp} />
            <StatCard label={lang === 'ar' ? 'إجمالي الخصومات' : 'Total Deductions'} value={formatCurrency(totalDeductions)} color="red" icon={TrendingDown} />
            <StatCard label={lang === 'ar' ? 'صافي الرواتب' : 'Total Net Pay'} value={formatCurrency(totalNet)} color="emerald" icon={Banknote} highlight />
        </div>

        {/* Filters & Search */}
        <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 rtl:right-3 ltr:left-3" />
                <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'بحث بالاسم أو الرقم الوظيفي...' : 'Search name or ID...'} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-blue-500 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            {['All', 'Draft', 'Under Review', 'Approved', 'Paid'].map(status => (
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

      {/* --- Section 2: Payroll Table --- */}
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                        <th className="p-4">{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الأساسي' : 'Basic'}</th>
                        <th className="p-4">{lang === 'ar' ? 'البدلات' : 'Allowances'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الخصومات' : 'Deductions'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الصافي' : 'Net Pay'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="p-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={7} className="p-10 text-center text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</td></tr>
                    ) : filteredPayrolls.map(payroll => (
                        <tr key={payroll.id} className="hover:bg-slate-50 transition group cursor-default">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200">
                                        {payroll.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{payroll.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{payroll.employeeId} • {payroll.department}</div>
                                    </div>
                                    {/* ✅ تم التصحيح هنا: استخدام span للحاوية */}
                                    {payroll.hasAnomaly && (
                                        <span title={payroll.anomalyReason}>
                                            <AlertTriangle size={14} className="text-amber-500"/>
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 text-xs font-mono text-slate-600">{formatCurrency(payroll.earnings.basic)}</td>
                            <td className="p-4 text-xs font-mono text-green-600">+{formatCurrency(payroll.earnings.housing + payroll.earnings.transport + payroll.earnings.overtime + payroll.earnings.bonus)}</td>
                            <td className="p-4 text-xs font-mono text-red-600">-{formatCurrency(payroll.deductions.absence + payroll.deductions.gosi + payroll.deductions.loans)}</td>
                            <td className="p-4 font-bold text-slate-900">{formatCurrency(payroll.netPay)}</td>
                            <td className="p-4">{getStatusBadge(payroll.status)}</td>
                            <td className="p-4 text-end">
                                <button 
                                    onClick={() => handleOpenDrawer(payroll)}
                                    className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                                >
                                    <FileText size={14}/> {lang === 'ar' ? 'عرض القسيمة' : 'View Slip'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- Section 3: Payslip Detail Drawer --- */}
      {isDrawerOpen && selectedPayroll && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-slate-500 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">{selectedPayroll.employeeId}</span>
                            {getStatusBadge(selectedPayroll.status)}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedPayroll.name}</h2>
                        <div className="text-xs text-slate-500 mt-1">{selectedPayroll.role} • {selectedPayroll.department}</div>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Net Pay Card */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">{lang === 'ar' ? 'صافي المستحق' : 'Net Pay'}</div>
                        <div className="text-3xl font-black">{formatCurrency(selectedPayroll.netPay)}</div>
                        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-xs text-slate-300">
                            <Building2 size={12}/> IBAN: <span className="font-mono">{selectedPayroll.iban}</span>
                        </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        
                        {/* Earnings */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-green-700 text-sm border-b border-green-100 pb-2">{lang === 'ar' ? 'الاستحقاقات' : 'Earnings'}</h4>
                            <div className="text-xs space-y-2">
                                <div className="flex justify-between"><span>Basic</span> <span>{formatCurrency(selectedPayroll.earnings.basic)}</span></div>
                                <div className="flex justify-between"><span>Housing</span> <span>{formatCurrency(selectedPayroll.earnings.housing)}</span></div>
                                <div className="flex justify-between"><span>Transport</span> <span>{formatCurrency(selectedPayroll.earnings.transport)}</span></div>
                                <div className="flex justify-between font-bold text-green-600"><span>Overtime</span> <span>{formatCurrency(selectedPayroll.earnings.overtime)}</span></div>
                                <div className="flex justify-between text-green-600"><span>Bonus</span> <span>{formatCurrency(selectedPayroll.earnings.bonus)}</span></div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-red-700 text-sm border-b border-red-100 pb-2">{lang === 'ar' ? 'الاستقطاعات' : 'Deductions'}</h4>
                            <div className="text-xs space-y-2">
                                <div className="flex justify-between"><span>GOSI</span> <span>{formatCurrency(selectedPayroll.deductions.gosi)}</span></div>
                                <div className="flex justify-between text-red-600"><span>Absence</span> <span>{formatCurrency(selectedPayroll.deductions.absence)}</span></div>
                                <div className="flex justify-between"><span>Loans</span> <span>{formatCurrency(selectedPayroll.deductions.loans)}</span></div>
                                <div className="flex justify-between"><span>Other</span> <span>{formatCurrency(selectedPayroll.deductions.other)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Anomaly Alert */}
                    {selectedPayroll.hasAnomaly && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 items-start">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5"/>
                            <div>
                                <div className="font-bold text-amber-800 text-xs mb-1">{lang === 'ar' ? 'تنبيه النظام' : 'System Alert'}</div>
                                <p className="text-xs text-amber-700">{selectedPayroll.anomalyReason}</p>
                            </div>
                        </div>
                    )}

                    {/* Audit Log */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">{lang === 'ar' ? 'سجل التدقيق' : 'Audit Trail'}</h4>
                        <div className="space-y-2 pl-2 border-l-2 border-slate-100">
                            <div className="text-xs text-slate-600 pl-2">
                                <span className="font-bold">System</span> calculated payroll <span className="text-slate-400">- 2024-02-01 09:00</span>
                            </div>
                            <div className="text-xs text-slate-600 pl-2">
                                <span className="font-bold">HR Manager</span> reviewed hours <span className="text-slate-400">- 2024-02-02 14:30</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 flex items-center justify-center gap-2">
                        <Printer size={16}/> {lang === 'ar' ? 'طباعة' : 'Print'}
                    </button>
                    {selectedPayroll.status !== 'Approved' && selectedPayroll.status !== 'Paid' && (
                        <button 
                            onClick={() => handleApprove(selectedPayroll.id)}
                            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={16}/> {lang === 'ar' ? 'اعتماد' : 'Approve'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Icons (TrendingUp/Down placeholders) ---
function TrendingUp({ size, className }: any) { return <ArrowRightLeft size={size} className={className} style={{transform: 'rotate(-45deg)'}}/> }
function TrendingDown({ size, className }: any) { return <ArrowRightLeft size={size} className={className} style={{transform: 'rotate(45deg)'}}/> }

// --- Helper Components ---
function StatCard({ label, value, color, icon: Icon, highlight }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
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
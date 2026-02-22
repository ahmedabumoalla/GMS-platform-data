'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Banknote, Download, Search, Filter, ChevronDown, Calendar, 
  CheckCircle2, AlertTriangle, X, Printer, User, Building2, 
  RefreshCw, ShieldCheck, ArrowRightLeft, DollarSign,
  Globe, LayoutList, MoreHorizontal, FileText, Loader2
} from 'lucide-react';
import { useDashboard } from '../../layout';

// --- Types ---
type PayrollStatus = 'Draft' | 'Under Review' | 'Approved' | 'Paid' | 'Failed';

interface Earnings { basic: number; housing: number; transport: number; overtime: number; bonus: number; }
interface Deductions { absence: number; gosi: number; loans: number; other: number; }

interface EmployeePayroll {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
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
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [period, setPeriod] = useState('Feb 2026'); // يمكن جعله Dropdown لاحقاً
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Data States
  const [payrolls, setPayrolls] = useState<EmployeePayroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<EmployeePayroll | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'hr_manager';

  // --- 1. Fetch Data (Decoupled Queries) ---
  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      // 1. جلب الدورة المالية الحالية
      const { data: cycleData, error: cycleErr } = await supabase.from('payroll_cycles').select('id').eq('period', period).single();
      if (cycleErr && cycleErr.code !== 'PGRST116') throw cycleErr; // Ignore 'No rows' error
      
      if (cycleData) {
          // 2. جلب سجلات الرواتب لهذه الدورة
          let payrollQuery = supabase.from('employee_payrolls').select('*').eq('cycle_id', cycleData.id);
          
          if (!isAdmin) {
              payrollQuery = payrollQuery.eq('employee_id', user?.id); // الموظف يرى راتبه فقط
          }

          const { data: recordsData, error: recErr } = await payrollQuery;
          if (recErr) throw recErr;

          if (recordsData && recordsData.length > 0) {
              // 3. جلب بيانات الموظفين بشكل منفصل (Decoupled)
              const empIds = [...new Set(recordsData.map(r => r.employee_id))];
              const { data: profilesData } = await supabase.from('profiles').select('id, full_name, role, department, bank_iban').in('id', empIds);

              // 4. الدمج البرمجي
              const formattedData: EmployeePayroll[] = recordsData.map(record => {
                  const empProfile = profilesData?.find(p => p.id === record.employee_id);
                  
                  return {
                      id: record.id,
                      employeeId: empProfile?.id?.substring(0, 8).toUpperCase() || 'EMP-000',
                      name: empProfile?.full_name || 'Unknown Employee',
                      role: empProfile?.role || 'Staff',
                      department: empProfile?.department || 'General',
                      iban: empProfile?.bank_iban || 'SA0000000000000000000000',
                      earnings: {
                          basic: Number(record.basic_salary),
                          housing: Number(record.housing_allowance),
                          transport: Number(record.transport_allowance),
                          overtime: Number(record.overtime),
                          bonus: Number(record.bonus)
                      },
                      deductions: {
                          absence: Number(record.absence_deduction),
                          gosi: Number(record.gosi_deduction),
                          loans: Number(record.loans_deduction),
                          other: Number(record.other_deduction)
                      },
                      netPay: Number(record.net_pay),
                      status: record.status as PayrollStatus,
                      lastUpdated: new Date(record.updated_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'),
                      hasAnomaly: record.has_anomaly,
                      anomalyReason: record.anomaly_reason
                  };
              });

              setPayrolls(formattedData);
          } else {
              setPayrolls([]);
          }
      }
    } catch (error: any) {
      console.error('Error fetching payroll:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [user, isRTL, period]);

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
    alert(isRTL ? `جاري تصدير ملف ${type}...` : `Exporting ${type} File...`);
  };

  const handleApprove = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من اعتماد هذا الراتب؟' : 'Approve this payroll record?')) return;
    
    setActionLoading(id);
    try {
        const { error } = await supabase.from('employee_payrolls').update({ status: 'Approved', updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;

        setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
        if (selectedPayroll?.id === id) setSelectedPayroll(prev => prev ? { ...prev, status: 'Approved' } : null);
        alert(isRTL ? 'تم الاعتماد بنجاح' : 'Approved successfully');
    } catch (error: any) {
        alert('Error: ' + error.message);
    } finally {
        setActionLoading(null);
    }
  };

  const filteredPayrolls = payrolls.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'All' || p.status === filterStatus;
      return matchesSearch && matchesFilter;
  });

  // --- Helper Components ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: PayrollStatus) => {
    const styles = {
        'Paid': isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-100 text-green-700 border-green-200',
        'Approved': isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200',
        'Under Review': isDark ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-700 border-amber-200',
        'Draft': isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200',
        'Failed': isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
    };
    
    const translatedStatus = isRTL ? {
        'Paid': 'مدفوع', 'Approved': 'معتمد', 'Under Review': 'قيد المراجعة', 'Draft': 'مسودة', 'Failed': 'فشل التحويل'
    }[status] : status;

    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]}`}>{translatedStatus}</span>;
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Payroll Cycle Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Banknote className="text-green-600" />
              {isRTL ? 'مسير الرواتب' : 'Payroll Run'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${textSub}`}>{isRTL ? 'دورة الرواتب:' : 'Payroll Cycle:'}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                    <Calendar size={12}/> {period}
                </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
             <button onClick={() => handleExport('Bank')} className={`border px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <ArrowRightLeft size={16} /> {isRTL ? 'ملف البنك (WPS)' : 'Bank File'}
             </button>
             <button onClick={() => handleExport('Excel')} className={`text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 ${isDark ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' : 'bg-slate-900 hover:bg-slate-800'}`}>
                <Download size={16} /> {isRTL ? 'تصدير Excel' : 'Export Excel'}
             </button>
          </div>
        </div>

        {/* Global Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard isDark={isDark} label={isRTL ? 'الموظفين' : 'Employees'} value={payrolls.length} color="slate" icon={User} />
            <StatCard isDark={isDark} label={isRTL ? 'إجمالي الأساسي' : 'Total Basic'} value={formatCurrency(totalBasic)} color="blue" icon={DollarSign} />
            <StatCard isDark={isDark} label={isRTL ? 'إجمالي البدلات' : 'Total Allowances'} value={formatCurrency(totalAllowances)} color="green" icon={TrendingUp} />
            <StatCard isDark={isDark} label={isRTL ? 'إجمالي الخصومات' : 'Total Deductions'} value={formatCurrency(totalDeductions)} color="red" icon={TrendingDown} />
            <StatCard isDark={isDark} label={isRTL ? 'صافي الرواتب' : 'Total Net Pay'} value={formatCurrency(totalNet)} color="emerald" icon={Banknote} highlight />
        </div>

        {/* Filters & Search */}
        <div className="flex gap-3 items-center overflow-x-auto pb-2 custom-scrollbar">
            <div className="relative flex-1 min-w-[200px] max-w-sm shrink-0">
                <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                    type="text" 
                    placeholder={isRTL ? 'بحث بالاسم أو الرقم الوظيفي...' : 'Search name or ID...'} 
                    className={`w-full rounded-xl py-2 text-xs outline-none transition border ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className={`h-8 w-px mx-1 shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            {['All', 'Draft', 'Under Review', 'Approved', 'Paid'].map(status => {
                const statusLabel = status === 'All' ? (isRTL ? 'الكل' : 'All') : 
                                    status === 'Paid' ? (isRTL ? 'مدفوع' : 'Paid') :
                                    status === 'Under Review' ? (isRTL ? 'قيد المراجعة' : 'Review') :
                                    status === 'Approved' ? (isRTL ? 'المعتمدة' : 'Approved') :
                                    (isRTL ? 'مسودة' : 'Draft');
                return (
                    <button 
                        key={status} 
                        onClick={() => setFilterStatus(status)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap shrink-0 ${filterStatus === status ? (isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-800 text-white border-slate-800') : (isDark ? 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')}`}
                    >
                        {statusLabel}
                    </button>
                );
            })}
        </div>
      </div>

      {/* --- Section 2: Payroll Table --- */}
      <div className="p-6">
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${cardBg}`}>
            <div className="overflow-x-auto">
                <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
                    <thead className={`text-xs font-bold border-b uppercase tracking-wider ${isDark ? 'bg-slate-900/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        <tr>
                            <th className="p-4">{isRTL ? 'الموظف' : 'Employee'}</th>
                            <th className="p-4">{isRTL ? 'الأساسي' : 'Basic'}</th>
                            <th className="p-4">{isRTL ? 'البدلات' : 'Allowances'}</th>
                            <th className="p-4">{isRTL ? 'الخصومات' : 'Deductions'}</th>
                            <th className="p-4">{isRTL ? 'الصافي' : 'Net Pay'}</th>
                            <th className="p-4">{isRTL ? 'الحالة' : 'Status'}</th>
                            <th className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                        {loading ? (
                            <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" size={30}/></td></tr>
                        ) : filteredPayrolls.length === 0 ? (
                            <tr><td colSpan={7} className={`p-10 text-center font-medium ${textSub}`}>{isRTL ? 'لا توجد بيانات (انقر "توليد الرواتب" إذا كنت مسؤولاً)' : 'No records found.'}</td></tr>
                        ) : filteredPayrolls.map(payroll => (
                            <tr key={payroll.id} className={`transition group cursor-default ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {payroll.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${textMain}`}>{payroll.name}</div>
                                            <div className={`text-[10px] font-mono ${textSub}`}>{payroll.employeeId} • {payroll.department}</div>
                                        </div>
                                        {payroll.hasAnomaly && (
                                            <span title={payroll.anomalyReason}>
                                                <AlertTriangle size={14} className="text-amber-500"/>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className={`p-4 text-xs font-mono ${textSub}`}>{formatCurrency(payroll.earnings.basic)}</td>
                                <td className="p-4 text-xs font-mono text-emerald-500">+{formatCurrency(payroll.earnings.housing + payroll.earnings.transport + payroll.earnings.overtime + payroll.earnings.bonus)}</td>
                                <td className="p-4 text-xs font-mono text-red-500">-{formatCurrency(payroll.deductions.absence + payroll.deductions.gosi + payroll.deductions.loans)}</td>
                                <td className={`p-4 font-bold ${textMain}`}>{formatCurrency(payroll.netPay)}</td>
                                <td className="p-4">{getStatusBadge(payroll.status)}</td>
                                <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                                    <button 
                                        onClick={() => handleOpenDrawer(payroll)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto ${isDark ? 'text-blue-400 hover:bg-slate-800' : 'text-blue-600 hover:bg-blue-50'}`}
                                    >
                                        <FileText size={14}/> {isRTL ? 'التفاصيل' : 'Details'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- Section 3: Payslip Detail Drawer --- */}
      {isDrawerOpen && selectedPayroll && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>{selectedPayroll.employeeId}</span>
                            {getStatusBadge(selectedPayroll.status)}
                        </div>
                        <h2 className={`text-xl font-bold ${textMain}`}>{selectedPayroll.name}</h2>
                        <div className={`text-xs mt-1 ${textSub}`}>{selectedPayroll.role} • {selectedPayroll.department}</div>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Net Pay Card */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">{isRTL ? 'صافي المستحق' : 'Net Pay'}</div>
                        <div className="text-3xl font-black">{formatCurrency(selectedPayroll.netPay)}</div>
                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-300">
                            <Building2 size={12}/> IBAN: <span className="font-mono">{selectedPayroll.iban}</span>
                        </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Earnings */}
                        <div className="space-y-3">
                            <h4 className={`font-bold text-sm border-b pb-2 ${isDark ? 'text-emerald-400 border-emerald-900/30' : 'text-emerald-700 border-emerald-100'}`}>{isRTL ? 'الاستحقاقات' : 'Earnings'}</h4>
                            <div className={`text-xs space-y-2 ${textMain}`}>
                                <div className="flex justify-between"><span>Basic</span> <span>{formatCurrency(selectedPayroll.earnings.basic)}</span></div>
                                <div className="flex justify-between"><span>Housing</span> <span>{formatCurrency(selectedPayroll.earnings.housing)}</span></div>
                                <div className="flex justify-between"><span>Transport</span> <span>{formatCurrency(selectedPayroll.earnings.transport)}</span></div>
                                <div className={`flex justify-between font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}><span>Overtime</span> <span>{formatCurrency(selectedPayroll.earnings.overtime)}</span></div>
                                <div className={`flex justify-between ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}><span>Bonus</span> <span>{formatCurrency(selectedPayroll.earnings.bonus)}</span></div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-3">
                            <h4 className={`font-bold text-sm border-b pb-2 ${isDark ? 'text-red-400 border-red-900/30' : 'text-red-700 border-red-100'}`}>{isRTL ? 'الاستقطاعات' : 'Deductions'}</h4>
                            <div className={`text-xs space-y-2 ${textMain}`}>
                                <div className="flex justify-between"><span>GOSI</span> <span>{formatCurrency(selectedPayroll.deductions.gosi)}</span></div>
                                <div className={`flex justify-between ${isDark ? 'text-red-400' : 'text-red-600'}`}><span>Absence</span> <span>{formatCurrency(selectedPayroll.deductions.absence)}</span></div>
                                <div className="flex justify-between"><span>Loans</span> <span>{formatCurrency(selectedPayroll.deductions.loans)}</span></div>
                                <div className="flex justify-between"><span>Other</span> <span>{formatCurrency(selectedPayroll.deductions.other)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Anomaly Alert */}
                    {selectedPayroll.hasAnomaly && (
                        <div className={`p-4 rounded-xl border flex gap-3 items-start ${isDark ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
                            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5"/>
                            <div>
                                <div className={`font-bold text-xs mb-1 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>{isRTL ? 'تنبيه النظام' : 'System Alert'}</div>
                                <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>{selectedPayroll.anomalyReason}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className={`p-5 border-t flex gap-3 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <button className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                        <Printer size={16}/> {isRTL ? 'طباعة' : 'Print'}
                    </button>
                    {(isAdmin && selectedPayroll.status !== 'Approved' && selectedPayroll.status !== 'Paid') && (
                        <button 
                            onClick={() => handleApprove(selectedPayroll.id)}
                            disabled={actionLoading === selectedPayroll.id}
                            className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
                        >
                            {actionLoading === selectedPayroll.id ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} {isRTL ? 'اعتماد الراتب' : 'Approve Pay'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Icons ---
function TrendingUp({ size, className }: any) { return <ArrowRightLeft size={size} className={className} style={{transform: 'rotate(-45deg)'}}/> }
function TrendingDown({ size, className }: any) { return <ArrowRightLeft size={size} className={className} style={{transform: 'rotate(45deg)'}}/> }

// --- Helper Components ---
function StatCard({ label, value, color, icon: Icon, highlight, isDark }: any) {
    const colors: any = {
        blue: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100',
        green: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-green-50 text-green-600 border-green-100',
        red: isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-100',
        emerald: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-100',
        slate: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
        <div className={`p-4 rounded-2xl border flex flex-col justify-between h-24 transition-all ${highlight ? (isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-slate-900 text-white border-slate-900') : (isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:shadow-sm')}`}>
            <div className="flex justify-between items-start">
                <div className={`text-xs font-bold ${highlight ? (isDark ? 'text-blue-400' : 'text-slate-400') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{label}</div>
                <div className={`p-1.5 rounded-lg ${highlight ? (isDark ? 'bg-blue-800 text-blue-300' : 'bg-slate-800 text-emerald-400') : colors[color]}`}>
                    <Icon size={14} />
                </div>
            </div>
            <div className={`text-xl font-black ${highlight ? (isDark ? 'text-white' : 'text-white') : (isDark ? 'text-white' : 'text-slate-900')}`}>{value}</div>
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Filter, Download, ChevronDown, Calendar, 
  Search, CheckCircle2, AlertTriangle, X, FileText, ArrowRightLeft,
  DollarSign, Globe, MoreHorizontal, ShieldCheck, RefreshCw
} from 'lucide-react';

// --- Types ---
type ExpenseStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
type Category = 'Office' | 'Transport' | 'Hospitality' | 'Maintenance' | 'Other';

interface Expense {
  id: string;
  reference: string;
  item: string;
  amount: number;
  category: Category;
  date: string;
  status: ExpenseStatus;
  submittedBy: string;
  department: string;
  project?: string;
  hasReceipt: boolean;
  notes?: string;
  auditLog: { action: string; user: string; time: string }[];
}

export default function ExpensesPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [period, setPeriod] = useState('Feb 2026');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // New Expense Form
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    item: '', amount: 0, category: 'Office', hasReceipt: false
  });

  // --- Mock Data ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setExpenses([
        { 
          id: 'EXP-001', reference: 'REF-1023', item: lang === 'ar' ? 'شراء قرطاسية' : 'Stationery Purchase', 
          amount: 450, category: 'Office', date: '2024-02-05', status: 'Approved', 
          submittedBy: 'Ahmed Al-Ghamdi', department: 'Operations', hasReceipt: true,
          auditLog: [{ action: 'Approved', user: 'Finance Mgr', time: '2024-02-06 10:00' }]
        },
        { 
          id: 'EXP-002', reference: 'REF-1024', item: lang === 'ar' ? 'وقود سيارات' : 'Vehicle Fuel', 
          amount: 230, category: 'Transport', date: '2024-02-04', status: 'Pending', 
          submittedBy: 'Saeed Al-Qahtani', department: 'Maintenance', project: 'Site B', hasReceipt: true,
          auditLog: [{ action: 'Submitted', user: 'Saeed', time: '2024-02-04 14:30' }]
        },
        { 
          id: 'EXP-003', reference: 'REF-1025', item: lang === 'ar' ? 'ضيافة اجتماعات' : 'Meeting Hospitality', 
          amount: 150, category: 'Hospitality', date: '2024-02-03', status: 'Reimbursed', 
          submittedBy: 'Yasser Al-Harbi', department: 'HR', hasReceipt: false,
          auditLog: [{ action: 'Reimbursed', user: 'System', time: '2024-02-05 09:00' }]
        },
      ]);
      setLoading(false);
    }, 800);
  }, [lang]);

  // --- Calculations ---
  const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'Approved' || e.status === 'Reimbursed').reduce((acc, e) => acc + e.amount, 0);

  // --- Actions ---
  const handleOpenDrawer = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDrawerOpen(true);
  };

  const handleAddExpense = () => {
    if (!newExpense.item || !newExpense.amount) return;
    const expense: Expense = {
        id: `EXP-${Date.now()}`,
        reference: `REF-${Math.floor(Math.random() * 10000)}`,
        item: newExpense.item!,
        amount: Number(newExpense.amount),
        category: newExpense.category as Category,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        submittedBy: 'Current User',
        department: 'My Dept',
        hasReceipt: newExpense.hasReceipt || false,
        auditLog: [{ action: 'Created', user: 'Current User', time: new Date().toLocaleString() }]
    };
    setExpenses([expense, ...expenses]);
    setIsAddModalOpen(false);
    setNewExpense({ item: '', amount: 0, category: 'Office', hasReceipt: false });
    alert(lang === 'ar' ? 'تم إضافة المصروف بنجاح' : 'Expense added successfully');
  };

  const handleApprove = (id: string) => {
    if(confirm(lang === 'ar' ? 'هل أنت متأكد من اعتماد المصروف؟' : 'Approve this expense?')) {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
        if(selectedExpense?.id === id) setSelectedExpense(prev => prev ? {...prev, status: 'Approved'} : null);
    }
  };

  const handleReject = (id: string) => {
    const reason = prompt(lang === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:');
    if (reason) {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected', notes: reason } : e));
        if(selectedExpense?.id === id) setSelectedExpense(prev => prev ? {...prev, status: 'Rejected', notes: reason} : null);
    }
  };

  const handleExport = () => {
    alert(lang === 'ar' ? 'جاري تصدير تقرير المصروفات (Excel)...' : 'Exporting Expenses Report (Excel)...');
  };

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const filteredExpenses = expenses.filter(e => {
      const matchesSearch = e.item.toLowerCase().includes(searchTerm.toLowerCase()) || e.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'All' || e.status === filterStatus;
      return matchesSearch && matchesFilter;
  });

  // --- Helper Components ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    const styles = {
        'Approved': 'bg-green-100 text-green-700 border-green-200',
        'Reimbursed': 'bg-blue-100 text-blue-700 border-blue-200',
        'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'Draft': 'bg-slate-100 text-slate-600 border-slate-200',
        'Rejected': 'bg-red-100 text-red-700 border-red-200'
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-800 ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Expenses Header --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Receipt className="text-amber-600" />
              {lang === 'ar' ? 'المصروفات النثرية والعهد' : 'Petty Cash & Expenses'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500 font-medium">{lang === 'ar' ? 'الفترة المالية:' : 'Financial Period:'}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-700 flex items-center gap-1"><Calendar size={12}/> {period}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition">
               <Globe size={14} /> {lang === 'ar' ? 'English' : 'عربي'}
             </button>
             <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 flex items-center gap-2 shadow-lg transition active:scale-95">
                <Plus size={18} /> {lang === 'ar' ? 'تسجيل مصروف' : 'Add Expense'}
             </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={lang === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'} value={formatCurrency(totalAmount)} color="blue" icon={DollarSign} />
            <StatCard label={lang === 'ar' ? 'المعتمدة' : 'Approved'} value={formatCurrency(approvedAmount)} color="green" icon={CheckCircle2} />
            <StatCard label={lang === 'ar' ? 'قيد المراجعة' : 'Pending Review'} value={formatCurrency(pendingAmount)} color="amber" icon={RefreshCw} />
            <StatCard label={lang === 'ar' ? 'عدد العمليات' : 'Transactions'} value={expenses.length} color="slate" icon={FileText} />
        </div>

        {/* Filters & Search */}
        <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 rtl:right-3 ltr:left-3" />
                <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'بحث برقم المرجع أو البند...' : 'Search reference or item...'} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-blue-500 transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
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

      {/* --- Section 2: Expenses Table --- */}
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                        <th className="p-4">{lang === 'ar' ? 'المرجع' : 'Reference'}</th>
                        <th className="p-4">{lang === 'ar' ? 'البند' : 'Item'}</th>
                        <th className="p-4">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                        <th className="p-4">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                        <th className="p-4">{lang === 'ar' ? 'مقدم الطلب' : 'Submitted By'}</th>
                        <th className="p-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="p-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={7} className="p-10 text-center text-slate-400 animate-pulse">{lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</td></tr>
                    ) : filteredExpenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-slate-50 transition group cursor-default">
                            <td className="p-4 font-mono text-xs text-slate-500">{expense.reference}</td>
                            <td className="p-4 font-bold text-slate-800 text-sm">{expense.item}</td>
                            <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 border border-slate-200">{expense.category}</span></td>
                            <td className="p-4 font-bold text-red-600 text-sm">-{formatCurrency(expense.amount)}</td>
                            <td className="p-4">
                                <div className="text-xs font-bold text-slate-700">{expense.submittedBy}</div>
                                <div className="text-[10px] text-slate-400">{expense.date}</div>
                            </td>
                            <td className="p-4">{getStatusBadge(expense.status)}</td>
                            <td className="p-4 text-end">
                                <button 
                                    onClick={() => handleOpenDrawer(expense)}
                                    className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                                >
                                    <FileText size={14}/> {lang === 'ar' ? 'التفاصيل' : 'Details'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- Section 3: Expense Detail Drawer --- */}
      {isDrawerOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-slate-500 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">{selectedExpense.reference}</span>
                            {getStatusBadge(selectedExpense.status)}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedExpense.item}</h2>
                        <div className="text-xs text-slate-500 mt-1">{selectedExpense.submittedBy} • {selectedExpense.date}</div>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg"><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">{lang === 'ar' ? 'قيمة المصروف' : 'Expense Amount'}</div>
                        <div className="text-3xl font-black text-slate-900">{formatCurrency(selectedExpense.amount)}</div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm">
                            <span className="text-slate-500">{lang === 'ar' ? 'التصنيف' : 'Category'}</span>
                            <span className="font-bold text-slate-800">{selectedExpense.category}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm">
                            <span className="text-slate-500">{lang === 'ar' ? 'الإدارة / المشروع' : 'Dept / Project'}</span>
                            <span className="font-bold text-slate-800">{selectedExpense.department} {selectedExpense.project ? `/ ${selectedExpense.project}` : ''}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm">
                            <span className="text-slate-500">{lang === 'ar' ? 'مرفق الإيصال' : 'Receipt Attached'}</span>
                            <span className={`font-bold ${selectedExpense.hasReceipt ? 'text-green-600' : 'text-red-600'}`}>
                                {selectedExpense.hasReceipt ? (lang === 'ar' ? 'نعم' : 'Yes') : (lang === 'ar' ? 'لا' : 'No')}
                            </span>
                        </div>
                    </div>

                    {/* Audit Log */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">{lang === 'ar' ? 'سجل العمليات' : 'Audit Log'}</h4>
                        <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                            {selectedExpense.auditLog.map((log, idx) => (
                                <div key={idx} className="text-xs text-slate-600 pl-2">
                                    <span className="font-bold">{log.action}</span> by {log.user} <span className="text-slate-400">- {log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2">
                    {selectedExpense.status === 'Pending' && (
                        <>
                            <button onClick={() => handleApprove(selectedExpense.id)} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg flex items-center justify-center gap-2">
                                <ShieldCheck size={16}/> {lang === 'ar' ? 'اعتماد' : 'Approve'}
                            </button>
                            <button onClick={() => handleReject(selectedExpense.id)} className="flex-1 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 flex items-center justify-center gap-2">
                                <X size={16}/> {lang === 'ar' ? 'رفض' : 'Reject'}
                            </button>
                        </>
                    )}
                    <button onClick={handleExport} className="p-3 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100"><Download size={18}/></button>
                </div>
            </div>
        </div>
      )}

      {/* --- Section 4: Add Expense Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{lang === 'ar' ? 'تسجيل مصروف جديد' : 'New Expense Entry'}</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'البند / الوصف' : 'Item Description'}</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold"
                            value={newExpense.item}
                            onChange={(e) => setNewExpense({...newExpense, item: e.target.value})}
                            placeholder="e.g. Office Supplies"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'المبلغ' : 'Amount'}</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">{lang === 'ar' ? 'التصنيف' : 'Category'}</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 text-sm font-bold"
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({...newExpense, category: e.target.value as Category})}
                            >
                                <option value="Office">Office</option>
                                <option value="Transport">Transport</option>
                                <option value="Hospitality">Hospitality</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-blue-600 rounded"
                            checked={newExpense.hasReceipt}
                            onChange={(e) => setNewExpense({...newExpense, hasReceipt: e.target.checked})}
                        />
                        <span className="text-sm font-bold text-slate-700">{lang === 'ar' ? 'يوجد إيصال / فاتورة' : 'Receipt Available'}</span>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                    <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={handleAddExpense} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg">{lang === 'ar' ? 'حفظ وإرسال' : 'Submit'}</button>
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
        amber: 'bg-amber-50 text-amber-600',
        slate: 'bg-slate-100 text-slate-600',
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
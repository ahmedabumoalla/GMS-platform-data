'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Receipt, Plus, Filter, Download, ChevronDown, Calendar, 
  Search, CheckCircle2, AlertTriangle, X, FileText, ArrowRightLeft,
  DollarSign, Globe, MoreHorizontal, ShieldCheck, RefreshCw, Loader2
} from 'lucide-react';
import { useDashboard } from '../../layout';

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
  const { lang, user, isDark } = useDashboard();
  const isRTL = lang === 'ar';
  
  const [period, setPeriod] = useState(new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', year: 'numeric' }));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
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

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'project_manager';

  // --- 1. Fetch Real Data from Supabase (🛠️ FIXED: Decoupled Queries) ---
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // 1. جلب المصروفات فقط
      let expQuery = supabase.from('expenses').select('*').order('created_at', { ascending: false });

      if (!isAdmin) {
        expQuery = expQuery.eq('submitted_by', user?.id);
      }

      const { data: expensesData, error: expError } = await expQuery;
      if (expError) throw expError;

      if (expensesData && expensesData.length > 0) {
          const expIds = expensesData.map(e => e.id);
          
          // 2. جلب سجل العمليات (Audit Logs) بشكل منفصل
          const { data: logsData } = await supabase.from('expense_audit_logs').select('*').in('expense_id', expIds);

          // 3. تجميع جميع معرّفات المستخدمين (أصحاب الطلبات + من قاموا بالاعتماد/الرفض)
          const userIdsToFetch = new Set<string>();
          expensesData.forEach(e => { if(e.submitted_by) userIdsToFetch.add(e.submitted_by); });
          logsData?.forEach(l => { if(l.actor_id) userIdsToFetch.add(l.actor_id); });

          // 4. جلب بيانات المستخدمين
          const { data: profilesData } = await supabase.from('profiles').select('id, full_name, department').in('id', Array.from(userIdsToFetch));

          // 5. دمج البيانات برمجياً (لتجنب خطأ {} الخاص بـ Supabase JOINs)
          const formattedData: Expense[] = expensesData.map(exp => {
              const submitter = profilesData?.find(p => p.id === exp.submitted_by);
              
              const expLogs = logsData?.filter(l => l.expense_id === exp.id) || [];
              const mappedLogs = expLogs.map(log => {
                  const actor = profilesData?.find(p => p.id === log.actor_id);
                  return {
                      action: log.action,
                      user: actor?.full_name || 'System',
                      time: new Date(log.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')
                  };
              }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

              return {
                  id: exp.id,
                  reference: exp.reference,
                  item: exp.item,
                  amount: Number(exp.amount),
                  category: exp.category as Category,
                  date: new Date(exp.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US'),
                  status: exp.status as ExpenseStatus,
                  submittedBy: submitter?.full_name || 'Unknown',
                  department: submitter?.department || exp.department || 'General',
                  project: exp.project_id ? 'Project Linked' : undefined,
                  hasReceipt: exp.has_receipt,
                  notes: exp.notes,
                  auditLog: mappedLogs
              };
          });

          setExpenses(formattedData);
      } else {
          setExpenses([]);
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchExpenses();
  }, [user, isRTL]);

  // --- Calculations ---
  const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const pendingAmount = expenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'Approved' || e.status === 'Reimbursed').reduce((acc, e) => acc + e.amount, 0);

  // --- Actions ---
  const handleOpenDrawer = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDrawerOpen(true);
  };

  const handleAddExpense = async () => {
    if (!newExpense.item || !newExpense.amount || !user) return;
    setActionLoading('add');

    try {
      const refGen = `REF-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // 1. إدخال المصروف
      const { data: expData, error: expError } = await supabase.from('expenses').insert({
        reference: refGen,
        item: newExpense.item,
        amount: newExpense.amount,
        category: newExpense.category,
        has_receipt: newExpense.hasReceipt,
        submitted_by: user.id,
        status: 'Pending'
      }).select('id').single();

      if (expError) throw expError;

      // 2. إدخال حركة التدقيق
      if (expData) {
          await supabase.from('expense_audit_logs').insert({
            expense_id: expData.id,
            action: 'Submitted',
            actor_id: user.id
          });
      }

      alert(isRTL ? 'تم إضافة المصروف بنجاح' : 'Expense added successfully');
      setIsAddModalOpen(false);
      setNewExpense({ item: '', amount: 0, category: 'Office', hasReceipt: false });
      fetchExpenses(); // Refresh data

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ExpenseStatus) => {
    if (!user) return;
    
    let reason = '';
    if (newStatus === 'Rejected') {
        reason = prompt(isRTL ? 'الرجاء إدخال سبب الرفض:' : 'Please enter rejection reason:') || '';
        if (!reason && newStatus === 'Rejected') return; 
    } else {
        if (!confirm(isRTL ? 'هل أنت متأكد من هذا الإجراء؟' : 'Are you sure about this action?')) return;
    }

    setActionLoading(id);

    try {
      // 1. تحديث حالة المصروف
      const updatePayload: any = { status: newStatus };
      if (reason) updatePayload.notes = reason;

      const { error: updError } = await supabase.from('expenses').update(updatePayload).eq('id', id);
      if (updError) throw updError;

      // 2. تسجيل حركة التدقيق
      await supabase.from('expense_audit_logs').insert({
        expense_id: id,
        action: newStatus,
        actor_id: user.id
      });

      alert(isRTL ? 'تم التحديث بنجاح' : 'Updated successfully');
      fetchExpenses(); // Refresh
      setIsDrawerOpen(false);
      
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    alert(isRTL ? 'جاري تصدير تقرير المصروفات (Excel)...' : 'Exporting Expenses Report (Excel)...');
  };

  const filteredExpenses = expenses.filter(e => {
      const matchesSearch = e.item.toLowerCase().includes(searchTerm.toLowerCase()) || e.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'All' || e.status === filterStatus;
      return matchesSearch && matchesFilter;
  });

  // --- Helper Components ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: ExpenseStatus) => {
    const styles = {
        'Approved': isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-100 text-green-700 border-green-200',
        'Reimbursed': isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200',
        'Pending': isDark ? 'bg-amber-900/30 text-amber-400 border-amber-800' : 'bg-amber-100 text-amber-700 border-amber-200',
        'Draft': isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200',
        'Rejected': isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200'
    };
    
    const statusText = isRTL ? {
        'Approved': 'معتمد', 'Reimbursed': 'مُسدد', 'Pending': 'قيد المراجعة', 'Draft': 'مسودة', 'Rejected': 'مرفوض'
    }[status] : status;

    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status]}`}>{statusText}</span>;
  };

  const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  const cardBg = isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200";

  return (
    <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* --- Section 1: Expenses Header --- */}
      <div className={`border-b px-6 py-5 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h1 className={`text-2xl font-black flex items-center gap-2 ${textMain}`}>
              <Receipt className="text-amber-600" />
              {isRTL ? 'المصروفات النثرية والعهد' : 'Petty Cash & Expenses'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${textSub}`}>{isRTL ? 'الفترة المالية:' : 'Financial Period:'}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                    <Calendar size={12}/> {period}
                </span>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 flex-1 md:flex-none flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-95">
                <Plus size={18} /> {isRTL ? 'تسجيل مصروف' : 'Add Expense'}
             </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard isDark={isDark} label={isRTL ? 'إجمالي المصروفات' : 'Total Expenses'} value={formatCurrency(totalAmount)} color="blue" icon={DollarSign} />
            <StatCard isDark={isDark} label={isRTL ? 'المعتمدة' : 'Approved'} value={formatCurrency(approvedAmount)} color="green" icon={CheckCircle2} />
            <StatCard isDark={isDark} label={isRTL ? 'قيد المراجعة' : 'Pending Review'} value={formatCurrency(pendingAmount)} color="amber" icon={RefreshCw} />
            <StatCard isDark={isDark} label={isRTL ? 'عدد العمليات' : 'Transactions'} value={expenses.length} color="slate" icon={FileText} />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className={`absolute top-2.5 text-slate-400 w-4 h-4 ${isRTL ? 'right-3' : 'left-3'}`} />
                <input 
                    type="text" 
                    placeholder={isRTL ? 'بحث برقم المرجع أو البند...' : 'Search reference or item...'} 
                    className={`w-full rounded-xl py-2 text-xs outline-none transition border ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className={`h-8 w-px mx-1 hidden sm:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {['All', 'Pending', 'Approved', 'Rejected'].map(status => {
                  const statusLabel = status === 'All' ? (isRTL ? 'الكل' : 'All') : 
                                      status === 'Pending' ? (isRTL ? 'قيد المراجعة' : 'Pending') :
                                      status === 'Approved' ? (isRTL ? 'المعتمدة' : 'Approved') :
                                      (isRTL ? 'المرفوضة' : 'Rejected');
                  return (
                    <button 
                        key={status} 
                        onClick={() => setFilterStatus(status)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap ${filterStatus === status ? (isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-800 text-white border-slate-800') : (isDark ? 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50')}`}
                    >
                        {statusLabel}
                    </button>
                  );
              })}
            </div>
        </div>
      </div>

      {/* --- Section 2: Expenses Table --- */}
      <div className="p-6">
        <div className={`rounded-2xl border overflow-hidden shadow-sm ${cardBg}`}>
            <div className="overflow-x-auto">
                <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
                    <thead className={`text-xs font-bold border-b uppercase tracking-wider ${isDark ? 'bg-slate-900/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        <tr>
                            <th className="p-4">{isRTL ? 'المرجع' : 'Reference'}</th>
                            <th className="p-4">{isRTL ? 'البند' : 'Item'}</th>
                            <th className="p-4">{isRTL ? 'التصنيف' : 'Category'}</th>
                            <th className="p-4">{isRTL ? 'المبلغ' : 'Amount'}</th>
                            <th className="p-4">{isRTL ? 'مقدم الطلب' : 'Submitted By'}</th>
                            <th className="p-4">{isRTL ? 'الحالة' : 'Status'}</th>
                            <th className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                        {loading ? (
                            <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" size={30}/></td></tr>
                        ) : filteredExpenses.length === 0 ? (
                            <tr><td colSpan={7} className={`p-10 text-center font-medium ${textSub}`}>{isRTL ? 'لا توجد بيانات مطابقة.' : 'No matching data found.'}</td></tr>
                        ) : filteredExpenses.map(expense => (
                            <tr key={expense.id} className={`transition group cursor-default ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                                <td className={`p-4 font-mono text-xs ${textSub}`}>{expense.reference}</td>
                                <td className={`p-4 font-bold text-sm ${textMain}`}>{expense.item}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-xs border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{expense.category}</span></td>
                                <td className="p-4 font-bold text-red-500 text-sm">-{formatCurrency(expense.amount)}</td>
                                <td className="p-4">
                                    <div className={`text-xs font-bold ${textMain}`}>{expense.submittedBy}</div>
                                    <div className={`text-[10px] ${textSub}`}>{expense.date}</div>
                                </td>
                                <td className="p-4">{getStatusBadge(expense.status)}</td>
                                <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                                    <button 
                                        onClick={() => handleOpenDrawer(expense)}
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

      {/* --- Section 3: Expense Detail Drawer --- */}
      {isDrawerOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-start ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isDark ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>{selectedExpense.reference}</span>
                            {getStatusBadge(selectedExpense.status)}
                        </div>
                        <h2 className={`text-xl font-bold ${textMain}`}>{selectedExpense.item}</h2>
                        <div className={`text-xs mt-1 ${textSub}`}>{selectedExpense.submittedBy} • {selectedExpense.date}</div>
                    </div>
                    <button onClick={() => setIsDrawerOpen(false)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <div className={`text-xs font-bold uppercase mb-1 ${textSub}`}>{isRTL ? 'قيمة المصروف' : 'Expense Amount'}</div>
                        <div className={`text-3xl font-black ${textMain}`}>{formatCurrency(selectedExpense.amount)}</div>
                    </div>

                    <div className="space-y-4">
                        <div className={`flex justify-between p-3 border rounded-xl text-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                            <span className={textSub}>{isRTL ? 'التصنيف' : 'Category'}</span>
                            <span className={`font-bold ${textMain}`}>{selectedExpense.category}</span>
                        </div>
                        <div className={`flex justify-between p-3 border rounded-xl text-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                            <span className={textSub}>{isRTL ? 'الإدارة / المشروع' : 'Dept / Project'}</span>
                            <span className={`font-bold ${textMain}`}>{selectedExpense.department} {selectedExpense.project ? `/ ${selectedExpense.project}` : ''}</span>
                        </div>
                        <div className={`flex justify-between p-3 border rounded-xl text-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                            <span className={textSub}>{isRTL ? 'مرفق الإيصال' : 'Receipt Attached'}</span>
                            <span className={`font-bold ${selectedExpense.hasReceipt ? 'text-emerald-500' : 'text-red-500'}`}>
                                {selectedExpense.hasReceipt ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                            </span>
                        </div>
                        {selectedExpense.notes && (
                            <div className={`p-4 border rounded-xl text-sm ${isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                                <span className="font-bold text-red-500 block mb-1">{isRTL ? 'ملاحظات / سبب الرفض:' : 'Notes / Rejection Reason:'}</span>
                                <span className={isDark ? 'text-red-200' : 'text-red-700'}>{selectedExpense.notes}</span>
                            </div>
                        )}
                    </div>

                    {/* Audit Log */}
                    <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <h4 className={`text-xs font-bold uppercase mb-3 ${textSub}`}>{isRTL ? 'سجل العمليات' : 'Audit Log'}</h4>
                        <div className={`space-y-4 pl-2 rtl:pl-0 rtl:pr-2 border-l-2 rtl:border-l-0 rtl:border-r-2 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                            {selectedExpense.auditLog.map((log, idx) => (
                                <div key={idx} className={`text-xs relative pl-4 rtl:pl-0 rtl:pr-4 ${textSub}`}>
                                    <div className={`absolute w-2 h-2 rounded-full top-1 -left-[5px] rtl:left-auto rtl:-right-[5px] ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                                    <span className={`font-bold ${textMain}`}>{log.action}</span> by {log.user} 
                                    <div className="mt-0.5 opacity-70 font-mono">{log.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className={`p-5 border-t flex gap-2 ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                    {(isAdmin && selectedExpense.status === 'Pending') && (
                        <>
                            <button 
                                onClick={() => handleUpdateStatus(selectedExpense.id, 'Approved')} 
                                disabled={actionLoading === selectedExpense.id}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading === selectedExpense.id ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} {isRTL ? 'اعتماد' : 'Approve'}
                            </button>
                            <button 
                                onClick={() => handleUpdateStatus(selectedExpense.id, 'Rejected')} 
                                disabled={actionLoading === selectedExpense.id}
                                className={`flex-1 py-3 border rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${isDark ? 'bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}
                            >
                                {actionLoading === selectedExpense.id ? <Loader2 size={16} className="animate-spin"/> : <X size={16}/>} {isRTL ? 'رفض' : 'Reject'}
                            </button>
                        </>
                    )}
                    {(!isAdmin && selectedExpense.status === 'Pending') && (
                         <div className={`flex-1 py-3 text-center text-sm font-bold ${textSub}`}>{isRTL ? 'بانتظار موافقة الإدارة' : 'Pending Admin Approval'}</div>
                    )}
                    <button onClick={handleExport} className={`p-3 border rounded-xl transition ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}><Download size={18}/></button>
                </div>
            </div>
        </div>
      )}

      {/* --- Section 4: Add Expense Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
            <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}>
                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <h3 className={`font-bold text-lg ${textMain}`}>{isRTL ? 'تسجيل مصروف جديد' : 'New Expense Entry'}</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'البند / الوصف' : 'Item Description'}</label>
                        <input 
                            type="text" 
                            className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 transition text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 focus:ring-blue-100 text-slate-900'}`}
                            value={newExpense.item}
                            onChange={(e) => setNewExpense({...newExpense, item: e.target.value})}
                            placeholder={isRTL ? "مثال: أدوات مكتبية" : "e.g. Office Supplies"}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'المبلغ (SAR)' : 'Amount (SAR)'}</label>
                            <input 
                                type="number" 
                                className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 transition text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 focus:ring-blue-100 text-slate-900'}`}
                                value={newExpense.amount || ''}
                                onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1.5 block ${textSub}`}>{isRTL ? 'التصنيف' : 'Category'}</label>
                            <select 
                                className={`w-full rounded-xl px-4 py-3 outline-none focus:ring-2 transition text-sm font-bold border ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50' : 'bg-slate-50 border-slate-200 focus:ring-blue-100 text-slate-900'}`}
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({...newExpense, category: e.target.value as Category})}
                            >
                                <option value="Office">Office</option>
                                <option value="Transport">Transport</option>
                                <option value="Hospitality">Hospitality</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                            checked={newExpense.hasReceipt}
                            onChange={(e) => setNewExpense({...newExpense, hasReceipt: e.target.checked})}
                        />
                        <span className={`text-sm font-bold cursor-pointer ${textMain}`} onClick={() => setNewExpense({...newExpense, hasReceipt: !newExpense.hasReceipt})}>
                            {isRTL ? 'يوجد إيصال / فاتورة مرفقة' : 'Receipt Available / Attached'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 border-t flex gap-3 ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <button onClick={() => setIsAddModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}>{isRTL ? 'إلغاء' : 'Cancel'}</button>
                    <button onClick={handleAddExpense} disabled={actionLoading === 'add'} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                        {actionLoading === 'add' ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>} {isRTL ? 'حفظ وإرسال للاعتماد' : 'Submit for Approval'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// --- Helper Components ---
function StatCard({ label, value, color, icon: Icon, isDark }: any) {
    const colors: any = {
        blue: isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100',
        green: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-100',
        slate: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return (
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isDark ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
            <div>
                <div className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
                <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
            </div>
            <div className={`p-3 rounded-xl border ${colors[color]}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}
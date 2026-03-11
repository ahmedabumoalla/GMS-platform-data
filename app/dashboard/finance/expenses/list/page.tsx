'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    Search, Plus, Receipt, Loader2, Calendar, CreditCard, 
    X, Info, FileText, Hash, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Expense {
    id: string;
    expense_number: string;
    category: string;
    amount: number;
    tax_amount: number;
    total_amount: number;
    payment_method: string;
    reference_number: string;
    expense_date: string;
    notes: string;
    created_at: string;
}

export default function ExpensesListPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

    useEffect(() => {
        const fetchExpenses = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
            if (!error && data) setExpenses(data as Expense[]);
            setLoading(false);
        };
        fetchExpenses();
    }, []);

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.expense_number.toLowerCase().includes(searchQuery.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0);

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans pb-20 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header Area */}
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shadow-inner"><Receipt size={24}/></div>
                            {isRTL ? 'سجل المصروفات العامة' : 'Expenses Ledger'}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'مراقبة كافة المصروفات التي تمت في النظام.' : 'Monitor all recorded expenses.'}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="text-start sm:text-end hidden sm:block bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-5 py-2.5 rounded-2xl">
                            <div className="text-[10px] text-rose-500 font-bold mb-0.5 uppercase tracking-widest">{isRTL ? 'إجمالي المصروفات' : 'Total Expenses'}</div>
                            <div className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">{totalExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs">SAR</span></div>
                        </div>
                        <button onClick={() => router.push('/dashboard/finance/expenses/new')} className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-600/20 transition flex items-center justify-center gap-2 active:scale-95">
                            <Plus size={18}/> {isRTL ? 'إضافة مصروف' : 'Add Expense'}
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? 'بحث برقم المصروف أو البيان...' : 'Search...'} className={`w-full border rounded-2xl px-5 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-rose-500' : 'bg-white border-slate-200 focus:border-rose-500 shadow-sm'}`} />
                    </div>
                    <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className={`border rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                        <option value="All">{isRTL ? 'كل التصنيفات' : 'All Categories'}</option>
                        <option value="Operational">تشغيلي</option>
                        <option value="Administrative">إداري</option>
                        <option value="Salaries & Wages">رواتب</option>
                        <option value="Logistics">نقل</option>
                        <option value="Marketing">تسويق</option>
                    </select>
                </div>
            </div>

            {/* --- 🚀 Modern Data Table --- */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? <div className="flex justify-center py-32"><Loader2 className="animate-spin text-rose-600" size={50} /></div> : (
                    <div className={`rounded-3xl border overflow-hidden shadow-sm ${cardBg}`}>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-start whitespace-nowrap">
                                <thead className={`text-[11px] uppercase tracking-wider font-black bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700`}>
                                    <tr>
                                        <th className="px-6 py-4 text-start">رقم المرجع</th>
                                        <th className="px-6 py-4 text-start">التصنيف</th>
                                        <th className="px-6 py-4 text-start">التاريخ</th>
                                        <th className="px-6 py-4 text-start w-full">البيان</th>
                                        <th className="px-6 py-4 text-end">الإجمالي (SAR)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-sm font-bold text-slate-400">
                                                لا توجد مصروفات مطابقة للبحث.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((exp) => (
                                            <tr 
                                                key={exp.id} 
                                                onClick={() => setSelectedExpense(exp)}
                                                className="group hover:bg-rose-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500 group-hover:text-rose-600 transition-colors">
                                                    {exp.expense_number}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                    <div className="flex items-center gap-1.5 justify-start">
                                                        <Calendar size={14} className="text-slate-400"/> {exp.expense_date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`text-xs font-bold truncate max-w-[250px] lg:max-w-[400px] ${textMain}`}>
                                                        {exp.notes || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-end">
                                                    <div className="text-sm font-mono font-black text-rose-600 dark:text-rose-500">
                                                        {Number(exp.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* --- 🚀 Modern Details Modal --- */}
            <AnimatePresence>
                {selectedExpense && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className={`w-full max-w-2xl my-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-white'}`}
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className={`text-xl font-black flex items-center gap-3 ${textMain}`}>
                                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><Info size={20}/></div>
                                    {isRTL ? 'تفاصيل عملية الصرف' : 'Expense Details'}
                                </h2>
                                <button onClick={() => setSelectedExpense(null)} className={`p-2.5 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                                    <X size={20}/>
                                </button>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                {/* Financial Summary */}
                                <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-center text-center md:text-start gap-6 ${isDark ? 'bg-gradient-to-br from-rose-900/20 to-slate-900 border-rose-900/30' : 'bg-gradient-to-br from-rose-50 to-white border-rose-100 shadow-sm'}`}>
                                    <div>
                                        <span className={`text-[11px] font-black uppercase tracking-widest block mb-2 ${isDark ? 'text-rose-400/80' : 'text-rose-500/80'}`}>إجمالي المصروف</span>
                                        <div className="text-4xl font-mono font-black text-rose-600 dark:text-rose-400">
                                            {Number(selectedExpense.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-sm text-rose-500/60 font-bold">SAR</span>
                                        </div>
                                    </div>
                                    <div className={`flex gap-6 text-sm font-bold px-5 py-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                                        <div><span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">المبلغ الأساسي</span><span className={`font-mono ${textMain}`}>{Number(selectedExpense.amount).toLocaleString()}</span></div>
                                        <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                        <div><span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">الضريبة (VAT)</span><span className={`font-mono ${textMain}`}>{Number(selectedExpense.tax_amount).toLocaleString()}</span></div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-5">
                                    <div className={`p-5 rounded-2xl border transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Hash size={14} className="text-rose-500"/> رقم المصروف</div>
                                        <div className={`font-mono font-black text-sm ${textMain}`}>{selectedExpense.expense_number}</div>
                                    </div>
                                    <div className={`p-5 rounded-2xl border transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText size={14} className="text-blue-500"/> التصنيف</div>
                                        <div className={`font-black text-sm text-blue-600 dark:text-blue-400`}>{selectedExpense.category}</div>
                                    </div>
                                    <div className={`p-5 rounded-2xl border transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500"/> تاريخ الصرف</div>
                                        <div className={`font-bold text-sm ${textMain}`}>{selectedExpense.expense_date}</div>
                                    </div>
                                    <div className={`p-5 rounded-2xl border transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><CreditCard size={14} className="text-amber-500"/> طريقة الدفع</div>
                                        <div className={`font-bold text-sm ${textMain}`}>{selectedExpense.payment_method || '-'}</div>
                                    </div>
                                    <div className={`p-5 rounded-2xl border col-span-2 transition-colors ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Banknote size={14} className="text-purple-500"/> الفاتورة / المرجع</div>
                                        <div className={`font-mono font-black text-sm ${textMain}`}>{selectedExpense.reference_number || 'لا يوجد مرجع'}</div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div className="pt-2">
                                    <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3 ml-1 rtl:mr-1 rtl:ml-0">البيان / الملاحظات</div>
                                    <div className={`text-sm font-medium leading-loose p-6 rounded-3xl border ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                                        {selectedExpense.notes || 'لا توجد ملاحظات مسجلة لهذه العملية.'}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
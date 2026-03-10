'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    Search, Plus, ShoppingCart, ArrowRight, ArrowLeft, 
    Loader2, X, Building2, Calendar, DollarSign, 
    CheckCircle2, Clock, AlertTriangle, Printer, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface PurchaseInvoice {
    id: string;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    grand_total: number;
    status: 'Draft' | 'Received' | 'Paid' | 'Overdue';
    supplier: { name_ar: string; name_en: string; tax_number: string };
    project?: { title: string };
}

export default function PurchaseInvoicesListPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    
    // --- Fetch Data ---
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('purchase_invoices')
                .select(`
                    id, invoice_number, issue_date, due_date, grand_total, status,
                    supplier:suppliers(name_ar, name_en, tax_number),
                    project:projects(title)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const today = new Date().toISOString().split('T')[0];
            const updatedData = (data as any[]).map(inv => {
                if (inv.status !== 'Paid' && inv.due_date < today) {
                    return { ...inv, status: 'Overdue' };
                }
                return inv;
            });

            setInvoices(updatedData);
        } catch (error: any) {
            console.error('Error fetching invoices:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (inv.supplier?.name_ar || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const kpi = {
        unpaid: invoices.filter(i => i.status === 'Received' || i.status === 'Overdue').reduce((sum, i) => sum + Number(i.grand_total), 0),
        paid: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + Number(i.grand_total), 0)
    };

    const getStatusUI = (status: string) => {
        switch(status) {
            case 'Paid': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: isRTL ? 'تم الدفع' : 'Paid' };
            case 'Overdue': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertTriangle, label: isRTL ? 'متأخرة' : 'Overdue' };
            case 'Received': return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: ArrowRight, label: isRTL ? 'مستلمة ومستحقة' : 'Received' };
            default: return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock, label: isRTL ? 'مسودة' : 'Draft' };
        }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><ShoppingCart size={24}/></div>
                            {isRTL ? 'فواتير المشتريات (الموردين)' : 'Purchase Invoices'}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'متابعة المطالبات المالية للموردين وتسديدها.' : 'Manage supplier bills and payments.'}</p>
                    </div>
                    <button onClick={() => router.push('/dashboard/finance/purchases/new')} className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition flex items-center justify-center gap-2 active:scale-95">
                        <Plus size={18}/> {isRTL ? 'تسجيل فاتورة مورد' : 'New Bill'}
                    </button>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{isRTL ? 'إجمالي المديونيات علينا (غير مدفوعة)' : 'Total Payables'}</div>
                        <div className="text-2xl font-mono font-black text-rose-600">{kpi.unpaid.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs text-rose-600/50">SAR</span></div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{isRTL ? 'إجمالي ما تم سداده للموردين' : 'Total Paid'}</div>
                        <div className="text-2xl font-mono font-black text-emerald-600">{kpi.paid.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs text-emerald-600/50">SAR</span></div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? 'بحث برقم الفاتورة أو المورد...' : 'Search...'} className={`w-full border rounded-xl px-5 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500 shadow-sm'}`} />
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={50} /></div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem]">
                        <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'لا توجد فواتير.' : 'No invoices.'}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvoices.map(inv => {
                            const statusUI = getStatusUI(inv.status);
                            const StatusIcon = statusUI.icon;
                            return (
                                <motion.div 
                                    initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={inv.id} 
                                    className={`rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-xl group ${cardBg}`}
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1.5 ${statusUI.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`font-mono text-xs font-black px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`}>
                                                {inv.invoice_number}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${statusUI.bg} ${statusUI.color} ${statusUI.border}`}>
                                                <StatusIcon size={12}/> {statusUI.label}
                                            </span>
                                        </div>
                                        
                                        <h3 className={`text-lg font-black leading-tight mb-1 truncate ${textMain}`}>
                                            {isRTL ? inv.supplier?.name_ar : (inv.supplier?.name_en || inv.supplier?.name_ar)}
                                        </h3>
                                        {inv.project && <p className="text-[10px] font-bold text-indigo-500 mb-4 truncate"><Building2 size={12} className="inline mr-1"/> {inv.project.title}</p>}
                                        {!inv.project && <p className="text-[10px] font-bold text-slate-400 mb-4 truncate">مشتريات عامة للشركة</p>}
                                        
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={12}/> استحقاق: {inv.due_date}</div>
                                            </div>
                                            <div className={`text-xl font-mono font-black ${textMain}`}>
                                                {Number(inv.grand_total).toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs text-slate-400">SAR</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
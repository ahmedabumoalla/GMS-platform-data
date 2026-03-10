'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    Search, Plus, FileText, ArrowRight, ArrowLeft, 
    Loader2, X, Building2, Calendar, DollarSign, 
    CheckCircle2, Clock, AlertTriangle, Printer, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
    line_tax: number;
}

interface Invoice {
    id: string;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    subtotal: number;
    tax_total: number;
    grand_total: number;
    status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
    notes: string;
    terms: string;
    client: { name_ar: string; name_en: string; tax_number: string; cr_number: string; address_short: string };
    project?: { title: string };
    lines: InvoiceLine[];
}

export default function SalesInvoicesListPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // --- Fetch Data ---
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    client:clients(name_ar, name_en, tax_number, cr_number, address_short),
                    project:projects(title),
                    lines:invoice_lines(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // تحديث حالة الفواتير المتأخرة تلقائياً برمجياً قبل العرض
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

    useEffect(() => {
        fetchInvoices();
    }, []);

    // --- Change Invoice Status ---
    const updateInvoiceStatus = async (id: string, newStatus: string) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            
            // تحديث الواجهة مباشرة
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus as any } : inv));
            if (selectedInvoice && selectedInvoice.id === id) {
                setSelectedInvoice({ ...selectedInvoice, status: newStatus as any });
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Print ---
    const handlePrint = () => {
        window.print();
    };

    // --- Dictionary ---
    const t = {
        ar: {
            title: 'فواتير المبيعات', subtitle: 'إدارة الفواتير الضريبية، متابعة التحصيل، والمسودات.',
            newInv: 'فاتورة جديدة', search: 'بحث برقم الفاتورة أو العميل...',
            filters: { all: 'الكل', draft: 'مسودة', sent: 'مرسلة', paid: 'مدفوعة', overdue: 'متأخرة' },
            kpi: { totalUnpaid: 'إجمالي المستحقات (غير مدفوعة)', totalPaid: 'إجمالي المحصل', drafts: 'مسودات تحت المراجعة' },
            empty: 'لا توجد فواتير مطابقة للبحث.',
            invDetails: 'تفاصيل الفاتورة', billTo: 'فاتورة إلى:',
            table: { desc: 'البيان', qty: 'الكمية', price: 'السعر', tax: 'الضريبة', total: 'الإجمالي' },
            summary: { subtotal: 'الإجمالي قبل الضريبة:', tax: 'قيمة الضريبة (15%):', grand: 'الإجمالي المستحق:' },
            actions: { markPaid: 'تحديد كمدفوعة', markSent: 'اعتماد وإرسال', print: 'طباعة PDF' }
        },
        en: {
            title: 'Sales Invoices', subtitle: 'Manage tax invoices, track collections, and drafts.',
            newInv: 'New Invoice', search: 'Search by invoice # or client...',
            filters: { all: 'All', draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' },
            kpi: { totalUnpaid: 'Total Outstanding', totalPaid: 'Total Collected', drafts: 'Drafts Pending' },
            empty: 'No invoices found matching criteria.',
            invDetails: 'Invoice Details', billTo: 'Bill To:',
            table: { desc: 'Description', qty: 'Qty', price: 'Price', tax: 'Tax', total: 'Total' },
            summary: { subtotal: 'Subtotal:', tax: 'VAT (15%):', grand: 'Grand Total:' },
            actions: { markPaid: 'Mark as Paid', markSent: 'Approve & Send', print: 'Print PDF' }
        }
    }[lang as 'ar' | 'en'] || {
        title: 'Sales Invoices', subtitle: 'Manage tax invoices, track collections, and drafts.',
        newInv: 'New Invoice', search: 'Search...',
        filters: { all: 'All', draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' },
        kpi: { totalUnpaid: 'Total Outstanding', totalPaid: 'Total Collected', drafts: 'Drafts Pending' },
        empty: 'No invoices found.', invDetails: 'Invoice Details', billTo: 'Bill To:',
        table: { desc: 'Description', qty: 'Qty', price: 'Price', tax: 'Tax', total: 'Total' },
        summary: { subtotal: 'Subtotal:', tax: 'VAT:', grand: 'Grand Total:' },
        actions: { markPaid: 'Mark as Paid', markSent: 'Approve & Send', print: 'Print PDF' }
    };

    // --- Data Processing ---
    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (inv.client?.name_ar || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (inv.client?.name_en || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const kpi = {
        unpaid: invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((sum, i) => sum + Number(i.grand_total), 0),
        paid: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + Number(i.grand_total), 0),
        drafts: invoices.filter(i => i.status === 'Draft').reduce((sum, i) => sum + Number(i.grand_total), 0),
    };

    const getStatusUI = (status: string) => {
        switch(status) {
            case 'Paid': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, label: t.filters.paid };
            case 'Overdue': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertTriangle, label: t.filters.overdue };
            case 'Sent': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: ArrowRight, label: t.filters.sent };
            default: return { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock, label: t.filters.draft };
        }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* CSS للطباعة */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    #printable-invoice, #printable-invoice * { visibility: visible; }
                    #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; padding: 20px; }
                    .no-print { display: none !important; }
                    .print-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; z-index: -1; width: 70%; pointer-events: none; }
                }
            `}} />

            {/* Header */}
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl no-print ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><FileText size={24}/></div>
                            {t.title}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
                    </div>
                    <button onClick={() => router.push('/dashboard/finance/sales/new')} className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition flex items-center justify-center gap-2 active:scale-95">
                        <Plus size={18}/> {t.newInv}
                    </button>
                </div>

                {/* KPIs */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.kpi.totalUnpaid}</div>
                        <div className="text-2xl font-mono font-black text-rose-500">{kpi.unpaid.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs">SAR</span></div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.kpi.totalPaid}</div>
                        <div className="text-2xl font-mono font-black text-emerald-600">{kpi.paid.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs text-emerald-600/50">SAR</span></div>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{t.kpi.drafts}</div>
                        <div className="text-2xl font-mono font-black text-slate-600 dark:text-slate-400">{kpi.drafts.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs">SAR</span></div>
                    </div>
                </div>

                {/* Filters */}
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search} className={`w-full border rounded-xl px-5 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500 shadow-sm'}`} />
                    </div>
                    <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className={`border rounded-xl px-5 py-3 text-sm font-bold outline-none cursor-pointer ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                        <option value="All">{t.filters.all}</option>
                        <option value="Draft">{t.filters.draft}</option>
                        <option value="Sent">{t.filters.sent}</option>
                        <option value="Paid">{t.filters.paid}</option>
                        <option value="Overdue">{t.filters.overdue}</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto no-print">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-600" size={50} /></div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem]">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.empty}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvoices.map(inv => {
                            const statusUI = getStatusUI(inv.status);
                            const StatusIcon = statusUI.icon;
                            return (
                                <motion.div 
                                    initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={inv.id} 
                                    onClick={() => setSelectedInvoice(inv)}
                                    className={`cursor-pointer rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 group ${cardBg}`}
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
                                            {isRTL ? inv.client?.name_ar : (inv.client?.name_en || inv.client?.name_ar)}
                                        </h3>
                                        {inv.project && <p className="text-[10px] font-bold text-blue-500 mb-4 truncate"><Building2 size={12} className="inline mr-1"/> {inv.project.title}</p>}
                                        {!inv.project && <p className="text-[10px] font-bold text-slate-400 mb-4 truncate">فاتورة عامة</p>}
                                        
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={12}/> {inv.issue_date}</div>
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

            {/* --- 🚀 INVOICE MODAL (Slide-over) --- */}
            <AnimatePresence>
                {selectedInvoice && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] no-print" onClick={() => setSelectedInvoice(null)} />
                        
                        <motion.div 
                            initial={{ x: isRTL ? '-100%' : '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: isRTL ? '-100%' : '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`fixed top-0 bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-full max-w-2xl z-[101] shadow-2xl flex flex-col no-print ${isDark ? 'bg-slate-950 border-r border-slate-800' : 'bg-slate-50'}`}
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                                <div>
                                    <h2 className={`text-xl font-black ${textMain}`}>{t.invDetails}</h2>
                                    <p className="text-sm font-mono font-bold text-blue-600 mt-1">{selectedInvoice.invoice_number}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handlePrint} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-full transition" title={t.actions.print}><Printer size={20}/></button>
                                    <button onClick={() => setSelectedInvoice(null)} className="p-2.5 bg-red-50 text-red-500 rounded-full transition"><X size={20}/></button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                
                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className="text-[10px] text-slate-400 font-bold mb-2">{t.billTo}</div>
                                        <div className={`font-black text-sm mb-1 ${textMain}`}>{isRTL ? selectedInvoice.client.name_ar : (selectedInvoice.client.name_en || selectedInvoice.client.name_ar)}</div>
                                        <div className="text-xs font-mono text-slate-500">VAT: {selectedInvoice.client.tax_number || '-'}</div>
                                        <div className="text-xs font-mono text-slate-500">CR: {selectedInvoice.client.cr_number || '-'}</div>
                                    </div>
                                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-400">تاريخ الإصدار:</span> <span className={textMain}>{selectedInvoice.issue_date}</span></div>
                                        <div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-400">تاريخ الاستحقاق:</span> <span className={textMain}>{selectedInvoice.due_date}</span></div>
                                        <div className="flex justify-between text-xs font-bold mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400">الحالة:</span> 
                                            <span className={getStatusUI(selectedInvoice.status).color}>{getStatusUI(selectedInvoice.status).label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    <table className="w-full text-start">
                                        <thead className={`text-[10px] uppercase font-black bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-700`}>
                                            <tr>
                                                <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.desc}</th>
                                                <th className="p-3 text-center">{t.table.qty}</th>
                                                <th className={`p-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.price}</th>
                                                <th className={`p-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.total}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedInvoice.lines.map((line, idx) => (
                                                <tr key={idx} className="text-sm font-bold">
                                                    <td className={`p-3 ${textMain}`}>{line.description}</td>
                                                    <td className="p-3 text-center text-slate-500">{line.quantity}</td>
                                                    <td className={`p-3 font-mono ${isRTL ? 'text-left' : 'text-right'} text-slate-500`}>{Number(line.unit_price).toLocaleString()}</td>
                                                    <td className={`p-3 font-mono ${isRTL ? 'text-left' : 'text-right'} ${textMain}`}>{Number(line.line_total).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary */}
                                <div className="flex justify-end">
                                    <div className={`w-full sm:w-1/2 p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                        <div className="flex justify-between text-xs font-bold text-slate-500"><span>{t.summary.subtotal}</span><span className="font-mono">{Number(selectedInvoice.subtotal).toLocaleString('en-US', {minimumFractionDigits:2})}</span></div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500"><span>{t.summary.tax}</span><span className="font-mono">{Number(selectedInvoice.tax_total).toLocaleString('en-US', {minimumFractionDigits:2})}</span></div>
                                        <div className={`flex justify-between text-sm font-black pt-3 border-t ${isDark ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-900'}`}>
                                            <span>{t.summary.grand}</span><span className="font-mono text-blue-600 text-lg">{Number(selectedInvoice.grand_total).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
                                    {selectedInvoice.status === 'Draft' && (
                                        <button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Sent')} disabled={isUpdating} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition flex justify-center items-center gap-2">
                                            {isUpdating ? <Loader2 size={18} className="animate-spin"/> : <ArrowRight size={18}/>} {t.actions.markSent}
                                        </button>
                                    )}
                                    {(selectedInvoice.status === 'Sent' || selectedInvoice.status === 'Overdue') && (
                                        <button onClick={() => updateInvoiceStatus(selectedInvoice.id, 'Paid')} disabled={isUpdating} className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/20 transition flex justify-center items-center gap-2">
                                            {isUpdating ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>} {t.actions.markPaid}
                                        </button>
                                    )}
                                </div>

                            </div>
                        </motion.div>

                        {/* --- 🖨️ PRINTABLE INVOICE LAYER 🖨️ --- */}
                        <div id="printable-invoice" className="hidden" dir={isRTL ? 'rtl' : 'ltr'}>
                            <img src="/logo1.png" alt="Watermark" className="print-watermark" />
                            
                            {/* Tax Invoice Header */}
                            <div style={{ display: 'flex', justifyItems: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <img src="/logo1.png" alt="GMS Logo" style={{ height: '70px', marginBottom: '10px' }} />
                                    <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0', color: '#0f172a' }}>فاتورة ضريبية</h1>
                                    <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b', margin: '5px 0 0 0', letterSpacing: '2px' }}>TAX INVOICE</h2>
                                </div>
                                <div style={{ flex: 1, textAlign: isRTL ? 'left' : 'right', fontSize: '12px', lineHeight: '1.6' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>{selectedInvoice.invoice_number}</div>
                                    <div><strong>Issue Date:</strong> {selectedInvoice.issue_date}</div>
                                    <div><strong>Due Date:</strong> {selectedInvoice.due_date}</div>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div style={{ display: 'flex', marginBottom: '30px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <div style={{ flex: 1, fontSize: '12px', lineHeight: '1.8' }}>
                                    <div style={{ fontWeight: 'bold', color: '#64748b', marginBottom: '5px', fontSize: '10px', textTransform: 'uppercase' }}>Bill To / فاتورة إلى</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{isRTL ? selectedInvoice.client.name_ar : (selectedInvoice.client.name_en || selectedInvoice.client.name_ar)}</div>
                                    {selectedInvoice.client.address_short && <div><strong>Address:</strong> {selectedInvoice.client.address_short}</div>}
                                    <div><strong>VAT Number:</strong> {selectedInvoice.client.tax_number || '-'}</div>
                                    <div><strong>CR Number:</strong> {selectedInvoice.client.cr_number || '-'}</div>
                                </div>
                            </div>

                            {/* Table */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#0f172a', color: 'white' }}>
                                        <th style={{ padding: '12px', textAlign: isRTL ? 'right' : 'left' }}>Description<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>الوصف</span></th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Qty<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>الكمية</span></th>
                                        <th style={{ padding: '12px', textAlign: isRTL ? 'left' : 'right' }}>Unit Price<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>سعر الوحدة</span></th>
                                        <th style={{ padding: '12px', textAlign: isRTL ? 'left' : 'right' }}>Tax<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>الضريبة</span></th>
                                        <th style={{ padding: '12px', textAlign: isRTL ? 'left' : 'right' }}>Total<br/><span style={{fontSize:'10px', fontWeight:'normal'}}>المجموع</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.lines.map((line, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{line.description}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{line.quantity}</td>
                                            <td style={{ padding: '12px', textAlign: isRTL ? 'left' : 'right', fontFamily: 'monospace' }}>{Number(line.unit_price).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                            <td style={{ padding: '12px', textAlign: isRTL ? 'left' : 'right', fontFamily: 'monospace' }}>{line.tax_rate}%</td>
                                            <td style={{ padding: '12px', textAlign: isRTL ? 'left' : 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{Number(line.line_total).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                                <table style={{ width: '350px', fontSize: '12px', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#64748b' }}>Subtotal (الإجمالي قبل الضريبة):</td>
                                            <td style={{ padding: '8px', textAlign: isRTL ? 'left' : 'right', fontFamily: 'monospace' }}>{Number(selectedInvoice.subtotal).toLocaleString('en-US', {minimumFractionDigits:2})} SAR</td>
                                        </tr>
                                        <tr style={{ borderBottom: '2px solid #0f172a' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#64748b' }}>VAT 15% (ضريبة القيمة المضافة):</td>
                                            <td style={{ padding: '8px', textAlign: isRTL ? 'left' : 'right', fontFamily: 'monospace' }}>{Number(selectedInvoice.tax_total).toLocaleString('en-US', {minimumFractionDigits:2})} SAR</td>
                                        </tr>
                                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                                            <td style={{ padding: '12px', fontWeight: 'black', fontSize: '16px', color: '#0f172a' }}>Grand Total (الإجمالي المستحق):</td>
                                            <td style={{ padding: '12px', textAlign: isRTL ? 'left' : 'right', fontFamily: 'monospace', fontWeight: 'black', fontSize: '16px', color: '#2563eb' }}>{Number(selectedInvoice.grand_total).toLocaleString('en-US', {minimumFractionDigits:2})} SAR</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Terms */}
                            {selectedInvoice.terms && (
                                <div style={{ fontSize: '10px', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
                                    <strong>Terms & Conditions / الشروط والأحكام:</strong><br/>
                                    {selectedInvoice.terms}
                                </div>
                            )}
                            
                            <div style={{ position: 'fixed', bottom: '20px', left: '0', width: '100%', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                                GMS Technical Services &bull; Generated automatically by GMS ERP System
                            </div>
                        </div>

                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
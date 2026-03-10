'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { 
    Search, Users, Building2, AlertTriangle, ArrowRight, ArrowLeft, 
    X, Loader2, FileText, Calendar, Printer, FileSpreadsheet, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Client {
    id: string;
    name_ar: string;
    name_en: string;
    tax_number: string;
    cr_number: string;
    balance: number;
    payment_term: string;
}

interface Transaction {
    id: string;
    date: string;
    reference: string;
    type: 'Invoice' | 'Receipt';
    description: string;
    debit: number;  // مدين (فواتير تزيد المديونية)
    credit: number; // دائن (دفعات تنقص المديونية)
    running_balance: number; // الرصيد التراكمي
}

export default function ClientBalancesPage() {
    const { lang, isDark } = useDashboard();
    const isRTL = lang === 'ar';

    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // SOA (Statement of Account) States
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [soaLoading, setSoaLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Fetch Clients ---
    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase.from('clients').select('*').order('name_ar', { ascending: true });
            if (!error && data) setClients(data);
            setLoading(false);
        };
        fetchClients();
    }, []);

    // --- Fetch Statement of Account (SOA) ---
    useEffect(() => {
        if (!selectedClient) return;

        const fetchSOA = async () => {
            setSoaLoading(true);
            try {
                // 1. جلب الفواتير (Debits)
                let invQuery = supabase.from('invoices').select('id, invoice_number, issue_date, grand_total, notes').eq('client_id', selectedClient.id);
                if (startDate) invQuery = invQuery.gte('issue_date', startDate);
                if (endDate) invQuery = invQuery.lte('issue_date', endDate);
                const { data: invoices } = await invQuery;

                // 2. جلب سندات القبض (Credits)
                let recQuery = supabase.from('vouchers').select('id, reference_number, date, amount, notes').eq('voucher_type', 'receipt').eq('client_id', selectedClient.id);
                if (startDate) recQuery = recQuery.gte('date', startDate);
                if (endDate) recQuery = recQuery.lte('date', endDate);
                const { data: receipts } = await recQuery;

                // 3. توحيد البيانات وترتيبها بالتاريخ
                let combined: any[] = [];
                
                (invoices || []).forEach(inv => {
                    combined.push({
                        id: inv.id, date: inv.issue_date, reference: inv.invoice_number,
                        type: 'Invoice', description: inv.notes || 'فاتورة مبيعات',
                        debit: Number(inv.grand_total), credit: 0
                    });
                });

                (receipts || []).forEach(rec => {
                    combined.push({
                        id: rec.id, date: rec.date, reference: rec.reference_number,
                        type: 'Receipt', description: rec.notes || 'سند قبض / دفعة',
                        debit: 0, credit: Number(rec.amount)
                    });
                });

                // ترتيب زمني تصاعدي (من الأقدم للأحدث) لحساب الرصيد التراكمي بشكل صحيح
                combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                // 4. حساب الرصيد التراكمي (Running Balance)
                let currentBalance = 0;
                const formattedTx: Transaction[] = combined.map(tx => {
                    currentBalance = currentBalance + tx.debit - tx.credit;
                    return { ...tx, running_balance: currentBalance };
                });

                // عكس الترتيب للعرض (من الأحدث للأقدم) بعد حساب الرصيد التراكمي
                setTransactions(formattedTx.reverse());

            } catch (error) {
                console.error(error);
            } finally {
                setSoaLoading(false);
            }
        };

        fetchSOA();
    }, [selectedClient, startDate, endDate]);


    // --- Export Excel (CSV) ---
    const exportToCSV = () => {
        if (!selectedClient || transactions.length === 0) return;
        
        const headers = isRTL 
            ? ['التاريخ', 'المرجع', 'البيان', 'مدين (SAR)', 'دائن (SAR)', 'الرصيد التراكمي']
            : ['Date', 'Reference', 'Description', 'Debit (SAR)', 'Credit (SAR)', 'Running Balance'];

        const rows = transactions.map(tx => [
            tx.date,
            tx.reference,
            `"${tx.description.replace(/"/g, '""')}"`, // حماية النصوص التي تحتوي على فواصل
            tx.debit.toFixed(2),
            tx.credit.toFixed(2),
            tx.running_balance.toFixed(2)
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        
        // دعم اللغة العربية في ملفات الـ CSV للـ Excel (BOM)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `كشف_حساب_${selectedClient.name_ar}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Export PDF (Native Print) ---
    const handlePrint = () => {
        window.print();
    };

    // --- Filters ---
    const filteredClients = clients.filter(c => 
        c.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.name_en && c.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.tax_number && c.tax_number.includes(searchQuery)) ||
        (c.cr_number && c.cr_number.includes(searchQuery))
    );

    const totalDebts = clients.reduce((sum, c) => sum + Number(c.balance), 0);

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* --- CSS مخصص للطباعة لإنشاء PDF مثالي (✅ تم إصلاح الكلمة هنا) --- */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * { visibility: hidden; }
                    #printable-soa, #printable-soa * { visibility: visible; }
                    #printable-soa { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; }
                    .no-print { display: none !important; }
                    .print-watermark { 
                        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        opacity: 0.05; z-index: -1; width: 80%; pointer-events: none;
                    }
                }
            `}} />

            {/* Header */}
            <div className={`border-b px-8 py-6 sticky top-0 z-20 backdrop-blur-xl no-print ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><FileText size={24}/></div>
                            {isRTL ? 'أرصدة العملاء وكشوفات الحساب' : 'Client Balances & SOA'}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'متابعة المديونيات وإصدار كشوفات الحساب المفصلة.' : 'Track debts and generate detailed statements of account.'}</p>
                    </div>
                    
                    <div className="text-right bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-6 py-3 rounded-2xl">
                        <div className="text-[10px] text-rose-500 font-bold mb-1 uppercase tracking-widest">{isRTL ? 'إجمالي المديونيات في السوق' : 'Total Market Debt'}</div>
                        <div className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">{totalDebts.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs">SAR</span></div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto relative max-w-md">
                    <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isRTL ? "بحث بالاسم، السجل التجاري، الرقم الضريبي..." : "Search clients..."} className={`w-full border rounded-2xl px-5 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-500 shadow-sm'}`} />
                </div>
            </div>

            {/* Clients Grid */}
            <div className="p-8 max-w-7xl mx-auto no-print">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-blue-600" size={50} /></div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 rounded-[2rem]">
                        <Users size={48} className="mx-auto text-slate-300 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'لا يوجد عملاء.' : 'No clients found.'}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredClients.map(client => (
                            <motion.div 
                                initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={client.id} 
                                onClick={() => setSelectedClient(client)}
                                className={`cursor-pointer rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 group ${cardBg}`}
                            >
                                {/* Debt Indicator Line */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${client.balance > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-inner border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <Building2 size={20}/>
                                        </div>
                                        {client.balance > 0 && <AlertTriangle className="text-rose-500" size={18}/>}
                                    </div>
                                    <h3 className={`text-lg font-black leading-tight mb-2 line-clamp-2 ${textMain}`}>{isRTL ? client.name_ar : (client.name_en || client.name_ar)}</h3>
                                    <p className="text-[10px] font-mono text-slate-400 mb-4">CR: {client.cr_number || 'N/A'} | VAT: {client.tax_number || 'N/A'}</p>
                                    
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'الرصيد النهائي' : 'Current Balance'}</div>
                                        <div className={`text-xl font-mono font-black ${client.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {Number(client.balance).toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs">SAR</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 🚀 SOA MODAL (Statement of Account) --- */}
            <AnimatePresence>
                {selectedClient && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto no-print" onClick={() => setSelectedClient(null)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                            className={`w-full max-w-5xl my-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                                <div>
                                    <h2 className={`text-2xl font-black ${textMain}`}>{isRTL ? 'كشف حساب تفصيلي' : 'Statement of Account'}</h2>
                                    <p className="text-sm font-bold text-blue-600 mt-1">{isRTL ? selectedClient.name_ar : selectedClient.name_en}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={exportToCSV} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition flex items-center gap-2 text-sm font-bold border border-emerald-200">
                                        <FileSpreadsheet size={18}/> <span className="hidden sm:inline">Excel</span>
                                    </button>
                                    <button onClick={handlePrint} className="p-3 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-xl transition flex items-center gap-2 text-sm font-bold shadow-lg">
                                        <Printer size={18}/> <span className="hidden sm:inline">PDF / طباعة</span>
                                    </button>
                                    <button onClick={() => setSelectedClient(null)} className="p-3 bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-500 rounded-xl transition"><X size={20}/></button>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400"/>
                                    <span className="text-xs font-bold text-slate-500">{isRTL ? 'من:' : 'From:'}</span>
                                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={`text-sm font-bold p-2 rounded-lg outline-none border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500">{isRTL ? 'إلى:' : 'To:'}</span>
                                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className={`text-sm font-bold p-2 rounded-lg outline-none border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                {soaLoading ? (
                                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                                ) : transactions.length === 0 ? (
                                    <div className="text-center py-20 text-slate-400 font-bold border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">{isRTL ? 'لا توجد حركات مالية في هذه الفترة.' : 'No transactions found in this period.'}</div>
                                ) : (
                                    <table className="w-full text-start">
                                        <thead className={`text-xs uppercase font-black border-b ${isDark ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-200'}`}>
                                            <tr>
                                                <th className={`pb-4 ${isRTL ? 'text-right' : 'text-left'}`}>التاريخ</th>
                                                <th className={`pb-4 ${isRTL ? 'text-right' : 'text-left'}`}>المرجع</th>
                                                <th className={`pb-4 w-1/3 ${isRTL ? 'text-right' : 'text-left'}`}>البيان</th>
                                                <th className={`pb-4 ${isRTL ? 'text-left' : 'text-right'}`}>مدين (فواتير)</th>
                                                <th className={`pb-4 ${isRTL ? 'text-left' : 'text-right'}`}>دائن (سداد)</th>
                                                <th className={`pb-4 ${isRTL ? 'text-left' : 'text-right'}`}>الرصيد</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-4 text-xs font-bold text-slate-500">{tx.date}</td>
                                                    <td className="py-4 text-xs font-mono font-bold text-blue-600">{tx.reference}</td>
                                                    <td className={`py-4 text-xs font-bold ${textMain}`}>{tx.description}</td>
                                                    <td className={`py-4 text-sm font-mono font-black text-rose-500 ${isRTL ? 'text-left' : 'text-right'}`}>
                                                        {tx.debit > 0 ? tx.debit.toLocaleString('en-US', {minimumFractionDigits:2}) : '-'}
                                                    </td>
                                                    <td className={`py-4 text-sm font-mono font-black text-emerald-500 ${isRTL ? 'text-left' : 'text-right'}`}>
                                                        {tx.credit > 0 ? tx.credit.toLocaleString('en-US', {minimumFractionDigits:2}) : '-'}
                                                    </td>
                                                    <td className={`py-4 text-sm font-mono font-black ${tx.running_balance > 0 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'} ${isRTL ? 'text-left' : 'text-right'}`}>
                                                        {tx.running_balance.toLocaleString('en-US', {minimumFractionDigits:2})}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- 🖨️ PRINTABLE LAYER (Hidden on screen, Visible on Print) 🖨️ --- */}
            {selectedClient && (
                <div id="printable-soa" className="hidden">
                    {/* Watermark Logo */}
                    <img src="/logo1.png" alt="Watermark" className="print-watermark" />
                    
                    {/* Print Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div>
                            <img src="/logo1.png" alt="GMS Logo" style={{ height: '60px', marginBottom: '10px' }} />
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>كشف حساب عميل</h1>
                            <h2 style={{ fontSize: '18px', fontWeight: 'normal', color: '#475569', margin: '5px 0 0 0' }}>Statement of Account</h2>
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '12px', lineHeight: '1.6' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedClient.name_ar}</div>
                            {selectedClient.name_en && <div>{selectedClient.name_en}</div>}
                            <div>CR: {selectedClient.cr_number || '-'}</div>
                            <div>VAT: {selectedClient.tax_number || '-'}</div>
                            <div style={{ marginTop: '10px', color: '#64748b' }}>
                                <strong>Period:</strong> {startDate || 'All Time'} to {endDate || 'Today'}
                            </div>
                        </div>
                    </div>

                    {/* Print Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                                <th style={{ padding: '10px', textAlign: 'right' }}>التاريخ (Date)</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>المرجع (Ref)</th>
                                <th style={{ padding: '10px', textAlign: 'right', width: '40%' }}>البيان (Description)</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>مدين (Debit)</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>دائن (Credit)</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>الرصيد (Balance)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '10px' }}>{tx.date}</td>
                                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{tx.reference}</td>
                                    <td style={{ padding: '10px' }}>{tx.description}</td>
                                    <td style={{ padding: '10px', textAlign: 'left', fontFamily: 'monospace' }}>{tx.debit > 0 ? tx.debit.toLocaleString('en-US', {minimumFractionDigits:2}) : '-'}</td>
                                    <td style={{ padding: '10px', textAlign: 'left', fontFamily: 'monospace' }}>{tx.credit > 0 ? tx.credit.toLocaleString('en-US', {minimumFractionDigits:2}) : '-'}</td>
                                    <td style={{ padding: '10px', textAlign: 'left', fontFamily: 'monospace', fontWeight: 'bold' }}>{tx.running_balance.toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Print Footer Summary */}
                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '300px', border: '2px solid #0f172a', borderRadius: '10px', padding: '15px', backgroundColor: '#f8fafc' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                                <span>الرصيد النهائي المستحق:</span>
                                <span style={{ fontFamily: 'monospace', color: '#e11d48' }}>
                                    {transactions.length > 0 ? transactions[0].running_balance.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'} SAR
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ position: 'fixed', bottom: '20px', left: '0', width: '100%', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                        GMS Technical Services &bull; Generated automatically by GMS ERP System
                    </div>
                </div>
            )}

        </div>
    );
}
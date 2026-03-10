'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout';
import { useRouter } from 'next/navigation';
import { 
    ArrowRight, ArrowLeft, Save, PlusCircle, Trash2, 
    ShoppingCart, Building2, Briefcase, Calendar, Loader2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InvoiceLine {
    id: string;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    tax_rate: number;
}

export default function NewPurchaseInvoicePage() {
    const { lang, isDark, user } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        invoice_number: `PINV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`,
        supplier_id: '',
        project_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // استحقاق الموردين عادة 30 يوم
        notes: ''
    });

    const [lines, setLines] = useState<InvoiceLine[]>([
        { id: '1', description: '', quantity: 1, unit_price: '', tax_rate: 15 }
    ]);

    useEffect(() => {
        const fetchInitialData = async () => {
            const [suppliersRes, projectsRes] = await Promise.all([
                supabase.from('suppliers').select('id, name_ar, name_en'),
                supabase.from('projects').select('id, title').eq('status', 'Active')
            ]);
            if (suppliersRes.data) setSuppliers(suppliersRes.data);
            if (projectsRes.data) setProjects(projectsRes.data);
        };
        fetchInitialData();
    }, []);

    const calculateTotals = () => {
        let subtotal = 0;
        let tax_total = 0;
        lines.forEach(line => {
            const qty = Number(line.quantity) || 0;
            const price = Number(line.unit_price) || 0;
            const lineTotal = qty * price;
            const lineTax = lineTotal * (line.tax_rate / 100);
            subtotal += lineTotal;
            tax_total += lineTax;
        });
        return { subtotal, tax_total, grand_total: subtotal + tax_total };
    };

    const totals = calculateTotals();

    const handleAddLine = () => setLines([...lines, { id: Math.random().toString(), description: '', quantity: 1, unit_price: '', tax_rate: 15 }]);
    const handleRemoveLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
    const updateLine = (id: string, field: keyof InvoiceLine, value: string | number) => setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));

    const handleSave = async () => {
        if (!form.supplier_id) return alert(isRTL ? 'الرجاء اختيار المورد' : 'Please select a supplier');
        if (lines.some(l => !l.description || Number(l.unit_price) <= 0)) return alert(isRTL ? 'الرجاء إكمال جميع البنود' : 'Please complete all items');
        
        setIsSubmitting(true);
        try {
            const { data: invoiceData, error: invoiceError } = await supabase.from('purchase_invoices').insert({
                invoice_number: form.invoice_number,
                supplier_id: form.supplier_id,
                project_id: form.project_id || null,
                issue_date: form.issue_date,
                due_date: form.due_date,
                subtotal: totals.subtotal,
                tax_total: totals.tax_total,
                grand_total: totals.grand_total,
                notes: form.notes,
                status: 'Draft',
                created_by: user?.id
            }).select('id').single();

            if (invoiceError) throw invoiceError;

            const linesToInsert = lines.map(l => {
                const qty = Number(l.quantity) || 0;
                const price = Number(l.unit_price) || 0;
                return {
                    invoice_id: invoiceData.id,
                    description: l.description,
                    quantity: qty,
                    unit_price: price,
                    tax_rate: l.tax_rate,
                    line_total: qty * price,
                    line_tax: (qty * price) * (l.tax_rate / 100)
                };
            });

            const { error: linesError } = await supabase.from('purchase_invoice_lines').insert(linesToInsert);
            if (linesError) throw linesError;

            alert(isRTL ? 'تم تسجيل فاتورة المشتريات بنجاح!' : 'Purchase Invoice created successfully!');
            router.push('/dashboard/finance/purchases/invoices');

        } catch (error: any) { alert('Error: ' + error.message); } finally { setIsSubmitting(false); }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:bg-white";

    return (
        <div className={`min-h-screen font-sans pb-40 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`px-4 md:px-8 py-6 border-b sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-4 max-w-7xl mx-auto">
                    <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                    </button>
                    <div>
                        <h1 className={`text-xl md:text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hidden sm:block"><ShoppingCart size={24}/></div>
                            {isRTL ? 'تسجيل فاتورة مشتريات' : 'New Purchase Invoice'}
                        </h1>
                        <p className={`text-xs md:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'تسجيل مطالبة مالية من مورد لمشروع أو للشركة.' : 'Record a bill from a supplier.'}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 space-y-6">
                
                <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {isRTL ? 'البيانات الأساسية' : 'General Info'}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="lg:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Building2 size={14}/> {isRTL ? 'المورد (Supplier) *' : 'Supplier *'}</label>
                            <select value={form.supplier_id} onChange={e=>setForm({...form, supplier_id: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer transition ${inputBg}`}>
                                <option value="">-- اختر المورد --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{isRTL ? s.name_ar : s.name_en}</option>)}
                            </select>
                        </div>
                        <div className="lg:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Briefcase size={14}/> {isRTL ? 'توجيه لمشروع (اختياري)' : 'Project'}</label>
                            <select value={form.project_id} onChange={e=>setForm({...form, project_id: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm cursor-pointer transition ${inputBg}`}>
                                <option value="">-- مشتريات عامة --</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'رقم فاتورة المورد' : 'Supplier Inv Number'}</label>
                            <input type="text" value={form.invoice_number} onChange={e=>setForm({...form, invoice_number: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-mono font-bold text-sm transition ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Calendar size={14}/> {isRTL ? 'تاريخ الفاتورة' : 'Issue Date'}</label>
                            <input type="date" value={form.issue_date} onChange={e=>setForm({...form, issue_date: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm transition ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Calendar size={14}/> {isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                            <input type="date" value={form.due_date} onChange={e=>setForm({...form, due_date: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm transition ${inputBg}`} />
                        </div>
                    </div>
                </div>

                <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${cardBg}`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{isRTL ? 'الأصناف والمواد المشتراة' : 'Purchased Items'}</h2>
                    </div>
                    
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-start min-w-[800px]">
                            <thead className={`text-xs uppercase font-black border-b ${isDark ? 'bg-slate-800/50 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>
                                <tr>
                                    <th className={`p-4 w-5/12 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'البيان' : 'Description'}</th>
                                    <th className={`p-4 w-24 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'الكمية' : 'Qty'}</th>
                                    <th className={`p-4 w-32 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'السعر' : 'Price'}</th>
                                    <th className={`p-4 w-24 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'الضريبة' : 'Tax'} %</th>
                                    <th className={`p-4 w-32 ${isRTL ? 'text-left' : 'text-right'}`}>{isRTL ? 'الإجمالي' : 'Total'}</th>
                                    <th className="p-4 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                <AnimatePresence>
                                    {lines.map((line) => {
                                        const lQty = Number(line.quantity) || 0;
                                        const lPrice = Number(line.unit_price) || 0;
                                        const lTotal = lQty * lPrice;
                                        return (
                                        <motion.tr initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key={line.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="p-3">
                                                <input type="text" placeholder="..." value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-bold text-sm min-w-[200px] ${inputBg}`} />
                                            </td>
                                            <td className="p-3">
                                                <input type="number" min="1" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-mono font-bold text-sm text-center min-w-[70px] ${inputBg}`} />
                                            </td>
                                            <td className="p-3">
                                                <input type="number" min="0" step="0.01" placeholder="0.00" value={line.unit_price} onChange={e => updateLine(line.id, 'unit_price', e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-mono font-bold text-sm ${isRTL ? 'text-left' : 'text-right'} ${inputBg}`} />
                                            </td>
                                            <td className="p-3">
                                                <input type="number" min="0" max="100" value={line.tax_rate} onChange={e => updateLine(line.id, 'tax_rate', e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-mono font-bold text-sm text-center min-w-[70px] ${inputBg}`} />
                                            </td>
                                            <td className={`p-3 font-mono font-black text-sm text-indigo-600 min-w-[100px] ${isRTL ? 'text-left' : 'text-right'}`}>
                                                {lTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleRemoveLine(line.id)} disabled={lines.length <= 1} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 cursor-pointer"><Trash2 size={18}/></button>
                                            </td>
                                        </motion.tr>
                                        )
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <button onClick={handleAddLine} className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 px-4 py-2.5 rounded-xl transition">
                            <PlusCircle size={18}/> {isRTL ? 'إضافة سطر' : 'Add Line'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                        <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'ملاحظات وتفاصيل الدفع' : 'Notes & Payment Details'}</label>
                        <textarea rows={4} value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} className={`w-full p-3 rounded-xl border outline-none font-medium text-sm resize-none ${inputBg}`} />
                    </div>

                    <div className={`p-6 md:p-8 rounded-[2rem] border shadow-sm flex flex-col justify-center ${cardBg}`}>
                        <div className="space-y-4 text-sm font-bold">
                            <div className="flex justify-between items-center text-slate-500">
                                <span>{isRTL ? 'الإجمالي قبل الضريبة' : 'Subtotal'}</span>
                                <span className="font-mono">{totals.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500">
                                <span>{isRTL ? 'الضريبة المضافة' : 'VAT'}</span>
                                <span className="font-mono">{totals.tax_total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <span className="text-lg font-black text-slate-800 dark:text-white">{isRTL ? 'إجمالي المطالبة المستحقة' : 'Total Due'}</span>
                                <span className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400 text-right sm:text-left">
                                    {totals.grand_total.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-sm text-slate-400">SAR</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-end gap-3">
                    <button onClick={() => router.back()} className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSubmitting || totals.grand_total <= 0}
                        className={`px-10 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${totals.grand_total > 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shadow-none'}`}
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                        {isRTL ? 'حفظ وتسجيل المشتريات' : 'Save Invoice'}
                    </button>
                </div>
            </div>

        </div>
    );
}
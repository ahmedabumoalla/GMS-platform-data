'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../../layout';
import { useRouter } from 'next/navigation';
import { 
    BookOpen, Save, PlusCircle, Trash2, ArrowRight, ArrowLeft, 
    Calculator, AlertTriangle, CheckCircle2, FileText, Loader2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Account {
    id: string;
    code: string;
    name_ar: string;
    name_en: string;
}

interface JELine {
    id: string;
    account_id: string;
    description: string;
    debit: number | string;
    credit: number | string;
}

export default function NewJournalEntryPage() {
    const { lang, isDark, user } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [jeForm, setJeForm] = useState({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        source: 'manual' // قيد يدوي
    });

    // Lines State (نبدا بسطرين افتراضياً لأن القيد يحتاج طرفين على الأقل)
    const [lines, setLines] = useState<JELine[]>([
        { id: '1', account_id: '', description: '', debit: '', credit: '' },
        { id: '2', account_id: '', description: '', debit: '', credit: '' }
    ]);

    // --- Dictionary ---
    const t = {
        ar: {
            title: 'إنشاء قيد يومية جديد', desc: 'تسجيل العمليات المالية اليدوية والتأكد من اتزانها المحاسبي.',
            back: 'العودة للقيود',
            form: { date: 'تاريخ القيد', ref: 'الرقم المرجعي', source: 'المصدر', desc: 'البيان العام للقيد', manual: 'قيد يدوي' },
            table: { account: 'الحساب', lineDesc: 'البيان (شرح الحركة)', debit: 'مدين', credit: 'دائن', action: 'إجراء' },
            actions: { addLine: 'إضافة سطر جديد', save: 'اعتماد وحفظ القيد' },
            calc: { totalDebit: 'إجمالي المدين', totalCredit: 'إجمالي الدائن', diff: 'الفرق (عدم اتزان)', balanced: 'القيد متزن وجاهز' },
            alerts: { diffHint: 'يجب إضافة هذا المبلغ للجانب', selectAcc: 'الرجاء اختيار الحساب', success: 'تم حفظ القيد بنجاح!' }
        },
        en: {
            title: 'New Journal Entry', desc: 'Record manual financial transactions and ensure accounting balance.',
            back: 'Back to Journal',
            form: { date: 'Entry Date', ref: 'Reference No.', source: 'Source', desc: 'General Description', manual: 'Manual Entry' },
            table: { account: 'Account', lineDesc: 'Description', debit: 'Debit', credit: 'Credit', action: 'Action' },
            actions: { addLine: 'Add New Line', save: 'Post & Save Entry' },
            calc: { totalDebit: 'Total Debit', totalCredit: 'Total Credit', diff: 'Difference (Imbalance)', balanced: 'Entry is Balanced' },
            alerts: { diffHint: 'Add this amount to the', selectAcc: 'Please select account', success: 'Entry saved successfully!' }
        }
    }[lang];

    // --- 1. Fetch Accounts ---
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                // نجلب فقط الحسابات التي يمكن التسجيل عليها (ليست مجلدات/آباء)
                // في نظام حقيقي قد نستخدم حقل is_leaf، هنا سنجلب الكل للتبسيط
                const { data, error } = await supabase.from('accounts').select('id, code, name_ar, name_en').order('code');
                if (error) throw error;
                if (data) setAccounts(data);
            } catch (error) {
                console.error("Error fetching accounts:", error);
            } finally {
                setLoadingAccounts(false);
            }
        };
        fetchAccounts();
    }, []);

    // --- 2. Live Calculations ---
    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01 && totalDebit > 0;

    // --- 3. Handlers ---
    const handleAddLine = () => {
        setLines([...lines, { id: Math.random().toString(), account_id: '', description: '', debit: '', credit: '' }]);
    };

    const handleRemoveLine = (id: string) => {
        if (lines.length > 2) {
            setLines(lines.filter(l => l.id !== id));
        }
    };

    const handleUpdateLine = (id: string, field: keyof JELine, value: string) => {
        setLines(lines.map(line => {
            if (line.id === id) {
                const updatedLine = { ...line, [field]: value };
                // ذكاء الإدخال: تصفير الطرف الآخر
                if (field === 'debit' && Number(value) > 0) updatedLine.credit = '';
                if (field === 'credit' && Number(value) > 0) updatedLine.debit = '';
                return updatedLine;
            }
            return line;
        }));
    };

    const handleSave = async () => {
        if (!isBalanced) return;
        if (lines.some(l => !l.account_id)) return alert(t.alerts.selectAcc);
        if (!user) return;

        setIsSubmitting(true);
        try {
            // 1. إنشاء رأس القيد
            const { data: headerData, error: headerError } = await supabase.from('journal_entries').insert({
                date: jeForm.date,
                reference: jeForm.reference || `JV-${Date.now().toString().slice(-6)}`,
                description: jeForm.description,
                status: 'Posted',
                user_id: user.id
            }).select('id').single();

            if (headerError) throw headerError;

            // 2. تجهيز وإرسال سطور القيد (إزالة السطور الفارغة تماماً)
            const validLines = lines.filter(l => Number(l.debit) > 0 || Number(l.credit) > 0).map(l => ({
                entry_id: headerData.id,
                account_id: l.account_id,
                description: l.description || jeForm.description,
                debit: Number(l.debit) || 0,
                credit: Number(l.credit) || 0
            }));

            const { error: linesError } = await supabase.from('journal_lines').insert(validLines);
            if (linesError) throw linesError;

            alert(t.alerts.success);
            router.push('/dashboard/finance/general-ledger'); // العودة لدفتر الأستاذ

        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Styles ---
    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white";

    return (
        <div className={`min-h-screen font-sans pb-40 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header */}
            <div className={`px-8 py-6 border-b sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                            {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                        </button>
                        <div>
                            <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                                <BookOpen className="text-blue-600" size={28}/> {t.title}
                            </h1>
                            <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.desc}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
                
                {/* 1. General Info Card */}
                <div className={`p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <FileText size={18}/> البيانات الأساسية للقيد
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.form.date} *</label>
                            <input type="date" value={jeForm.date} onChange={e=>setJeForm({...jeForm, date: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm transition ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.form.ref}</label>
                            <input type="text" value={jeForm.reference} onChange={e=>setJeForm({...jeForm, reference: e.target.value})} placeholder="مثال: JV-1001" className={`w-full p-3.5 rounded-xl border outline-none font-mono font-bold text-sm transition ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.form.source}</label>
                            <div className={`w-full p-3.5 rounded-xl border font-bold text-sm opacity-70 cursor-not-allowed ${inputBg}`}>
                                {t.form.manual}
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.form.desc}</label>
                            <input type="text" value={jeForm.description} onChange={e=>setJeForm({...jeForm, description: e.target.value})} placeholder="البيان العام الذي سيظهر في التقارير..." className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm transition ${inputBg}`} />
                        </div>
                    </div>
                </div>

                {/* 2. Journal Lines (The Grid) */}
                <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${cardBg}`}>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-start">
                            <thead className={`text-xs uppercase font-black border-b ${isDark ? 'bg-slate-800/50 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                <tr>
                                    <th className={`p-5 w-64 ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.account}</th>
                                    <th className={`p-5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.table.lineDesc}</th>
                                    <th className={`p-5 w-40 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.debit}</th>
                                    <th className={`p-5 w-40 ${isRTL ? 'text-left' : 'text-right'}`}>{t.table.credit}</th>
                                    <th className="p-5 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                <AnimatePresence>
                                    {lines.map((line, index) => (
                                        <motion.tr 
                                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                            key={line.id} 
                                            className="group transition hover:bg-blue-50/10"
                                        >
                                            <td className="p-3">
                                                <select 
                                                    value={line.account_id} onChange={e => handleUpdateLine(line.id, 'account_id', e.target.value)}
                                                    className={`w-full p-3 rounded-xl border outline-none font-bold text-xs cursor-pointer ${inputBg}`}
                                                >
                                                    <option value="">-- اختر الحساب --</option>
                                                    {loadingAccounts ? <option disabled>Loading...</option> : accounts.map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.code} - {isRTL ? acc.name_ar : acc.name_en}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" value={line.description} onChange={e => handleUpdateLine(line.id, 'description', e.target.value)}
                                                    placeholder="شرح السطر (اختياري)..." 
                                                    className={`w-full p-3 rounded-xl border outline-none font-medium text-xs ${inputBg}`} 
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="number" min="0" step="0.01" value={line.debit} onChange={e => handleUpdateLine(line.id, 'debit', e.target.value)}
                                                    placeholder="0.00" 
                                                    className={`w-full p-3 rounded-xl border outline-none font-mono font-black text-sm text-emerald-500 placeholder:text-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${isRTL ? 'text-left' : 'text-right'} ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} 
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="number" min="0" step="0.01" value={line.credit} onChange={e => handleUpdateLine(line.id, 'credit', e.target.value)}
                                                    placeholder="0.00" 
                                                    className={`w-full p-3 rounded-xl border outline-none font-mono font-black text-sm text-rose-500 placeholder:text-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 ${isRTL ? 'text-left' : 'text-right'} ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} 
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleRemoveLine(line.id)} disabled={lines.length <= 2} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer">
                                                    <Trash2 size={18}/>
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <button onClick={handleAddLine} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-100/50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition">
                            <PlusCircle size={18}/> {t.actions.addLine}
                        </button>
                    </div>
                </div>

            </div>

            {/* 3. 🚀 Smart Sticky Footer (The Balancing Engine) 🚀 */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    {/* Live Calculator */}
                    <div className="flex items-center gap-6 lg:gap-12 w-full md:w-auto">
                        <div className={isRTL ? 'text-left' : 'text-right'}>
                            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.calc.totalDebit}</div>
                            <div className="text-2xl font-mono font-black text-emerald-500">{totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.calc.totalCredit}</div>
                            <div className="text-2xl font-mono font-black text-rose-500">{totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>

                        {/* Status Indicator */}
                        <div className="hidden sm:block ml-auto rtl:mr-auto rtl:ml-0">
                            <AnimatePresence mode="wait">
                                {isBalanced ? (
                                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
                                        <CheckCircle2 size={20}/>
                                        <span className="font-black text-sm">{t.calc.balanced}</span>
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-3 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-4 py-2 rounded-2xl border border-rose-200 dark:border-rose-500/30">
                                        <AlertTriangle size={20} className="animate-pulse"/>
                                        <div>
                                            <span className="font-black text-sm block leading-none mb-0.5">{t.calc.diff}: {difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-[10px] font-bold opacity-80">{t.alerts.diffHint} {totalDebit > totalCredit ? t.table.credit : t.table.debit}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                        onClick={handleSave} 
                        disabled={!isBalanced || isSubmitting || totalDebit === 0}
                        className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isBalanced && totalDebit > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shadow-none'}`}
                    >
                        {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                        {t.actions.save}
                    </button>
                </div>
            </div>

        </div>
    );
}
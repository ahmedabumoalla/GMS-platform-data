'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout';
import { useRouter } from 'next/navigation';
import { 
    ArrowDownLeft, Save, PlusCircle, Trash2, ArrowRight, ArrowLeft, 
    AlertTriangle, CheckCircle2, Loader2, 
    Wallet, Building2, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReceiptVoucherPage() {
    const { lang, isDark, user } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [treasuries, setTreasuries] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        reference: `RV-${Date.now().toString().slice(-5)}`,
        amount: '',
        treasury_id: '',
        payment_method: 'bank_transfer',
        entity_name: '',
        notes: ''
    });

    const [lines, setLines] = useState([{ id: '1', account_id: '', description: '', amount: '' }]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: trData } = await supabase.from('treasuries').select('*').eq('is_active', true);
            if (trData) setTreasuries(trData);

            const { data: accData } = await supabase.from('accounts').select('id, code, name_ar, name_en').order('code');
            if (accData) setAccounts(accData);
        };
        fetchData();
    }, []);

    const mainAmount = Number(form.amount) || 0;
    const distributedAmount = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
    const difference = Math.abs(mainAmount - distributedAmount);
    const isBalanced = mainAmount > 0 && difference < 0.01;

    const handleSave = async () => {
        if (!isBalanced || !form.treasury_id) return alert('الرجاء التأكد من اتزان السند واختيار الخزينة.');
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('vouchers').insert({
                voucher_type: 'receipt', reference_number: form.reference, date: form.date, amount: mainAmount,
                treasury_id: form.treasury_id, payment_method: form.payment_method, entity_name: form.entity_name,
                notes: form.notes, created_by: user?.id
            });
            if (error) throw error;
            alert('تم إصدار سند القبض بنجاح!');
            router.push('/dashboard/finance/general-ledger');
        } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
    };

    const addLine = () => setLines([...lines, { id: Math.random().toString(), account_id: '', description: '', amount: '' }]);
    const removeLine = (id: string) => { if (lines.length > 1) setLines(lines.filter(l => l.id !== id)); };
    const updateLine = (id: string, field: string, value: string) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white";

    return (
        <div className={`min-h-screen font-sans pb-40 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* 🟢 Header (Emerald Theme) */}
            <div className={`px-8 py-6 border-b sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-4 max-w-7xl mx-auto">
                    <button onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                    </button>
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><ArrowDownLeft size={24}/></div>
                            سند قبض نقدية (Receipt Voucher)
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>إثبات استلام نقدية وإيداعها في الحسابات.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
                
                {/* 1. Main Info Card */}
                <div className={`p-8 rounded-[2rem] border shadow-sm ${cardBg}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">المبلغ المُستلم (SAR) *</label>
                            <input type="number" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} placeholder="0.00" className={`w-full p-4 rounded-2xl outline-none font-mono font-black text-2xl text-emerald-600 transition ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">التاريخ *</label>
                            <input type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm transition ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">رقم السند</label>
                            <input type="text" value={form.reference} disabled className={`w-full p-4 rounded-2xl outline-none font-mono font-bold text-sm opacity-70 cursor-not-allowed ${inputBg}`} />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">يُودع في (الخزينة/البنك) *</label>
                            <select value={form.treasury_id} onChange={e=>setForm({...form, treasury_id: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm cursor-pointer transition ${inputBg}`}>
                                <option value="">-- اختر --</option>
                                {treasuries.map(t => <option key={t.id} value={t.id}>{isRTL ? t.name_ar : t.name_en} ({t.type === 'bank' ? 'بنك' : 'نقدي'})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">طريقة القبض</label>
                            <select value={form.payment_method} onChange={e=>setForm({...form, payment_method: e.target.value})} className={`w-full p-4 rounded-2xl outline-none font-bold text-sm cursor-pointer transition ${inputBg}`}>
                                <option value="bank_transfer">حوالة بنكية</option>
                                <option value="cash">نقداً</option>
                                <option value="check">شيك</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">مُستلمة من (الدافع)</label>
                            <div className="relative">
                                <User className={`absolute top-4 text-slate-400 w-5 h-5 ${isRTL ? 'right-4' : 'left-4'}`} />
                                <input type="text" value={form.entity_name} onChange={e=>setForm({...form, entity_name: e.target.value})} placeholder="اسم العميل أو الجهة..." className={`w-full p-4 rounded-2xl outline-none font-bold text-sm transition ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} ${inputBg}`} />
                            </div>
                        </div>
                        <div className="md:col-span-4">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">البيان / الغرض من القبض</label>
                            <input type="text" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} placeholder="اكتب تفاصيل سبب الاستلام هنا..." className={`w-full p-4 rounded-2xl outline-none font-medium text-sm transition ${inputBg}`} />
                        </div>
                    </div>
                </div>

                {/* 2. Accounting Routing */}
                <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${cardBg}`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h2 className="text-sm font-black text-slate-700 dark:text-slate-300">التوجيه المحاسبي (الحسابات الدائنة)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-start">
                            <thead className={`text-xs uppercase font-black border-b ${isDark ? 'bg-slate-800/50 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>
                                <tr>
                                    <th className={`p-4 w-1/3 ${isRTL ? 'text-right' : 'text-left'}`}>الحساب المحول منه</th>
                                    <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>البيان الفرعي</th>
                                    <th className={`p-4 w-40 ${isRTL ? 'text-left' : 'text-right'}`}>المبلغ</th>
                                    <th className="p-4 w-16 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                <AnimatePresence>
                                    {lines.map((line) => (
                                        <motion.tr initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key={line.id} className="group">
                                            <td className="p-3">
                                                <select value={line.account_id} onChange={e => updateLine(line.id, 'account_id', e.target.value)} className={`w-full p-3 rounded-xl border outline-none font-bold text-xs cursor-pointer ${inputBg}`}>
                                                    <option value="">-- اختر حساب الإيراد/العميل --</option>
                                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {isRTL ? acc.name_ar : acc.name_en}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input type="text" value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} placeholder="..." className={`w-full p-3 rounded-xl border outline-none font-medium text-xs ${inputBg}`} />
                                            </td>
                                            <td className="p-3">
                                                <input type="number" value={line.amount} onChange={e => updateLine(line.id, 'amount', e.target.value)} placeholder="0.00" className={`w-full p-3 rounded-xl border outline-none font-mono font-black text-sm text-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${isRTL ? 'text-left' : 'text-right'} ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} />
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => removeLine(line.id)} disabled={lines.length <= 1} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition disabled:opacity-30 cursor-pointer"><Trash2 size={18}/></button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                    <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                        <button onClick={addLine} className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition">
                            <PlusCircle size={18}/> إضافة سطر توزيع
                        </button>
                    </div>
                </div>
            </div>

            {/* 🟢 Smart Footer Engine */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 lg:gap-12 w-full md:w-auto">
                        <div className={isRTL ? 'text-left' : 'text-right'}>
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">إجمالي السند</div>
                            <div className="text-2xl font-mono font-black text-emerald-600">{mainAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">إجمالي التوزيع</div>
                            <div className="text-2xl font-mono font-black text-slate-700 dark:text-slate-300">{distributedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                        <div className="hidden sm:block ml-auto rtl:mr-auto rtl:ml-0">
                            {isBalanced ? (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-200">
                                    <CheckCircle2 size={20}/> <span className="font-black text-sm">التوزيع متطابق</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 bg-rose-50 text-rose-700 px-4 py-2 rounded-2xl border border-rose-200 animate-pulse">
                                    <AlertTriangle size={20}/>
                                    <div>
                                        <span className="font-black text-sm block leading-none mb-0.5">الفرق: {difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        <span className="text-[10px] font-bold opacity-80">يجب أن يتطابق التوزيع مع السند</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={!isBalanced || isSubmitting || !form.treasury_id} className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isBalanced && form.treasury_id ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 shadow-none'}`}>
                        {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>} اعتماد سند القبض
                    </button>
                </div>
            </div>
        </div>
    );
}
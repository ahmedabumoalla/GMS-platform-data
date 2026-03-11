'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
// المسار: page -> new -> expenses -> finance -> dashboard -> layout
import { useDashboard } from '@/app/dashboard/layout'; 
import { useRouter } from 'next/navigation';
import { 
    ArrowRight, ArrowLeft, Save, CreditCard, 
    Calendar, Loader2, Receipt, FileText
} from 'lucide-react';

export default function NewExpensePage() {
    const { lang, isDark, user } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        expense_number: `EXP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`,
        category: 'Operational',
        amount: '',
        tax_rate: '15',
        payment_method: 'Bank Transfer',
        reference_number: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const amountNum = Number(form.amount) || 0;
    const taxNum = amountNum * (Number(form.tax_rate) / 100);
    const totalNum = amountNum + taxNum;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amountNum <= 0) return alert(isRTL ? 'الرجاء إدخال مبلغ صحيح' : 'Please enter a valid amount');
        
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('expenses').insert({
                expense_number: form.expense_number,
                category: form.category,
                amount: amountNum,
                tax_amount: taxNum,
                total_amount: totalNum,
                payment_method: form.payment_method,
                reference_number: form.reference_number,
                expense_date: form.expense_date,
                notes: form.notes,
                created_by: user?.id
            });

            if (error) throw error;
            
            alert(isRTL ? 'تم تسجيل المصروف بنجاح!' : 'Expense recorded successfully!');
            router.push('/dashboard/finance/expenses/list');
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-rose-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500";

    return (
        <div className={`min-h-screen font-sans pb-20 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            <div className={`px-6 md:px-8 py-6 border-b sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="flex items-center gap-4 max-w-4xl mx-auto">
                    <button type="button" onClick={() => router.back()} className={`p-2.5 rounded-full transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>}
                    </button>
                    <div>
                        <h1 className={`text-xl md:text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl hidden sm:flex"><Receipt size={24}/></div>
                            {isRTL ? 'تسجيل مصروف جديد' : 'Record New Expense'}
                        </h1>
                        <p className={`text-xs md:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {isRTL ? 'تسجيل المصروفات التشغيلية، الإدارية، والمشتريات النثرية.' : 'Record operational, admin, and petty cash expenses.'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="max-w-4xl mx-auto px-4 md:px-6 mt-8 space-y-6">
                
                <div className={`p-6 md:p-8 rounded-4xl border shadow-sm ${cardBg}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'التصنيف' : 'Category'}</label>
                            <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`}>
                                <option value="Operational">تشغيلي (Operational)</option>
                                <option value="Administrative">إداري (Administrative)</option>
                                <option value="Salaries & Wages">رواتب وأجور (Salaries)</option>
                                <option value="Logistics">نقل ومواصلات (Logistics)</option>
                                <option value="Marketing">تسويق (Marketing)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Calendar size={14}/> {isRTL ? 'تاريخ الصرف' : 'Date'}</label>
                            <input type="date" value={form.expense_date} onChange={(e) => setForm({...form, expense_date: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`} />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'المبلغ (قبل الضريبة)' : 'Amount (Excl. VAT)'}</label>
                            <input required type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm ${inputBg}`} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'نسبة الضريبة (VAT %)' : 'VAT %'}</label>
                            <input type="number" min="0" max="100" value={form.tax_rate} onChange={(e) => setForm({...form, tax_rate: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm ${inputBg}`} />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><CreditCard size={14}/> {isRTL ? 'طريقة الدفع' : 'Payment Method'}</label>
                            <select value={form.payment_method} onChange={(e) => setForm({...form, payment_method: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold text-sm ${inputBg}`}>
                                <option value="Bank Transfer">تحويل بنكي</option>
                                <option value="Credit Card">بطاقة ائتمانية</option>
                                <option value="Cash">نقدي (عهدة)</option>
                                <option value="Check">شيك</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><FileText size={14}/> {isRTL ? 'رقم الإيصال / المرجع' : 'Reference Number'}</label>
                            <input type="text" value={form.reference_number} onChange={(e) => setForm({...form, reference_number: e.target.value})} placeholder="INV-00123" className={`w-full p-4 rounded-xl border outline-none font-mono font-bold text-sm ${inputBg}`} />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">{isRTL ? 'البيان / الملاحظات' : 'Description / Notes'}</label>
                            <textarea rows={3} required value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder={isRTL ? 'اكتب سبب الصرف بالتفصيل...' : 'Reason for expense...'} className={`w-full p-4 rounded-xl border outline-none font-medium text-sm resize-none ${inputBg}`} />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className={`mt-8 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center border ${isDark ? 'bg-rose-900/10 border-rose-900/30' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex gap-8 mb-4 md:mb-0 text-sm font-bold">
                            <div><span className="text-slate-500 block text-xs">{isRTL ? 'المبلغ الأساسي' : 'Subtotal'}</span><span className={textMain}>{amountNum.toLocaleString()}</span></div>
                            <div><span className="text-slate-500 block text-xs">{isRTL ? 'الضريبة' : 'VAT'}</span><span className={textMain}>{taxNum.toLocaleString()}</span></div>
                        </div>
                        <div className="text-center md:text-left">
                            <span className="text-slate-500 block text-xs font-bold mb-1">{isRTL ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                            <div className="text-3xl font-mono font-black text-rose-600 dark:text-rose-500">{totalNum.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-sm">SAR</span></div>
                        </div>
                    </div>

                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className={`px-8 py-3.5 rounded-2xl font-bold text-sm transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button type="submit" disabled={isSubmitting || amountNum <= 0} className="px-10 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                        {isRTL ? 'حفظ المصروف' : 'Save Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
}
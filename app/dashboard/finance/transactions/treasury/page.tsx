'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout';
import { 
    Landmark, Wallet, ArrowLeftRight, Plus, Search, 
    MoreHorizontal, Building2, Hash, CheckCircle2, 
    XCircle, Loader2, X, FileText, UploadCloud, TrendingUp, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type TreasuryType = 'cash' | 'bank';

interface Treasury {
    id: string;
    name_ar: string;
    name_en: string;
    type: TreasuryType;
    bank_name?: string;
    account_number?: string;
    currency: string;
    balance: number;
    is_active: boolean;
}

export default function TreasuryManagementPage() {
    const { lang, isDark, user } = useDashboard();
    const isRTL = lang === 'ar';

    const [treasuries, setTreasuries] = useState<Treasury[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [accountForm, setAccountForm] = useState({
        type: 'cash' as TreasuryType, name_ar: '', name_en: '', bank_name: '', account_number: '', is_active: true, description: ''
    });

    const [transferForm, setTransferForm] = useState({
        from_id: '', to_id: '', amount: '', date: new Date().toISOString().split('T')[0], notes: ''
    });

    // --- Dictionary ---
    const t = {
        ar: {
            title: 'الخزائن والحسابات البنكية', desc: 'إدارة النقدية، الحسابات البنكية، والتحويلات الداخلية.',
            search: 'بحث باسم الخزينة أو البنك...',
            addAccount: 'إضافة حساب/خزينة', newTransfer: 'تحويل بين الخزائن',
            cash: 'خزينة نقدية', bank: 'حساب بنكي',
            balance: 'الرصيد المتاح', active: 'نشط', inactive: 'غير نشط',
            modals: {
                addTitle: 'تسجيل حساب بنكي / خزينة',
                type: 'النوع', name: 'الاسم', bankName: 'اسم البنك', accNum: 'رقم الحساب',
                status: 'الحالة', desc: 'الوصف', cancel: 'إلغاء', save: 'حفظ واعتماد',
                transferTitle: 'التحويل بين الخزائن والبنوك',
                from: 'من خزينة / بنك', to: 'إلى خزينة / بنك', amount: 'المبلغ المحول',
                date: 'تاريخ التحويل', notes: 'ملاحظات / بيان التحويل',
                balanceBefore: 'المتاح قبل:', balanceAfter: 'المتاح بعد:'
            },
            alerts: { success: 'تمت العملية بنجاح!', error: 'حدث خطأ، يرجى المحاولة.' }
        },
        en: {
            title: 'Treasury & Bank Accounts', desc: 'Manage cash, bank accounts, and internal transfers.',
            search: 'Search treasury or bank...',
            addAccount: 'Add Account/Treasury', newTransfer: 'Internal Transfer',
            cash: 'Cash Treasury', bank: 'Bank Account',
            balance: 'Available Balance', active: 'Active', inactive: 'Inactive',
            modals: {
                addTitle: 'Register Bank Account / Treasury',
                type: 'Type', name: 'Name', bankName: 'Bank Name', accNum: 'Account Number',
                status: 'Status', desc: 'Description', cancel: 'Cancel', save: 'Save & Approve',
                transferTitle: 'Transfer Between Treasuries',
                from: 'From Account', to: 'To Account', amount: 'Transfer Amount',
                date: 'Transfer Date', notes: 'Notes / Description',
                balanceBefore: 'Balance Before:', balanceAfter: 'Balance After:'
            },
            alerts: { success: 'Operation completed successfully!', error: 'An error occurred.' }
        }
    }[lang];

    // --- Fetch Data ---
    const fetchTreasuries = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('treasuries').select('*').order('created_at', { ascending: true });
            if (error) throw error;
            if (data) setTreasuries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTreasuries(); }, []);

    // --- Handlers ---
    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('treasuries').insert({
                name_ar: accountForm.name_ar || accountForm.name_en,
                name_en: accountForm.name_en || accountForm.name_ar,
                type: accountForm.type,
                bank_name: accountForm.type === 'bank' ? accountForm.bank_name : null,
                account_number: accountForm.type === 'bank' ? accountForm.account_number : null,
                is_active: accountForm.is_active,
                description: accountForm.description
            });
            if (error) throw error;
            alert(t.alerts.success);
            setIsAddModalOpen(false);
            fetchTreasuries();
        } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (transferForm.from_id === transferForm.to_id) return alert(isRTL ? 'لا يمكن التحويل لنفس الحساب' : 'Cannot transfer to the same account');
        setIsSubmitting(true);
        try {
            const amountNum = parseFloat(transferForm.amount);
            // 1. Insert Transfer Log
            const { error: transferError } = await supabase.from('treasury_transfers').insert({
                from_treasury_id: transferForm.from_id,
                to_treasury_id: transferForm.to_id,
                amount: amountNum,
                notes: transferForm.notes,
                transfer_date: transferForm.date,
                created_by: user?.id
            });
            if (transferError) throw transferError;

            // 2. Update Balances (في الأنظمة الحقيقية يجب استخدام RPC / Stored Procedure لضمان سلامة البيانات)
            const fromAccount = treasuries.find(t => t.id === transferForm.from_id);
            const toAccount = treasuries.find(t => t.id === transferForm.to_id);
            
            if(fromAccount) await supabase.from('treasuries').update({ balance: Number(fromAccount.balance) - amountNum }).eq('id', fromAccount.id);
            if(toAccount) await supabase.from('treasuries').update({ balance: Number(toAccount.balance) + amountNum }).eq('id', toAccount.id);

            alert(t.alerts.success);
            setIsTransferModalOpen(false);
            setTransferForm({ from_id: '', to_id: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
            fetchTreasuries();
        } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
    };

    // --- Dynamic Calculations for Transfer Modal ---
    const selectedFromObj = treasuries.find(tr => tr.id === transferForm.from_id);
    const selectedToObj = treasuries.find(tr => tr.id === transferForm.to_id);
    const transferAmount = parseFloat(transferForm.amount) || 0;

    const filteredTreasuries = treasuries.filter(tr => 
        tr.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tr.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tr.account_number?.includes(searchQuery)
    );

    const totalCash = treasuries.filter(t => t.type === 'cash').reduce((sum, t) => sum + Number(t.balance), 0);
    const totalBank = treasuries.filter(t => t.type === 'bank').reduce((sum, t) => sum + Number(t.balance), 0);

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const inputBg = isDark ? "bg-slate-800 border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white";

    return (
        <div className={`min-h-screen font-sans pb-24 ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header & Stats */}
            <header className={`sticky top-0 z-20 px-8 py-6 border-b backdrop-blur-xl shadow-sm ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <Landmark className="text-blue-600" size={28}/> {t.title}
                        </h1>
                        <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.desc}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button onClick={() => setIsTransferModalOpen(true)} className="flex-1 md:flex-none px-5 py-3 rounded-xl font-bold text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center justify-center gap-2">
                            <ArrowLeftRight size={18}/> <span className="hidden sm:block">{t.newTransfer}</span>
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none px-5 py-3 rounded-xl font-bold text-sm bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 shadow-xl transition flex items-center justify-center gap-2">
                            <Plus size={18}/> <span className="hidden sm:block">{t.addAccount}</span>
                        </button>
                    </div>
                </div>

                {/* KPI Cards & Search */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex gap-4 flex-1">
                        <div className={`flex-1 p-4 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Wallet size={24}/></div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'إجمالي النقدية' : 'Total Cash'}</div>
                                <div className={`text-xl font-black font-mono ${textMain}`}>{totalCash.toLocaleString()} <span className="text-xs text-slate-500">SAR</span></div>
                            </div>
                        </div>
                        <div className={`flex-1 p-4 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Building2 size={24}/></div>
                            <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'أرصدة البنوك' : 'Bank Balances'}</div>
                                <div className={`text-xl font-black font-mono ${textMain}`}>{totalBank.toLocaleString()} <span className="text-xs text-slate-500">SAR</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative flex-1 lg:max-w-md">
                        <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-4 text-slate-400 w-5 h-5`} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search} className={`w-full h-full border rounded-2xl px-5 py-4 text-sm font-bold outline-none transition ${inputBg}`} />
                    </div>
                </div>
            </header>

            {/* Grid Content */}
            <div className="p-8">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={50}/></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredTreasuries.map(tr => (
                            <div key={tr.id} className={`group relative p-6 rounded-[2rem] border transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                {/* Status Indicator */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${tr.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                
                                <div className="flex justify-between items-start mb-6 mt-2">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${tr.type === 'bank' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {tr.type === 'bank' ? <Building2 size={24}/> : <Wallet size={24}/>}
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-black leading-tight ${textMain}`}>{isRTL ? tr.name_ar : tr.name_en}</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-1">{tr.type === 'bank' ? t.bank : t.cash}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-blue-600 transition bg-slate-50 dark:bg-slate-800 rounded-lg"><MoreHorizontal size={18}/></button>
                                </div>

                                {tr.type === 'bank' && (
                                    <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold mb-1">{t.modals.bankName}</div>
                                            <div className={`text-xs font-bold ${textMain}`}>{tr.bank_name || '---'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold mb-1">{t.modals.accNum}</div>
                                            <div className={`text-xs font-mono font-bold ${textMain}`}>{tr.account_number || '---'}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.balance}</div>
                                        <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                                            {Number(tr.balance).toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-sm font-bold text-slate-400">SAR</span>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${tr.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {tr.is_active ? <><CheckCircle2 size={12}/> {t.active}</> : <><XCircle size={12}/> {t.inactive}</>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 🚀 MODAL 1: إضافة خزينة / بنك --- */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-2xl my-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                            
                            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                                <h2 className={`text-xl font-black flex items-center gap-2 ${textMain}`}><Landmark className="text-blue-500"/> {t.modals.addTitle}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:text-red-500 transition"><X size={20}/></button>
                            </div>

                            <form onSubmit={handleAddAccount} className="p-8 space-y-6">
                                {/* Type Selection (Radio Cards) */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-3 block">{t.modals.type}</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${accountForm.type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <input type="radio" name="type" value="cash" checked={accountForm.type === 'cash'} onChange={() => setAccountForm({...accountForm, type: 'cash'})} className="hidden"/>
                                            <Wallet size={28}/> <span className="font-bold text-sm">{t.cash}</span>
                                        </label>
                                        <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${accountForm.type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <input type="radio" name="type" value="bank" checked={accountForm.type === 'bank'} onChange={() => setAccountForm({...accountForm, type: 'bank'})} className="hidden"/>
                                            <Building2 size={28}/> <span className="font-bold text-sm">{t.bank}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.name} (عربي) *</label>
                                        <input required type="text" value={accountForm.name_ar} onChange={e=>setAccountForm({...accountForm, name_ar: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm ${inputBg}`} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.name} (EN) *</label>
                                        <input required type="text" dir="ltr" value={accountForm.name_en} onChange={e=>setAccountForm({...accountForm, name_en: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm ${inputBg}`} />
                                    </div>
                                </div>

                                {accountForm.type === 'bank' && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.bankName} *</label>
                                            <input required type="text" value={accountForm.bank_name} onChange={e=>setAccountForm({...accountForm, bank_name: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold text-sm ${inputBg}`} placeholder="e.g. Al Rajhi Bank" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.accNum} *</label>
                                            <input required type="text" dir="ltr" value={accountForm.account_number} onChange={e=>setAccountForm({...accountForm, account_number: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-bold font-mono text-sm ${inputBg}`} placeholder="SA..." />
                                        </div>
                                    </motion.div>
                                )}

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.desc}</label>
                                    <textarea rows={2} value={accountForm.description} onChange={e=>setAccountForm({...accountForm, description: e.target.value})} className={`w-full p-3.5 rounded-xl border outline-none font-medium text-sm resize-none ${inputBg}`} />
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className={`flex-1 py-4 rounded-xl font-bold text-sm transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.modals.cancel}</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>} {t.modals.save}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- 🚀 MODAL 2: التحويل الذكي بين الخزائن (Smart Transfer) --- */}
            <AnimatePresence>
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-4xl my-auto rounded-[3rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                            
                            <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                                <h2 className={`text-xl font-black flex items-center gap-2 ${textMain}`}><ArrowLeftRight className="text-blue-500"/> {t.modals.transferTitle}</h2>
                                <button onClick={() => setIsTransferModalOpen(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:text-red-500 transition"><X size={20}/></button>
                            </div>

                            <form onSubmit={handleTransfer} className="p-8">
                                
                                {/* 🚀 Smart Transfer Area (Split View) 🚀 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                    
                                    {/* Arrow Icon connecting columns */}
                                    <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-100 text-blue-600 rounded-full items-center justify-center z-10 border-4 border-white dark:border-slate-900">
                                        <ArrowLeftRight size={20} className={isRTL ? '' : 'rotate-180'}/>
                                    </div>

                                    {/* FROM Column */}
                                    <div className={`p-6 rounded-[2rem] border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
                                        <h3 className="font-black text-rose-600 mb-6 flex items-center gap-2"><TrendingDown size={18}/> {t.modals.from}</h3>
                                        
                                        <select required value={transferForm.from_id} onChange={e=>setTransferForm({...transferForm, from_id: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm mb-6 shadow-sm border cursor-pointer ${inputBg}`}>
                                            <option value="">-- اختر --</option>
                                            {treasuries.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{isRTL ? t.name_ar : t.name_en}</option>)}
                                        </select>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="text-[10px] text-slate-400 font-bold mb-1">{t.modals.balanceBefore}</div>
                                                <div className="font-mono font-black">{selectedFromObj ? selectedFromObj.balance.toLocaleString() : '0.00'}</div>
                                            </div>
                                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800/30">
                                                <div className="text-[10px] text-rose-500 font-bold mb-1">{t.modals.balanceAfter}</div>
                                                <div className="font-mono font-black text-rose-600">{selectedFromObj ? (selectedFromObj.balance - transferAmount).toLocaleString() : '0.00'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TO Column */}
                                    <div className={`p-6 rounded-[2rem] border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
                                        <h3 className="font-black text-emerald-600 mb-6 flex items-center gap-2"><TrendingUp size={18}/> {t.modals.to}</h3>
                                        
                                        <select required value={transferForm.to_id} onChange={e=>setTransferForm({...transferForm, to_id: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm mb-6 shadow-sm border cursor-pointer ${inputBg}`}>
                                            <option value="">-- اختر --</option>
                                            {treasuries.filter(t => t.is_active && t.id !== transferForm.from_id).map(t => <option key={t.id} value={t.id}>{isRTL ? t.name_ar : t.name_en}</option>)}
                                        </select>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="text-[10px] text-slate-400 font-bold mb-1">{t.modals.balanceBefore}</div>
                                                <div className="font-mono font-black">{selectedToObj ? selectedToObj.balance.toLocaleString() : '0.00'}</div>
                                            </div>
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                                <div className="text-[10px] text-emerald-600 font-bold mb-1">{t.modals.balanceAfter}</div>
                                                <div className="font-mono font-black text-emerald-600">{selectedToObj ? (selectedToObj.balance + transferAmount).toLocaleString() : '0.00'}</div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Common Fields */}
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.amount} *</label>
                                        <div className="relative">
                                            <input required type="number" min="0.01" step="0.01" value={transferForm.amount} onChange={e=>setTransferForm({...transferForm, amount: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-mono font-black text-lg border focus:ring-2 focus:ring-blue-100 ${inputBg}`} placeholder="0.00" />
                                            <span className={`absolute top-4 font-bold text-slate-400 ${isRTL ? 'left-4' : 'right-4'}`}>SAR</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.date} *</label>
                                        <input required type="date" value={transferForm.date} onChange={e=>setTransferForm({...transferForm, date: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-bold text-sm border cursor-pointer ${inputBg}`} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">{t.modals.notes}</label>
                                        <input type="text" value={transferForm.notes} onChange={e=>setTransferForm({...transferForm, notes: e.target.value})} className={`w-full p-4 rounded-xl outline-none font-medium text-sm border ${inputBg}`} placeholder="سبب التحويل..." />
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                                    <button type="button" onClick={() => setIsTransferModalOpen(false)} className={`flex-1 py-4 rounded-xl font-bold text-sm transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t.modals.cancel}</button>
                                    <button type="submit" disabled={isSubmitting || !transferForm.from_id || !transferForm.to_id || transferAmount <= 0} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <ArrowLeftRight size={18}/>} إتمام التحويل
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
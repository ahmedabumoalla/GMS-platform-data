'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '../../../layout'; 
import { useRouter } from 'next/navigation';
import { 
    Search, Plus, Truck, MapPin, Phone, Mail, 
    ArrowRight, ArrowLeft, Loader2, X, 
    Building2, AlertTriangle, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Supplier {
    id: string;
    name_ar: string;
    name_en: string;
    tax_number: string;
    cr_number: string;
    address_short: string;
    contact_phone: string;
    contact_email: string;
    balance: number;
}

export default function SuppliersListPage() {
    const { lang, isDark } = useDashboard();
    const router = useRouter();
    const isRTL = lang === 'ar';

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchSuppliers = async () => {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (!error && data) setSuppliers(data as Supplier[]);
            setLoading(false);
        };
        fetchSuppliers();
    }, []);

    // --- Processing ---
    const filteredSuppliers = suppliers.filter(s => 
        s.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.name_en && s.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.tax_number && s.tax_number.includes(searchQuery)) ||
        (s.cr_number && s.cr_number.includes(searchQuery))
    );

    const totalDebt = suppliers.reduce((sum, s) => sum + Number(s.balance), 0);

    // --- Dictionary ---
    const t = {
        ar: {
            title: 'قائمة الموردين', subtitle: 'إدارة بيانات الموردين، حساباتهم، وطرق التواصل.',
            newSupplier: 'مورد جديد', search: 'بحث باسم المورد، السجل، الضريبي...',
            totalDebt: 'إجمالي المستحقات للموردين',
            empty: 'لا يوجد موردين مسجلين.',
            profile: 'ملف المورد', balance: 'الرصيد المستحق',
            clearBalance: 'رصيد سليم (لا توجد مستحقات)', hasDebt: 'مستحقات غير مدفوعة',
            taxNum: 'الرقم الضريبي', crNum: 'السجل التجاري',
            contact: 'معلومات التواصل', address: 'العنوان',
            soa: 'كشف حساب المورد'
        },
        en: {
            title: 'Suppliers List', subtitle: 'Manage suppliers, accounts, and contact info.',
            newSupplier: 'New Supplier', search: 'Search by name, CR, VAT...',
            totalDebt: 'Total Payables to Suppliers',
            empty: 'No suppliers found.',
            profile: 'Supplier Profile', balance: 'Outstanding Balance',
            clearBalance: 'Clear Balance', hasDebt: 'Unpaid Payables',
            taxNum: 'VAT Number', crNum: 'CR Number',
            contact: 'Contact Info', address: 'Address',
            soa: 'Statement of Account'
        }
    }[lang as 'ar' | 'en'] || {
        title: 'Suppliers', subtitle: 'Manage suppliers',
        newSupplier: 'Add Supplier', search: 'Search...',
        totalDebt: 'Total Payables', empty: 'No suppliers.',
        profile: 'Profile', balance: 'Balance',
        clearBalance: 'Clear', hasDebt: 'Debt',
        taxNum: 'VAT', crNum: 'CR', contact: 'Contact', address: 'Address', soa: 'SOA'
    };

    const bgMain = isDark ? "bg-slate-950" : "bg-slate-50";
    const textMain = isDark ? "text-white" : "text-slate-900";
    const cardBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";

    return (
        <div className={`min-h-screen font-sans ${bgMain} ${isRTL ? 'dir-rtl' : 'dir-ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* Header & Search */}
            <div className={`border-b px-6 md:px-8 py-6 sticky top-0 z-20 backdrop-blur-xl ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className={`text-2xl font-black flex items-center gap-3 ${textMain}`}>
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Truck size={24}/></div>
                            {t.title}
                        </h1>
                        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="text-right hidden sm:block bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl">
                            <div className="text-[10px] text-rose-500 font-bold mb-1 uppercase tracking-widest">{t.totalDebt}</div>
                            <div className="text-xl font-mono font-black text-rose-600 dark:text-rose-400">{totalDebt.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs">SAR</span></div>
                        </div>
                        <button onClick={() => router.push('/dashboard/finance/suppliers/new')} className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition flex items-center justify-center gap-2 active:scale-95">
                            <Plus size={18}/> {t.newSupplier}
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto relative max-w-md">
                    <Search className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-slate-400 w-5 h-5`} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search} className={`w-full border rounded-2xl px-5 py-3 text-sm font-bold outline-none transition ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500 shadow-sm'}`} />
                </div>
            </div>

            {/* Suppliers Grid */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin text-indigo-600" size={50} /></div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="text-center py-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem]">
                        <Truck size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4"/>
                        <div className={`font-black text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.empty}</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {filteredSuppliers.map(supplier => (
                            <motion.div 
                                initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={supplier.id} 
                                onClick={() => setSelectedSupplier(supplier)}
                                className={`cursor-pointer rounded-[2rem] border transition-all duration-300 relative overflow-hidden hover:shadow-xl hover:-translate-y-1 group ${cardBg}`}
                            >
                                {/* Indicator Line */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${supplier.balance > 0 ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-inner border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <Building2 size={20}/>
                                        </div>
                                        {supplier.balance > 0 && <AlertTriangle className="text-rose-500" size={18}/>}
                                    </div>
                                    <h3 className={`text-lg font-black leading-tight mb-2 line-clamp-2 ${textMain}`}>{isRTL ? supplier.name_ar : (supplier.name_en || supplier.name_ar)}</h3>
                                    <p className="text-[10px] font-mono text-slate-400 mb-4">CR: {supplier.cr_number || 'N/A'} | VAT: {supplier.tax_number || 'N/A'}</p>
                                    
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.balance}</div>
                                        <div className={`text-xl font-mono font-black ${supplier.balance > 0 ? 'text-rose-500' : 'text-indigo-500'}`}>
                                            {Number(supplier.balance).toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-xs">SAR</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 🚀 SLIDE-OVER PANEL (Supplier Details) --- */}
            <AnimatePresence>
                {selectedSupplier && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                            onClick={() => setSelectedSupplier(null)}
                        />
                        
                        <motion.div 
                            initial={{ x: isRTL ? '-100%' : '100%', opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }} 
                            exit={{ x: isRTL ? '-100%' : '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`fixed top-0 bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-full max-w-md z-[101] shadow-2xl flex flex-col ${isDark ? 'bg-slate-950 border-r border-slate-800' : 'bg-white'}`}
                        >
                            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className={`text-xl font-black ${textMain}`}>{t.profile}</h2>
                                <button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition"><X size={20}/></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                
                                {/* 1. Balance Alert */}
                                <div className={`p-5 rounded-2xl border-2 ${selectedSupplier.balance > 0 ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30' : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-900/30'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`text-xs font-bold ${selectedSupplier.balance > 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                                            {selectedSupplier.balance > 0 ? t.hasDebt : t.clearBalance}
                                        </div>
                                        {selectedSupplier.balance > 0 && <AlertTriangle size={16} className="text-rose-500 animate-pulse"/>}
                                    </div>
                                    <div className={`text-3xl font-mono font-black ${selectedSupplier.balance > 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                                        {Number(selectedSupplier.balance).toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-sm">SAR</span>
                                    </div>
                                    
                                    <button onClick={() => router.push(`/dashboard/finance/suppliers/balances`)} className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 transition ${selectedSupplier.balance > 0 ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                                        <FileText size={16}/> {t.soa}
                                    </button>
                                </div>

                                {/* 2. Main Info */}
                                <div>
                                    <h3 className={`text-2xl font-black mb-1 ${textMain}`}>{isRTL ? selectedSupplier.name_ar : (selectedSupplier.name_en || selectedSupplier.name_ar)}</h3>
                                    {selectedSupplier.name_en && isRTL && <p className="text-xs font-bold text-slate-400 mb-4">{selectedSupplier.name_en}</p>}
                                    
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="text-[10px] font-bold text-slate-500 block mb-1">{t.taxNum}</span>
                                            <span className={`font-mono font-bold text-sm ${textMain}`}>{selectedSupplier.tax_number || '-'}</span>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                            <span className="text-[10px] font-bold text-slate-500 block mb-1">{t.crNum}</span>
                                            <span className={`font-mono font-bold text-sm ${textMain}`}>{selectedSupplier.cr_number || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Contacts */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2"><Phone size={14}/> {t.contact}</h4>
                                    {selectedSupplier.contact_phone ? (
                                        <div className="flex items-center gap-3 text-sm font-bold"><Phone size={16} className="text-slate-400"/> <span dir="ltr">{selectedSupplier.contact_phone}</span></div>
                                    ) : <div className="text-xs text-slate-400">غير متوفر</div>}
                                    
                                    {selectedSupplier.contact_email && (
                                        <div className="flex items-center gap-3 text-sm font-bold"><Mail size={16} className="text-slate-400"/> {selectedSupplier.contact_email}</div>
                                    )}
                                </div>

                                {/* 4. Address */}
                                {selectedSupplier.address_short && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2"><MapPin size={14}/> {t.address}</h4>
                                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div className="font-mono font-bold text-sm text-indigo-600">{selectedSupplier.address_short}</div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}